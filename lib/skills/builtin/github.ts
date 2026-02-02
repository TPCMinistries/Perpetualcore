/**
 * GitHub Skill
 *
 * Interact with GitHub repositories, issues, and pull requests.
 * Requires GitHub integration to be connected.
 */

import { Skill, ToolContext, ToolResult } from "../types";

const GITHUB_API = "https://api.github.com";

async function getHeaders(context: ToolContext): Promise<Headers | null> {
  // In a real implementation, this would get the user's GitHub token
  // from their connected integration
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  return new Headers({
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "PerpetualCore/1.0",
  });
}

async function listRepositories(
  params: { username?: string; org?: string; type?: string },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getHeaders(context);
  if (!headers) {
    return { success: false, error: "GitHub not connected. Please connect GitHub in integrations." };
  }

  try {
    let url = `${GITHUB_API}/user/repos?per_page=10&sort=updated`;
    if (params.org) {
      url = `${GITHUB_API}/orgs/${params.org}/repos?per_page=10&sort=updated`;
    } else if (params.username) {
      url = `${GITHUB_API}/users/${params.username}/repos?per_page=10&sort=updated`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      return { success: false, error: `GitHub API error: ${response.statusText}` };
    }

    const repos = await response.json();

    return {
      success: true,
      data: repos.map((repo: any) => ({
        name: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        language: repo.language,
        updated: repo.updated_at,
        url: repo.html_url,
      })),
      display: {
        type: "table",
        content: {
          headers: ["Repository", "Stars", "Language", "Updated"],
          rows: repos.slice(0, 5).map((repo: any) => [
            repo.full_name,
            repo.stargazers_count.toString(),
            repo.language || "-",
            new Date(repo.updated_at).toLocaleDateString(),
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function listIssues(
  params: { repo: string; state?: string; labels?: string },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getHeaders(context);
  if (!headers) {
    return { success: false, error: "GitHub not connected" };
  }

  try {
    const state = params.state || "open";
    let url = `${GITHUB_API}/repos/${params.repo}/issues?state=${state}&per_page=10`;
    if (params.labels) {
      url += `&labels=${encodeURIComponent(params.labels)}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      return { success: false, error: `GitHub API error: ${response.statusText}` };
    }

    const issues = await response.json();

    return {
      success: true,
      data: issues.map((issue: any) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        author: issue.user?.login,
        labels: issue.labels?.map((l: any) => l.name),
        created: issue.created_at,
        url: issue.html_url,
      })),
      display: {
        type: "table",
        content: {
          headers: ["#", "Title", "Author", "Labels"],
          rows: issues.slice(0, 5).map((issue: any) => [
            `#${issue.number}`,
            issue.title.substring(0, 50),
            issue.user?.login || "-",
            issue.labels?.map((l: any) => l.name).join(", ") || "-",
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function listPullRequests(
  params: { repo: string; state?: string },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getHeaders(context);
  if (!headers) {
    return { success: false, error: "GitHub not connected" };
  }

  try {
    const state = params.state || "open";
    const url = `${GITHUB_API}/repos/${params.repo}/pulls?state=${state}&per_page=10`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      return { success: false, error: `GitHub API error: ${response.statusText}` };
    }

    const prs = await response.json();

    return {
      success: true,
      data: prs.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        author: pr.user?.login,
        branch: pr.head?.ref,
        draft: pr.draft,
        created: pr.created_at,
        url: pr.html_url,
      })),
      display: {
        type: "table",
        content: {
          headers: ["#", "Title", "Author", "Branch"],
          rows: prs.slice(0, 5).map((pr: any) => [
            `#${pr.number}`,
            pr.title.substring(0, 50),
            pr.user?.login || "-",
            pr.head?.ref || "-",
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getRepositoryInfo(
  params: { repo: string },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getHeaders(context);
  if (!headers) {
    return { success: false, error: "GitHub not connected" };
  }

  try {
    const response = await fetch(`${GITHUB_API}/repos/${params.repo}`, { headers });
    if (!response.ok) {
      return { success: false, error: `Repository not found: ${params.repo}` };
    }

    const repo = await response.json();

    return {
      success: true,
      data: {
        name: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        issues: repo.open_issues_count,
        language: repo.language,
        created: repo.created_at,
        updated: repo.updated_at,
        default_branch: repo.default_branch,
        url: repo.html_url,
      },
      display: {
        type: "card",
        content: {
          title: repo.full_name,
          description: repo.description || "No description",
          fields: [
            { label: "Stars", value: repo.stargazers_count.toString() },
            { label: "Forks", value: repo.forks_count.toString() },
            { label: "Open Issues", value: repo.open_issues_count.toString() },
            { label: "Language", value: repo.language || "Unknown" },
          ],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const githubSkill: Skill = {
  id: "github",
  name: "GitHub",
  description: "Interact with GitHub repositories, issues, and pull requests",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "development",
  tags: ["github", "git", "code", "development", "issues", "pull-requests"],

  icon: "🐙",
  color: "#24292E",

  tier: "free",
  isBuiltIn: true,

  requiredEnvVars: ["GITHUB_TOKEN"],
  requiredIntegrations: ["github"],

  tools: [
    {
      name: "list_repos",
      description: "List repositories for a user, organization, or the authenticated user",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "GitHub username to list repos for (optional)",
          },
          org: {
            type: "string",
            description: "Organization name to list repos for (optional)",
          },
        },
      },
      execute: listRepositories,
    },
    {
      name: "list_issues",
      description: "List issues for a repository",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "Repository in format 'owner/repo' (e.g., 'facebook/react')",
          },
          state: {
            type: "string",
            description: "Issue state: 'open', 'closed', or 'all'",
            enum: ["open", "closed", "all"],
          },
          labels: {
            type: "string",
            description: "Comma-separated list of label names",
          },
        },
        required: ["repo"],
      },
      execute: listIssues,
    },
    {
      name: "list_prs",
      description: "List pull requests for a repository",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "Repository in format 'owner/repo'",
          },
          state: {
            type: "string",
            description: "PR state: 'open', 'closed', or 'all'",
            enum: ["open", "closed", "all"],
          },
        },
        required: ["repo"],
      },
      execute: listPullRequests,
    },
    {
      name: "get_repo",
      description: "Get detailed information about a repository",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "Repository in format 'owner/repo'",
          },
        },
        required: ["repo"],
      },
      execute: getRepositoryInfo,
    },
  ],

  systemPrompt: `You have access to GitHub. When users ask about:
- Repositories: Use list_repos or get_repo
- Issues: Use list_issues with appropriate filters
- Pull Requests: Use list_prs
Always format repository names as 'owner/repo'.`,
};
