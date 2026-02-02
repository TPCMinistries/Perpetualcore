/**
 * Notion Skill
 *
 * Interact with Notion workspaces - pages, databases, and blocks.
 * Requires Notion integration to be connected.
 */

import { Skill, ToolContext, ToolResult } from "../types";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

async function getNotionHeaders(context: ToolContext): Promise<Headers | null> {
  // Get user's Notion token from their integration
  // In production, this would fetch from user_integrations table
  const token = process.env.NOTION_API_KEY;
  if (!token) return null;

  return new Headers({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  });
}

async function searchPages(
  params: { query: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getNotionHeaders(context);
  if (!headers) {
    return { success: false, error: "Notion not connected. Please connect Notion in integrations." };
  }

  try {
    const response = await fetch(`${NOTION_API}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: params.query,
        page_size: params.limit || 10,
        filter: { property: "object", value: "page" },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Notion API error" };
    }

    const data = await response.json();
    const pages = data.results.map((page: any) => ({
      id: page.id,
      title: page.properties?.title?.title?.[0]?.plain_text ||
             page.properties?.Name?.title?.[0]?.plain_text ||
             "Untitled",
      url: page.url,
      lastEdited: page.last_edited_time,
      createdBy: page.created_by?.id,
    }));

    return {
      success: true,
      data: { query: params.query, pages },
      display: {
        type: "table",
        content: {
          headers: ["Title", "Last Edited", "URL"],
          rows: pages.slice(0, 5).map((p: any) => [
            p.title,
            new Date(p.lastEdited).toLocaleDateString(),
            p.url,
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createPage(
  params: { parentId: string; title: string; content?: string },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getNotionHeaders(context);
  if (!headers) {
    return { success: false, error: "Notion not connected" };
  }

  try {
    const children: any[] = [];

    if (params.content) {
      // Split content into paragraphs
      const paragraphs = params.content.split("\n\n");
      for (const para of paragraphs) {
        if (para.trim()) {
          children.push({
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: para.trim() } }],
            },
          });
        }
      }
    }

    const response = await fetch(`${NOTION_API}/pages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        parent: { page_id: params.parentId },
        properties: {
          title: {
            title: [{ type: "text", text: { content: params.title } }],
          },
        },
        children: children.length > 0 ? children : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to create page" };
    }

    const page = await response.json();

    return {
      success: true,
      data: {
        id: page.id,
        title: params.title,
        url: page.url,
      },
      display: {
        type: "card",
        content: {
          title: `Created: ${params.title}`,
          description: `Page created successfully`,
          fields: [{ label: "URL", value: page.url }],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function listDatabases(
  params: { limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getNotionHeaders(context);
  if (!headers) {
    return { success: false, error: "Notion not connected" };
  }

  try {
    const response = await fetch(`${NOTION_API}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        page_size: params.limit || 10,
        filter: { property: "object", value: "database" },
      }),
    });

    if (!response.ok) {
      return { success: false, error: "Failed to list databases" };
    }

    const data = await response.json();
    const databases = data.results.map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || "Untitled Database",
      url: db.url,
      properties: Object.keys(db.properties || {}),
    }));

    return {
      success: true,
      data: { databases },
      display: {
        type: "table",
        content: {
          headers: ["Database", "Properties", "URL"],
          rows: databases.map((db: any) => [
            db.title,
            db.properties.slice(0, 3).join(", "),
            db.url,
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function queryDatabase(
  params: { databaseId: string; filter?: any; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const headers = await getNotionHeaders(context);
  if (!headers) {
    return { success: false, error: "Notion not connected" };
  }

  try {
    const response = await fetch(`${NOTION_API}/databases/${params.databaseId}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        page_size: params.limit || 10,
        filter: params.filter,
      }),
    });

    if (!response.ok) {
      return { success: false, error: "Failed to query database" };
    }

    const data = await response.json();
    const rows = data.results.map((row: any) => {
      const props: Record<string, any> = {};
      for (const [key, value] of Object.entries(row.properties)) {
        props[key] = extractPropertyValue(value);
      }
      return { id: row.id, url: row.url, properties: props };
    });

    return {
      success: true,
      data: { databaseId: params.databaseId, rows },
      display: {
        type: "text",
        content: `Found ${rows.length} rows in database`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function extractPropertyValue(prop: any): any {
  if (!prop) return null;
  switch (prop.type) {
    case "title":
      return prop.title?.[0]?.plain_text || "";
    case "rich_text":
      return prop.rich_text?.[0]?.plain_text || "";
    case "number":
      return prop.number;
    case "select":
      return prop.select?.name || "";
    case "multi_select":
      return prop.multi_select?.map((s: any) => s.name) || [];
    case "date":
      return prop.date?.start || "";
    case "checkbox":
      return prop.checkbox;
    case "url":
      return prop.url || "";
    case "email":
      return prop.email || "";
    default:
      return null;
  }
}

export const notionSkill: Skill = {
  id: "notion",
  name: "Notion",
  description: "Search, create, and manage Notion pages and databases",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "productivity",
  tags: ["notion", "notes", "wiki", "database", "docs"],

  icon: "📝",
  color: "#000000",

  tier: "free",
  isBuiltIn: true,

  requiredEnvVars: ["NOTION_API_KEY"],
  requiredIntegrations: ["notion"],

  tools: [
    {
      name: "search_pages",
      description: "Search for pages in Notion by title or content",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
          limit: {
            type: "number",
            description: "Max results (default 10)",
          },
        },
        required: ["query"],
      },
      execute: searchPages,
    },
    {
      name: "create_page",
      description: "Create a new page in Notion",
      parameters: {
        type: "object",
        properties: {
          parentId: {
            type: "string",
            description: "Parent page ID to create under",
          },
          title: {
            type: "string",
            description: "Page title",
          },
          content: {
            type: "string",
            description: "Initial page content (paragraphs separated by blank lines)",
          },
        },
        required: ["parentId", "title"],
      },
      execute: createPage,
    },
    {
      name: "list_databases",
      description: "List all databases in the workspace",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max results (default 10)",
          },
        },
      },
      execute: listDatabases,
    },
    {
      name: "query_database",
      description: "Query a Notion database",
      parameters: {
        type: "object",
        properties: {
          databaseId: {
            type: "string",
            description: "Database ID to query",
          },
          limit: {
            type: "number",
            description: "Max results (default 10)",
          },
        },
        required: ["databaseId"],
      },
      execute: queryDatabase,
    },
  ],

  systemPrompt: `You have access to Notion. When users ask about:
- Finding pages: Use search_pages
- Creating content: Use create_page (need parent page ID)
- Viewing databases: Use list_databases, then query_database
Always confirm before creating new pages.`,
};
