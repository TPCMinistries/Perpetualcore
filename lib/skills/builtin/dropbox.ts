/**
 * Dropbox Skill
 *
 * Manage files and folders in Dropbox.
 * Wraps existing Dropbox OAuth integration from lib/integrations/config.ts
 */

import { Skill, ToolContext, ToolResult } from "../types";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveCredential } from "../credentials";

async function getDropboxToken(userId: string, organizationId: string): Promise<string | null> {
  const cred = await resolveCredential("dropbox", userId, organizationId);
  if (cred?.key) return cred.key;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("integrations")
    .select("access_token")
    .eq("organization_id", organizationId)
    .eq("provider", "dropbox")
    .eq("is_active", true)
    .single();

  return data?.access_token || null;
}

async function dropboxApi(token: string, endpoint: string, body?: any): Promise<any> {
  const response = await fetch(`https://api.dropboxapi.com/2${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

/**
 * List files and folders
 */
async function listFiles(
  params: { path?: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const token = await getDropboxToken(context.userId, context.organizationId);
  if (!token) {
    return { success: false, error: "Dropbox not connected. Please add your token in Settings > Skills." };
  }

  const result = await dropboxApi(token, "/files/list_folder", {
    path: params.path || "",
    limit: params.limit || 25,
  });

  if (result.error) {
    return { success: false, error: result.error_summary || "Failed to list files" };
  }

  const entries = (result.entries || []).map((entry: any) => ({
    id: entry.id,
    name: entry.name,
    type: entry[".tag"], // file or folder
    path: entry.path_display,
    size: entry.size,
    modified: entry.server_modified,
  }));

  return {
    success: true,
    data: { entries, hasMore: result.has_more },
    display: {
      type: "table",
      content: {
        headers: ["Name", "Type", "Size", "Modified"],
        rows: entries.map((e: any) => [
          e.name,
          e.type === "folder" ? "📁 Folder" : "📄 File",
          e.size ? `${(e.size / 1024).toFixed(1)} KB` : "-",
          e.modified ? new Date(e.modified).toLocaleDateString() : "-",
        ]),
      },
    },
  };
}

/**
 * Search for files
 */
async function searchFiles(
  params: { query: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const token = await getDropboxToken(context.userId, context.organizationId);
  if (!token) {
    return { success: false, error: "Dropbox not connected." };
  }

  const result = await dropboxApi(token, "/files/search_v2", {
    query: params.query,
    options: {
      max_results: params.limit || 10,
    },
  });

  if (result.error) {
    return { success: false, error: result.error_summary || "Search failed" };
  }

  const matches = (result.matches || []).map((match: any) => {
    const meta = match.metadata?.metadata;
    return {
      name: meta?.name,
      path: meta?.path_display,
      type: meta?.[".tag"],
      size: meta?.size,
    };
  });

  return {
    success: true,
    data: { matches },
    display: {
      type: "table",
      content: {
        headers: ["Name", "Path", "Size"],
        rows: matches.map((m: any) => [
          m.name || "-",
          m.path || "-",
          m.size ? `${(m.size / 1024).toFixed(1)} KB` : "-",
        ]),
      },
    },
  };
}

/**
 * Create a folder
 */
async function createFolder(
  params: { path: string },
  context: ToolContext
): Promise<ToolResult> {
  const token = await getDropboxToken(context.userId, context.organizationId);
  if (!token) {
    return { success: false, error: "Dropbox not connected." };
  }

  const result = await dropboxApi(token, "/files/create_folder_v2", {
    path: params.path,
    autorename: false,
  });

  if (result.error) {
    return { success: false, error: result.error_summary || "Failed to create folder" };
  }

  return {
    success: true,
    data: { path: result.metadata?.path_display },
    display: {
      type: "text",
      content: `Folder created: ${result.metadata?.path_display || params.path}`,
    },
  };
}

/**
 * Get a shareable link
 */
async function getShareLink(
  params: { path: string },
  context: ToolContext
): Promise<ToolResult> {
  const token = await getDropboxToken(context.userId, context.organizationId);
  if (!token) {
    return { success: false, error: "Dropbox not connected." };
  }

  const result = await dropboxApi(token, "/sharing/create_shared_link_with_settings", {
    path: params.path,
    settings: { requested_visibility: "public" },
  });

  // If link already exists, get it
  if (result.error?.error_summary?.includes("shared_link_already_exists")) {
    const existingLinks = await dropboxApi(token, "/sharing/list_shared_links", {
      path: params.path,
      direct_only: true,
    });
    const link = existingLinks.links?.[0]?.url;
    if (link) {
      return {
        success: true,
        data: { url: link },
        display: { type: "text", content: `Share link: ${link}` },
      };
    }
  }

  if (result.error) {
    return { success: false, error: result.error_summary || "Failed to create share link" };
  }

  return {
    success: true,
    data: { url: result.url },
    display: { type: "text", content: `Share link: ${result.url}` },
  };
}

export const dropboxSkill: Skill = {
  id: "dropbox",
  name: "Dropbox",
  description: "Browse, search, and manage files in your Dropbox cloud storage",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "productivity",
  tags: ["dropbox", "files", "cloud", "storage", "documents"],

  icon: "📦",
  color: "#0061FF",

  tier: "pro",
  isBuiltIn: true,

  requiredEnvVars: [],
  requiredIntegrations: ["dropbox"],

  configSchema: {
    apiToken: {
      type: "string",
      label: "Dropbox Access Token",
      description: "Connect via OAuth in Integrations, or paste an access token here",
      required: true,
      placeholder: "sl.B...",
    },
  },

  tools: [
    {
      name: "list_files",
      description: "List files and folders in a Dropbox directory",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Folder path (empty string for root)" },
          limit: { type: "number", description: "Max results (default: 25)" },
        },
      },
      execute: listFiles,
    },
    {
      name: "search_files",
      description: "Search for files by name or content",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", description: "Max results (default: 10)" },
        },
        required: ["query"],
      },
      execute: searchFiles,
    },
    {
      name: "create_folder",
      description: "Create a new folder in Dropbox",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Full path for new folder (e.g., /Projects/NewFolder)" },
        },
        required: ["path"],
      },
      execute: createFolder,
    },
    {
      name: "get_share_link",
      description: "Get a shareable link for a file or folder",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File or folder path" },
        },
        required: ["path"],
      },
      execute: getShareLink,
    },
  ],

  systemPrompt: `You have Dropbox integration. When users ask about files or cloud storage:
- Use "list_files" to browse directories (path="" for root)
- Use "search_files" to find specific files
- Use "create_folder" to create new folders
- Use "get_share_link" to generate shareable links
Always show file paths and sizes when listing files.`,
};
