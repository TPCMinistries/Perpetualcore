/**
 * GitHub Skill (SDK Upgrade)
 *
 * Full GitHub integration using @octokit/rest SDK.
 * Supports repos, issues, PRs, files, code search, and Actions.
 */

import { Octokit } from "@octokit/rest";
import { Skill, ToolContext, ToolResult } from "../types";
import { resolveCredential } from "../credentials";

async function getClient(context: ToolContext): Promise<Octokit | null> {
  const cred = await resolveCredential("github", context.userId, context.organizationId);
  if (!cred) return null;
  return new Octokit({ auth: cred.key, userAgent: "PerpetualCore/2.0" });
}

function splitRepo(repo: string): { owner: string; repo: string } {
  const [owner, name] = repo.split("/");
  return { owner, repo: name };
}

// --- Tool Functions ---

async function searchRepos(
  params: { query: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const octokit = await getClient(context);
  if (!octokit) {
    return { success: false, error: "GitHub not connected. Please connect GitHub in Settings > Skills." };
  }

  try {
    const { data } = await octokit.search.repos({
      q: params.query,
      per_page: params.limit || 10,
      sort: "updated",
    });

    const repos = data.items.map((r) => ({
      name: r.full_name,
      description: r.description,
      stars: r.stargazers_count,
      language: r.language,
      updated: r.updated_at,
      url: r.html_url,
    }));

    return {
      success: true,
      data: { query: params.query, total: data.total_count, repos },
      display: {
        type: "table",
        content: {
          headers: ["Repository", "Stars", "Language", "Updated"],
          rows: repos.slice(0, 10).map((r) => [
            r.name,
            r.stars.toString(),
            r.language || "-",
            new Date(r.updated!).toLocaleDateString(),
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createIssue(
  params: { repo: string; title: string; body?: string; labels?: string[]; assignees?: string[] },
  context: ToolContext
): Promise<ToolResult> {
  const octokit = await getClient(context);
  if (!octokit) {
    return { success: false, error: "GitHub not connected." };
  }

  try {
    const { owner, repo } = splitRepo(params.repo);
    const { data } = await octokit.issues.create({
      owner,
      repo,
      title: params.title,
      body: params.body,
      labels: params.labels,
      assignees: params.assignees,
    });

    return {
      success: true,
      data: { number: data.number, title: data.title, url: data.html_url },
      display: {
        type: "card",
        content: {
          title: `Issue #${data.number}: ${data.title}`,
          description: "Issue created successfully",
          fields: [{ label: "URL", value: data.html_url }],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function listIssues(
  params: { repo: string; state?: "open" | "closed" | "all"; labels?: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const octokit = await getClient(context);
  if (!octokit) {
    return { success: false, error: "GitHub not connected." };
  }

  try {
    const { owner, repo } = splitRepo(params.repo);
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: params.state || "open",
      labels: params.labels,
      per_page: params.limit || 10,
    });

    const issues = data
      .filter((i) => !i.pull_request)
      .map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        author: i.user?.login,
        labels: i.labels?.map((l: any) => (typeof l === "string" ? l : l.name)),
        created: i.created_at,
        url: i.html_url,
      }));

    return {
      success: true,
      data: issues,
      display: {
        type: "table",
        content: {
          headers: ["#", "Title", "Author", "Labels"],
          rows: issues.slice(0, 10).map((i) => [
            `#${i.number}`,
            i.title.substring(0, 60),
            i.author || "-",
            i.labels?.join(", ") || "-",
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createPr(
  params: { repo: string; title: string; head: string; base: string; body?: string; draft?: boolean },
  context: ToolContext
): Promise<ToolResult> {
  const octokit = await getClient(context);
  if (!octokit) {
    return { success: false, error: "GitHub not connected." };
  }

  try {
    const { owner, repo } = splitRepo(params.repo);
    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title: params.title,
      head: params.head,
      base: params.base,
      body: params.body,
      draft: params.draft,
    });

    return {
      success: true,
      data: { number: data.number, title: data.title, url: data.html_url },
      display: {
        type: "card",
        content: {
          title: `PR #${data.number}: ${data.title}`,
          description: `${params.head} → ${params.base}`,
          fields: [{ label: "URL", value: data.html_url }],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function reviewPr(
  params: { repo: string; pullNumber: number; event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT"; body?: string },
  context: ToolContext
): Promise<ToolResult> {
  const octokit = await getClient(context);
  if (!octokit) {
    return { success: false, error: "GitHub not connected." };
  }

  try {
    const { owner, repo } = splitRepo(params.repo);
    const { data } = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: params.pullNumber,
      event: params.event,
      body: params.body,
    });

    return {
      success: true,
      data: { id: data.id, state: data.state },
      display: {
        type: "text",
        content: `Review submitted: ${params.event} on PR #${params.pullNumber}`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getFile(
  params: { repo: string; path: string; ref?: string },
  context: ToolContext
): Promise<ToolResult> {
  const octokit = await getClient(context);
  if (!octokit) {
    return { success: false, error: "GitHub not connected." };
  }

  try {
    const { owner, repo } = splitRepo(params.repo);
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: params.path,
      ref: params.ref,
    });

    if (Array.isArray(data)) {
      return {
        success: true,
        data: data.map((f) => ({ name: f.name, type: f.type, path: f.path })),
        display: {
          type: "table",
          content: {
            headers: ["Name", "Type", "Path"],
            rows: data.map((f) => [f.name, f.type, f.path]),
          },
        },
      };
    }

    const content =
      "content" in data && data.content
        ? Buffer.from(data.content, "base64").toString("utf-8")
        : "";

    return {
      success: true,
      data: { path: params.path, size: (data as any).size, content },
      display: {
        type: "code",
        content: { language: params.path.split(".").pop() || "text", code: content },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createFile(
  params: { repo: string; path: string; content: string; message: string; branch?: string; sha?: string },
  context: ToolContext
): Promise<ToolResult> {
  const octokit = await getClient(context);
  if (!octokit) {
    return { success: false, error: "GitHub not connected." };
  }

  try {
    const { owner, repo } = splitRepo(params.repo);
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: params.path,
      message: params.message,
      content: Buffer.from(params.content).toString("base64"),
      branch: params.branch,
      sha: params.sha,
    });

    return {
      success: true,
      data: { path: params.path, sha: data.content?.sha },
      display: {
        type: "text",
        content: `File ${params.sha ? "updated" : "created"}: ${params.path}`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function listCommits(
  params: { repo: string; sha?: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const octokit = await getClient(context);
  if (!octokit) {
    return { success: false, error: "GitHub not connected." };
  }

  try {
    const { owner, repo } = splitRepo(params.repo);
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      sha: params.sha,
      per_page: params.limit || 10,
    });

    const commits = data.map((c) => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message.split("\n")[0],
      author: c.commit.author?.name || c.author?.login || "-",
      date: c.commit.author?.date,
    }));

    return {
      success: true,
      data: commits,
      display: {
        type: "table",
        content: {
          headers: ["SHA", "Message", "Author", "Date"],
          rows: commits.map((c) => [
            c.sha,
            c.message.substring(0, 60),
            c.author,
            c.date ? new Date(c.date).toLocaleDateString() : "-",
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function searchCode(
  params: { query: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const octokit = await getClient(context);
  if (!octokit) {
    return { success: false, error: "GitHub not connected." };
  }

  try {
    const { data } = await octokit.search.code({
      q: params.query,
      per_page: params.limit || 10,
    });

    const results = data.items.map((item) => ({
      repo: item.repository.full_name,
      path: item.path,
      name: item.name,
      url: item.html_url,
    }));

    return {
      success: true,
      data: { total: data.total_count, results },
      display: {
        type: "table",
        content: {
          headers: ["Repository", "File", "Path"],
          rows: results.slice(0, 10).map((r) => [r.repo, r.name, r.path]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function listWorkflows(
  params: { repo: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const octokit = await getClient(context);
  if (!octokit) {
    return { success: false, error: "GitHub not connected." };
  }

  try {
    const { owner, repo } = splitRepo(params.repo);
    const { data } = await octokit.actions.listRepoWorkflows({
      owner,
      repo,
      per_page: params.limit || 10,
    });

    const workflows = data.workflows.map((w) => ({
      id: w.id,
      name: w.name,
      state: w.state,
      path: w.path,
    }));

    return {
      success: true,
      data: { total: data.total_count, workflows },
      display: {
        type: "table",
        content: {
          headers: ["Name", "State", "Path"],
          rows: workflows.map((w) => [w.name, w.state, w.path]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Skill Export ---

export const githubSkill: Skill = {
  id: "github",
  name: "GitHub",
  description: "Full GitHub integration — repos, issues, PRs, files, code search, and Actions",
  version: "2.0.0",
  author: "Perpetual Core",

  category: "development",
  tags: ["github", "git", "code", "development", "issues", "pull-requests", "actions"],

  icon: "🐙",
  color: "#24292E",

  tier: "free",
  isBuiltIn: true,

  requiredIntegrations: ["github"],

  tools: [
    {
      name: "search_repos",
      description: "Search GitHub repositories by query",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (GitHub search syntax)" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["query"],
      },
      execute: searchRepos,
    },
    {
      name: "create_issue",
      description: "Create a new issue in a repository",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repository in format 'owner/repo'" },
          title: { type: "string", description: "Issue title" },
          body: { type: "string", description: "Issue body (Markdown)" },
          labels: { type: "array", description: "Label names to apply" },
          assignees: { type: "array", description: "GitHub usernames to assign" },
        },
        required: ["repo", "title"],
      },
      execute: createIssue,
    },
    {
      name: "list_issues",
      description: "List issues for a repository with optional filters",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repository in format 'owner/repo'" },
          state: { type: "string", description: "Issue state", enum: ["open", "closed", "all"] },
          labels: { type: "string", description: "Comma-separated label names" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["repo"],
      },
      execute: listIssues,
    },
    {
      name: "create_pr",
      description: "Create a pull request",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repository in format 'owner/repo'" },
          title: { type: "string", description: "PR title" },
          head: { type: "string", description: "Source branch" },
          base: { type: "string", description: "Target branch" },
          body: { type: "string", description: "PR body (Markdown)" },
          draft: { type: "boolean", description: "Create as draft PR" },
        },
        required: ["repo", "title", "head", "base"],
      },
      execute: createPr,
    },
    {
      name: "review_pr",
      description: "Add a review to a pull request",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repository in format 'owner/repo'" },
          pullNumber: { type: "number", description: "Pull request number" },
          event: { type: "string", description: "Review action", enum: ["APPROVE", "REQUEST_CHANGES", "COMMENT"] },
          body: { type: "string", description: "Review comment" },
        },
        required: ["repo", "pullNumber", "event"],
      },
      execute: reviewPr,
    },
    {
      name: "get_file",
      description: "Get file contents from a repository",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repository in format 'owner/repo'" },
          path: { type: "string", description: "File path in the repository" },
          ref: { type: "string", description: "Branch or commit ref (optional)" },
        },
        required: ["repo", "path"],
      },
      execute: getFile,
    },
    {
      name: "create_file",
      description: "Create or update a file in a repository",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repository in format 'owner/repo'" },
          path: { type: "string", description: "File path" },
          content: { type: "string", description: "File content" },
          message: { type: "string", description: "Commit message" },
          branch: { type: "string", description: "Branch name (optional)" },
          sha: { type: "string", description: "SHA of the file to update (required for updates)" },
        },
        required: ["repo", "path", "content", "message"],
      },
      execute: createFile,
    },
    {
      name: "list_commits",
      description: "List recent commits in a repository",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repository in format 'owner/repo'" },
          sha: { type: "string", description: "Branch name or commit SHA (optional)" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["repo"],
      },
      execute: listCommits,
    },
    {
      name: "search_code",
      description: "Search code across GitHub repositories",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Code search query (GitHub search syntax)" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["query"],
      },
      execute: searchCode,
    },
    {
      name: "list_workflows",
      description: "List GitHub Actions workflows in a repository",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repository in format 'owner/repo'" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["repo"],
      },
      execute: listWorkflows,
    },
  ],

  systemPrompt: `You have access to GitHub via the Octokit SDK. Available actions:
- search_repos: Search repositories
- create_issue / list_issues: Manage issues
- create_pr / review_pr: Manage pull requests
- get_file / create_file: Read and write files
- list_commits: View commit history
- search_code: Search code across repos
- list_workflows: View GitHub Actions
Always use 'owner/repo' format for repository names. Confirm before creating issues, PRs, or modifying files.`,
};
