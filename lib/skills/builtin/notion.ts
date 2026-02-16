/**
 * Notion Skill (SDK Upgrade)
 *
 * Full Notion integration using @notionhq/client SDK.
 * Supports pages, databases, and blocks.
 */

import { Client } from "@notionhq/client";
import { Skill, ToolContext, ToolResult } from "../types";
import { resolveCredential } from "../credentials";

async function getClient(context: ToolContext): Promise<Client | null> {
  const cred = await resolveCredential("notion", context.userId, context.organizationId);
  if (!cred) return null;
  return new Client({ auth: cred.key });
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
    case "status":
      return prop.status?.name || "";
    case "people":
      return prop.people?.map((p: any) => p.name || p.id) || [];
    default:
      return null;
  }
}

// --- Tool Functions ---

async function searchPages(
  params: { query: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const client = await getClient(context);
  if (!client) {
    return { success: false, error: "Notion not connected. Please connect Notion in Settings > Skills." };
  }

  try {
    const response = await client.search({
      query: params.query,
      page_size: params.limit || 10,
      filter: { property: "object", value: "page" },
    });

    const pages = response.results.map((page: any) => ({
      id: page.id,
      title:
        page.properties?.title?.title?.[0]?.plain_text ||
        page.properties?.Name?.title?.[0]?.plain_text ||
        "Untitled",
      url: page.url,
      lastEdited: page.last_edited_time,
    }));

    return {
      success: true,
      data: { query: params.query, pages },
      display: {
        type: "table",
        content: {
          headers: ["Title", "Last Edited", "URL"],
          rows: pages.slice(0, 10).map((p: any) => [
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
  const client = await getClient(context);
  if (!client) {
    return { success: false, error: "Notion not connected." };
  }

  try {
    const children: any[] = [];

    if (params.content) {
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

    const page = await client.pages.create({
      parent: { page_id: params.parentId },
      properties: {
        title: {
          title: [{ type: "text", text: { content: params.title } }],
        },
      },
      children: children.length > 0 ? children : undefined,
    } as any);

    return {
      success: true,
      data: { id: page.id, title: params.title, url: (page as any).url },
      display: {
        type: "card",
        content: {
          title: `Created: ${params.title}`,
          description: "Page created successfully",
          fields: [{ label: "URL", value: (page as any).url }],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function updatePage(
  params: { pageId: string; properties: Record<string, any> },
  context: ToolContext
): Promise<ToolResult> {
  const client = await getClient(context);
  if (!client) {
    return { success: false, error: "Notion not connected." };
  }

  try {
    const page = await client.pages.update({
      page_id: params.pageId,
      properties: params.properties,
    });

    return {
      success: true,
      data: { id: page.id, url: (page as any).url },
      display: {
        type: "text",
        content: `Page ${params.pageId} updated successfully.`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function queryDatabase(
  params: { databaseId: string; filter?: any; sorts?: any[]; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const client = await getClient(context);
  if (!client) {
    return { success: false, error: "Notion not connected." };
  }

  try {
    const queryParams: any = {
      database_id: params.databaseId,
      page_size: params.limit || 10,
    };
    if (params.filter) queryParams.filter = params.filter;
    if (params.sorts) queryParams.sorts = params.sorts;

    const response = await client.databases.query(queryParams);

    const rows = response.results.map((row: any) => {
      const props: Record<string, any> = {};
      for (const [key, value] of Object.entries(row.properties)) {
        props[key] = extractPropertyValue(value);
      }
      return { id: row.id, url: row.url, properties: props };
    });

    return {
      success: true,
      data: { databaseId: params.databaseId, rows, hasMore: response.has_more },
      display: {
        type: "table",
        content: {
          headers: ["ID", "Properties"],
          rows: rows.slice(0, 10).map((r: any) => [
            r.id.substring(0, 8),
            Object.entries(r.properties)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
              .substring(0, 80),
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createDatabase(
  params: {
    parentPageId: string;
    title: string;
    properties: Record<string, any>;
  },
  context: ToolContext
): Promise<ToolResult> {
  const client = await getClient(context);
  if (!client) {
    return { success: false, error: "Notion not connected." };
  }

  try {
    const db = await client.databases.create({
      parent: { page_id: params.parentPageId, type: "page_id" },
      title: [{ type: "text", text: { content: params.title } }],
      properties: params.properties,
    });

    return {
      success: true,
      data: { id: db.id, title: params.title, url: (db as any).url },
      display: {
        type: "card",
        content: {
          title: `Database Created: ${params.title}`,
          description: `Properties: ${Object.keys(params.properties).join(", ")}`,
          fields: [{ label: "URL", value: (db as any).url }],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function addBlock(
  params: { pageId: string; blocks: any[] },
  context: ToolContext
): Promise<ToolResult> {
  const client = await getClient(context);
  if (!client) {
    return { success: false, error: "Notion not connected." };
  }

  try {
    const response = await client.blocks.children.append({
      block_id: params.pageId,
      children: params.blocks,
    });

    return {
      success: true,
      data: { pageId: params.pageId, blocksAdded: response.results.length },
      display: {
        type: "text",
        content: `Added ${response.results.length} block(s) to page.`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getPage(
  params: { pageId: string },
  context: ToolContext
): Promise<ToolResult> {
  const client = await getClient(context);
  if (!client) {
    return { success: false, error: "Notion not connected." };
  }

  try {
    const [page, blocks] = await Promise.all([
      client.pages.retrieve({ page_id: params.pageId }),
      client.blocks.children.list({ block_id: params.pageId, page_size: 100 }),
    ]);

    const properties: Record<string, any> = {};
    for (const [key, value] of Object.entries((page as any).properties || {})) {
      properties[key] = extractPropertyValue(value);
    }

    const content = blocks.results.map((block: any) => {
      const type = block.type;
      const data = block[type];
      if (data?.rich_text) {
        return data.rich_text.map((t: any) => t.plain_text).join("");
      }
      return `[${type}]`;
    });

    return {
      success: true,
      data: {
        id: (page as any).id,
        url: (page as any).url,
        properties,
        content,
        lastEdited: (page as any).last_edited_time,
      },
      display: {
        type: "markdown",
        content: content.join("\n\n") || "*(empty page)*",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Skill Export ---

export const notionSkill: Skill = {
  id: "notion",
  name: "Notion",
  description: "Search, create, and manage Notion pages, databases, and blocks",
  version: "2.0.0",
  author: "Perpetual Core",

  category: "productivity",
  tags: ["notion", "notes", "wiki", "database", "docs"],

  icon: "📝",
  color: "#000000",

  tier: "free",
  isBuiltIn: true,

  requiredIntegrations: ["notion"],

  tools: [
    {
      name: "search_pages",
      description: "Search for pages in Notion by title or content",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["query"],
      },
      execute: searchPages,
    },
    {
      name: "create_page",
      description: "Create a new page in Notion under a parent page",
      parameters: {
        type: "object",
        properties: {
          parentId: { type: "string", description: "Parent page ID" },
          title: { type: "string", description: "Page title" },
          content: { type: "string", description: "Initial content (paragraphs separated by blank lines)" },
        },
        required: ["parentId", "title"],
      },
      execute: createPage,
    },
    {
      name: "update_page",
      description: "Update properties on a Notion page",
      parameters: {
        type: "object",
        properties: {
          pageId: { type: "string", description: "Page ID to update" },
          properties: { type: "object", description: "Notion property values to set" },
        },
        required: ["pageId", "properties"],
      },
      execute: updatePage,
    },
    {
      name: "query_database",
      description: "Query a Notion database with optional filters and sorts",
      parameters: {
        type: "object",
        properties: {
          databaseId: { type: "string", description: "Database ID to query" },
          filter: { type: "object", description: "Notion filter object (optional)" },
          sorts: { type: "array", description: "Array of sort objects (optional)" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["databaseId"],
      },
      execute: queryDatabase,
    },
    {
      name: "create_database",
      description: "Create a new database in a parent page",
      parameters: {
        type: "object",
        properties: {
          parentPageId: { type: "string", description: "Parent page ID" },
          title: { type: "string", description: "Database title" },
          properties: { type: "object", description: "Database property schema (Notion format)" },
        },
        required: ["parentPageId", "title", "properties"],
      },
      execute: createDatabase,
    },
    {
      name: "add_block",
      description: "Append blocks (paragraphs, headings, lists, etc.) to a page",
      parameters: {
        type: "object",
        properties: {
          pageId: { type: "string", description: "Page ID to append blocks to" },
          blocks: { type: "array", description: "Array of Notion block objects" },
        },
        required: ["pageId", "blocks"],
      },
      execute: addBlock,
    },
    {
      name: "get_page",
      description: "Get full page content including properties and blocks",
      parameters: {
        type: "object",
        properties: {
          pageId: { type: "string", description: "Page ID to retrieve" },
        },
        required: ["pageId"],
      },
      execute: getPage,
    },
  ],

  systemPrompt: `You have access to Notion via the official SDK. Available actions:
- search_pages: Find pages by title/content
- create_page: Create page under a parent (need parent page ID)
- update_page: Modify page properties
- query_database: Query database with filters/sorts
- create_database: Create new database in a page
- add_block: Append content blocks to a page
- get_page: Read full page content
Always confirm before creating or modifying content.`,
};
