/**
 * Linear Skill
 *
 * Manage issues and projects in Linear.
 * Uses BYOK (Bring Your Own Key) for API authentication.
 */

import { Skill, ToolContext, ToolResult } from "../types";
import { resolveCredential } from "../credentials";
import { createAdminClient } from "@/lib/supabase/server";

const LINEAR_API = "https://api.linear.app/graphql";

/**
 * Execute a GraphQL query against Linear API
 */
async function linearQuery(
  query: string,
  variables: Record<string, any>,
  userId: string,
  organizationId?: string
): Promise<{ data?: any; error?: string }> {
  const credential = await resolveCredential("linear", userId, organizationId);

  if (!credential) {
    return { error: "Linear not connected. Add your API key in Settings > Integrations." };
  }

  try {
    const response = await fetch(LINEAR_API, {
      method: "POST",
      headers: {
        Authorization: credential.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { error: "Invalid Linear API key. Please update in Settings." };
      }
      return { error: `Linear API error: ${response.status}` };
    }

    const result = await response.json();

    if (result.errors) {
      return { error: result.errors[0]?.message || "GraphQL error" };
    }

    return { data: result.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Sync Linear issues to external_tasks table
 */
async function syncToDatabase(
  userId: string,
  organizationId: string,
  issues: any[]
): Promise<number> {
  const supabase = createAdminClient();
  let synced = 0;

  for (const issue of issues) {
    // Map Linear priority (0=no priority, 1=urgent, 4=low) to our format (1=highest, 4=lowest)
    const priorityMap: Record<number, number> = { 0: 3, 1: 1, 2: 2, 3: 3, 4: 4 };

    // Map Linear state to our status
    const statusMap = (stateName: string): string => {
      const lower = stateName.toLowerCase();
      if (lower.includes("done") || lower.includes("complete") || lower.includes("closed")) {
        return "completed";
      }
      if (lower.includes("progress") || lower.includes("review") || lower.includes("started")) {
        return "in_progress";
      }
      if (lower.includes("cancel")) {
        return "cancelled";
      }
      return "open";
    };

    const taskData = {
      user_id: userId,
      organization_id: organizationId,
      provider: "linear",
      provider_task_id: issue.id,
      provider_project_id: issue.project?.id || null,
      provider_project_name: issue.project?.name || null,
      title: issue.title,
      description: issue.description || null,
      status: statusMap(issue.state?.name || ""),
      priority: priorityMap[issue.priority] || 3,
      due_date: issue.dueDate || null,
      linear_team_id: issue.team?.id || null,
      linear_team_name: issue.team?.name || null,
      linear_assignee_id: issue.assignee?.id || null,
      linear_assignee_name: issue.assignee?.name || null,
      linear_state_id: issue.state?.id || null,
      linear_state_name: issue.state?.name || null,
      linear_identifier: issue.identifier,
      url: issue.url,
      raw_data: issue,
      synced_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("external_tasks").upsert(taskData, {
      onConflict: "user_id,provider,provider_task_id",
    });

    if (!error) synced++;
  }

  return synced;
}

/**
 * List teams the user has access to
 */
async function listTeams(params: {}, context: ToolContext): Promise<ToolResult> {
  const query = `
    query {
      teams {
        nodes {
          id
          name
          key
          description
          color
        }
      }
    }
  `;

  const result = await linearQuery(query, {}, context.userId, context.organizationId);

  if (result.error) {
    return { success: false, error: result.error };
  }

  const teams = result.data?.teams?.nodes || [];

  return {
    success: true,
    data: { teams },
    display: {
      type: "table",
      content: {
        headers: ["Team", "Key", "Description"],
        rows: teams.map((t: any) => [t.name, t.key, (t.description || "").substring(0, 40)]),
      },
    },
  };
}

/**
 * List issues with optional filters
 */
async function listIssues(
  params: {
    teamId?: string;
    teamKey?: string;
    assignedToMe?: boolean;
    status?: string;
    priority?: number;
    limit?: number;
  },
  context: ToolContext
): Promise<ToolResult> {
  const limit = params.limit || 20;

  // Build filter
  const filterParts: string[] = [];

  if (params.teamId) {
    filterParts.push(`team: { id: { eq: "${params.teamId}" } }`);
  } else if (params.teamKey) {
    filterParts.push(`team: { key: { eq: "${params.teamKey}" } }`);
  }

  if (params.assignedToMe) {
    filterParts.push(`assignee: { isMe: { eq: true } }`);
  }

  if (params.status) {
    filterParts.push(`state: { name: { containsIgnoreCase: "${params.status}" } }`);
  }

  if (params.priority) {
    filterParts.push(`priority: { eq: ${params.priority} }`);
  }

  const filterStr = filterParts.length > 0 ? `filter: { ${filterParts.join(", ")} }` : "";

  const query = `
    query($first: Int!) {
      issues(first: $first, ${filterStr}, orderBy: updatedAt) {
        nodes {
          id
          identifier
          title
          description
          priority
          priorityLabel
          dueDate
          url
          state {
            id
            name
            color
            type
          }
          team {
            id
            name
            key
          }
          assignee {
            id
            name
            email
          }
          project {
            id
            name
          }
          labels {
            nodes {
              name
              color
            }
          }
          createdAt
          updatedAt
        }
      }
    }
  `;

  const result = await linearQuery(query, { first: limit }, context.userId, context.organizationId);

  if (result.error) {
    return { success: false, error: result.error };
  }

  const issues = result.data?.issues?.nodes || [];

  // Sync to database
  await syncToDatabase(context.userId, context.organizationId, issues).catch(() => {});

  if (issues.length === 0) {
    return {
      success: true,
      data: { issues: [], count: 0 },
      display: {
        type: "text",
        content: params.assignedToMe
          ? "🎉 No issues assigned to you! Your plate is clear."
          : "No issues found matching your criteria.",
      },
    };
  }

  const priorityEmoji = (p: number) => {
    switch (p) {
      case 1: return "🔴"; // Urgent
      case 2: return "🟠"; // High
      case 3: return "🟡"; // Medium
      case 4: return "🔵"; // Low
      default: return "⚪"; // No priority
    }
  };

  const formattedIssues = issues.map((i: any) => ({
    id: i.id,
    identifier: i.identifier,
    title: i.title,
    status: i.state?.name,
    priority: i.priority,
    priorityLabel: i.priorityLabel,
    assignee: i.assignee?.name,
    team: i.team?.name,
    dueDate: i.dueDate,
    url: i.url,
    labels: i.labels?.nodes?.map((l: any) => l.name) || [],
  }));

  return {
    success: true,
    data: { issues: formattedIssues, count: formattedIssues.length },
    display: {
      type: "table",
      content: {
        headers: ["P", "ID", "Title", "Status", "Assignee"],
        rows: formattedIssues.slice(0, 15).map((i: any) => [
          priorityEmoji(i.priority),
          i.identifier,
          i.title.substring(0, 35) + (i.title.length > 35 ? "..." : ""),
          i.status || "-",
          i.assignee || "-",
        ]),
      },
    },
  };
}

/**
 * Get issues assigned to the current user
 */
async function getMyIssues(params: { limit?: number }, context: ToolContext): Promise<ToolResult> {
  return listIssues({ assignedToMe: true, limit: params.limit || 20 }, context);
}

/**
 * Create a new issue
 */
async function createIssue(
  params: {
    teamId?: string;
    teamKey?: string;
    title: string;
    description?: string;
    priority?: number;
    assigneeId?: string;
    labelIds?: string[];
    dueDate?: string;
    projectId?: string;
  },
  context: ToolContext
): Promise<ToolResult> {
  // Get team ID if only key provided
  let teamId = params.teamId;
  if (!teamId && params.teamKey) {
    const teamsResult = await listTeams({}, context);
    if (teamsResult.success && teamsResult.data?.teams) {
      const team = teamsResult.data.teams.find(
        (t: any) => t.key.toLowerCase() === params.teamKey!.toLowerCase()
      );
      if (team) {
        teamId = team.id;
      }
    }
  }

  if (!teamId) {
    return {
      success: false,
      error: "Team ID or key is required. Use list_teams to find available teams.",
    };
  }

  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          url
          state {
            name
          }
          team {
            name
          }
        }
      }
    }
  `;

  const input: any = {
    teamId,
    title: params.title,
  };

  if (params.description) input.description = params.description;
  if (params.priority) input.priority = params.priority;
  if (params.assigneeId) input.assigneeId = params.assigneeId;
  if (params.labelIds) input.labelIds = params.labelIds;
  if (params.dueDate) input.dueDate = params.dueDate;
  if (params.projectId) input.projectId = params.projectId;

  const result = await linearQuery(mutation, { input }, context.userId, context.organizationId);

  if (result.error) {
    return { success: false, error: result.error };
  }

  const createResult = result.data?.issueCreate;

  if (!createResult?.success) {
    return { success: false, error: "Failed to create issue" };
  }

  const issue = createResult.issue;

  return {
    success: true,
    data: {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
    },
    display: {
      type: "card",
      content: {
        title: `✅ Created: ${issue.identifier}`,
        description: issue.title,
        fields: [
          { label: "Team", value: issue.team?.name || "-" },
          { label: "Status", value: issue.state?.name || "Backlog" },
          { label: "URL", value: issue.url },
        ],
      },
    },
  };
}

/**
 * Update an issue
 */
async function updateIssue(
  params: {
    issueId?: string;
    identifier?: string;
    stateId?: string;
    stateName?: string;
    priority?: number;
    assigneeId?: string;
    title?: string;
    description?: string;
    dueDate?: string;
  },
  context: ToolContext
): Promise<ToolResult> {
  // Get issue ID from identifier if needed
  let issueId = params.issueId;

  if (!issueId && params.identifier) {
    const query = `
      query($identifier: String!) {
        issue(id: $identifier) {
          id
        }
      }
    `;
    const findResult = await linearQuery(
      query,
      { identifier: params.identifier },
      context.userId,
      context.organizationId
    );
    if (findResult.data?.issue?.id) {
      issueId = findResult.data.issue.id;
    }
  }

  if (!issueId) {
    return { success: false, error: "Issue ID or identifier required" };
  }

  // If stateName provided, look up stateId
  let stateId = params.stateId;
  if (!stateId && params.stateName) {
    const statesQuery = `
      query {
        workflowStates {
          nodes {
            id
            name
            team { id }
          }
        }
      }
    `;
    const statesResult = await linearQuery(statesQuery, {}, context.userId, context.organizationId);
    if (statesResult.data?.workflowStates?.nodes) {
      const state = statesResult.data.workflowStates.nodes.find(
        (s: any) => s.name.toLowerCase().includes(params.stateName!.toLowerCase())
      );
      if (state) {
        stateId = state.id;
      }
    }
  }

  const mutation = `
    mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
        issue {
          id
          identifier
          title
          url
          state {
            name
          }
          assignee {
            name
          }
        }
      }
    }
  `;

  const input: any = {};
  if (stateId) input.stateId = stateId;
  if (params.priority !== undefined) input.priority = params.priority;
  if (params.assigneeId) input.assigneeId = params.assigneeId;
  if (params.title) input.title = params.title;
  if (params.description) input.description = params.description;
  if (params.dueDate) input.dueDate = params.dueDate;

  const result = await linearQuery(
    mutation,
    { id: issueId, input },
    context.userId,
    context.organizationId
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  const updateResult = result.data?.issueUpdate;

  if (!updateResult?.success) {
    return { success: false, error: "Failed to update issue" };
  }

  const issue = updateResult.issue;

  return {
    success: true,
    data: {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      state: issue.state?.name,
    },
    display: {
      type: "text",
      content: `✅ Updated ${issue.identifier}: "${issue.title}" → ${issue.state?.name || "updated"}`,
    },
  };
}

/**
 * Get issue details
 */
async function getIssue(
  params: { issueId?: string; identifier?: string },
  context: ToolContext
): Promise<ToolResult> {
  const id = params.issueId || params.identifier;

  if (!id) {
    return { success: false, error: "Issue ID or identifier required" };
  }

  const query = `
    query($id: String!) {
      issue(id: $id) {
        id
        identifier
        title
        description
        priority
        priorityLabel
        dueDate
        url
        createdAt
        updatedAt
        state {
          name
          color
          type
        }
        team {
          name
          key
        }
        assignee {
          name
          email
        }
        creator {
          name
        }
        project {
          name
        }
        labels {
          nodes {
            name
            color
          }
        }
        comments {
          nodes {
            body
            user {
              name
            }
            createdAt
          }
        }
      }
    }
  `;

  const result = await linearQuery(query, { id }, context.userId, context.organizationId);

  if (result.error) {
    return { success: false, error: result.error };
  }

  const issue = result.data?.issue;

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  const priorityLabel = issue.priorityLabel || "No priority";
  const labels = issue.labels?.nodes?.map((l: any) => l.name).join(", ") || "None";

  return {
    success: true,
    data: { issue },
    display: {
      type: "card",
      content: {
        title: `${issue.identifier}: ${issue.title}`,
        description: issue.description?.substring(0, 200) || "No description",
        fields: [
          { label: "Status", value: issue.state?.name || "-" },
          { label: "Priority", value: priorityLabel },
          { label: "Team", value: issue.team?.name || "-" },
          { label: "Assignee", value: issue.assignee?.name || "Unassigned" },
          { label: "Due Date", value: issue.dueDate || "None" },
          { label: "Labels", value: labels },
        ],
      },
    },
  };
}

/**
 * Sync all issues
 */
async function syncIssues(params: { limit?: number }, context: ToolContext): Promise<ToolResult> {
  const limit = params.limit || 100;

  const query = `
    query($first: Int!) {
      issues(first: $first, orderBy: updatedAt) {
        nodes {
          id
          identifier
          title
          description
          priority
          dueDate
          url
          state {
            id
            name
            type
          }
          team {
            id
            name
          }
          assignee {
            id
            name
          }
          project {
            id
            name
          }
        }
      }
    }
  `;

  const result = await linearQuery(query, { first: limit }, context.userId, context.organizationId);

  if (result.error) {
    return { success: false, error: result.error };
  }

  const issues = result.data?.issues?.nodes || [];
  const synced = await syncToDatabase(context.userId, context.organizationId, issues);

  return {
    success: true,
    data: { synced, total: issues.length },
    display: {
      type: "text",
      content: `✅ Synced ${synced} issues from Linear.`,
    },
  };
}

export const linearSkill: Skill = {
  id: "linear",
  name: "Linear",
  description: "Manage issues and projects in Linear - create, update, and track engineering work",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "development",
  tags: ["linear", "issues", "project-management", "engineering", "agile"],

  icon: "🔷",
  color: "#5E6AD2",

  tier: "free",
  isBuiltIn: true,

  requiredEnvVars: [], // Uses BYOK

  configSchema: {
    apiKey: {
      type: "string",
      label: "Linear API Key",
      description: "Get your API key from Linear Settings > API > Personal API Keys",
      required: true,
      placeholder: "lin_api_...",
    },
  },

  tools: [
    {
      name: "list_teams",
      description: "List all Linear teams you have access to",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: listTeams,
    },
    {
      name: "list_issues",
      description: "List issues with optional filters",
      parameters: {
        type: "object",
        properties: {
          teamId: {
            type: "string",
            description: "Filter by team ID",
          },
          teamKey: {
            type: "string",
            description: "Filter by team key (e.g., 'ENG', 'DES')",
          },
          assignedToMe: {
            type: "boolean",
            description: "Only show issues assigned to me",
          },
          status: {
            type: "string",
            description: "Filter by status name (e.g., 'In Progress', 'Done')",
          },
          priority: {
            type: "number",
            description: "Filter by priority (1=Urgent, 2=High, 3=Medium, 4=Low, 0=None)",
          },
          limit: {
            type: "number",
            description: "Maximum issues to return (default: 20)",
          },
        },
      },
      execute: listIssues,
    },
    {
      name: "my_issues",
      description: "Get all issues assigned to you",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum issues to return (default: 20)",
          },
        },
      },
      execute: getMyIssues,
    },
    {
      name: "create_issue",
      description: "Create a new issue in Linear",
      parameters: {
        type: "object",
        properties: {
          teamId: {
            type: "string",
            description: "Team ID (get from list_teams)",
          },
          teamKey: {
            type: "string",
            description: "Team key (e.g., 'ENG') - alternative to teamId",
          },
          title: {
            type: "string",
            description: "Issue title",
          },
          description: {
            type: "string",
            description: "Issue description (Markdown supported)",
          },
          priority: {
            type: "number",
            description: "Priority: 1=Urgent, 2=High, 3=Medium, 4=Low, 0=None",
          },
          assigneeId: {
            type: "string",
            description: "User ID to assign (optional)",
          },
          dueDate: {
            type: "string",
            description: "Due date in ISO format (optional)",
          },
          projectId: {
            type: "string",
            description: "Project ID to add to (optional)",
          },
        },
        required: ["title"],
      },
      execute: createIssue,
    },
    {
      name: "update_issue",
      description: "Update an existing issue (change status, priority, assignee, etc.)",
      parameters: {
        type: "object",
        properties: {
          issueId: {
            type: "string",
            description: "Issue ID (UUID)",
          },
          identifier: {
            type: "string",
            description: "Issue identifier (e.g., 'ENG-123') - alternative to issueId",
          },
          stateId: {
            type: "string",
            description: "New state/status ID",
          },
          stateName: {
            type: "string",
            description: "New state name (e.g., 'In Progress', 'Done') - alternative to stateId",
          },
          priority: {
            type: "number",
            description: "New priority (1=Urgent, 2=High, 3=Medium, 4=Low)",
          },
          assigneeId: {
            type: "string",
            description: "New assignee user ID",
          },
          title: {
            type: "string",
            description: "New title",
          },
          description: {
            type: "string",
            description: "New description",
          },
          dueDate: {
            type: "string",
            description: "New due date (ISO format)",
          },
        },
      },
      execute: updateIssue,
    },
    {
      name: "get_issue",
      description: "Get detailed information about a specific issue",
      parameters: {
        type: "object",
        properties: {
          issueId: {
            type: "string",
            description: "Issue ID (UUID)",
          },
          identifier: {
            type: "string",
            description: "Issue identifier (e.g., 'ENG-123')",
          },
        },
      },
      execute: getIssue,
    },
    {
      name: "sync",
      description: "Sync all Linear issues to Perpetual Core",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum issues to sync (default: 100)",
          },
        },
      },
      execute: syncIssues,
    },
  ],

  systemPrompt: `You have access to Linear for issue tracking. When users ask about issues or work:
- Use "my_issues" to quickly see what's assigned to them
- Use "list_issues" with filters for specific queries (team, status, priority)
- Use "list_teams" to find team IDs/keys before creating issues
- Use "create_issue" to add new issues - team is required, can use teamKey like 'ENG'
- Use "update_issue" to change status, priority, or assignee
- Use "get_issue" for full details on a specific issue

Priority values: 1=Urgent (red), 2=High (orange), 3=Medium (yellow), 4=Low (blue), 0=None
Status updates use stateName like 'In Progress', 'Done', 'Backlog', etc.

Always show issue identifiers (like ENG-123) when listing so users can reference them.`,
};
