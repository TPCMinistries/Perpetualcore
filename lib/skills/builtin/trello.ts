/**
 * Trello Skill (Full REST Upgrade)
 *
 * Comprehensive Trello integration via REST API.
 * Supports boards, lists, cards, labels, checklists, and comments.
 */

import { Skill, ToolContext, ToolResult } from "../types";
import { resolveCredential } from "../credentials";

const TRELLO_API = "https://api.trello.com/1";

async function getTrelloAuth(context: ToolContext): Promise<{ key: string; token: string } | null> {
  const tokenCred = await resolveCredential("trello", context.userId, context.organizationId);
  if (!tokenCred) return null;

  const keyCred = await resolveCredential("trello_api_key", context.userId, context.organizationId);
  const key = keyCred?.key || process.env.TRELLO_API_KEY;
  if (!key) return null;

  return { key, token: tokenCred.key };
}

async function trelloFetch(
  path: string,
  auth: { key: string; token: string },
  options?: { method?: string; body?: any }
): Promise<any> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${TRELLO_API}${path}${separator}key=${auth.key}&token=${auth.token}`;

  const response = await fetch(url, {
    method: options?.method || "GET",
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Trello API error (${response.status}): ${text}`);
  }

  return response.json();
}

// --- Tool Functions ---

async function listBoards(
  params: { filter?: string },
  context: ToolContext
): Promise<ToolResult> {
  const auth = await getTrelloAuth(context);
  if (!auth) {
    return { success: false, error: "Trello not connected. Please connect Trello in Settings > Skills." };
  }

  try {
    const boards = await trelloFetch(
      "/members/me/boards?fields=name,url,closed,dateLastActivity,desc",
      auth
    );

    const activeBoards = boards.filter((b: any) => !b.closed);

    return {
      success: true,
      data: { boards: activeBoards },
      display: {
        type: "table",
        content: {
          headers: ["Board", "Description", "Last Activity"],
          rows: activeBoards.slice(0, 10).map((b: any) => [
            b.name,
            (b.desc || "").substring(0, 40) || "-",
            new Date(b.dateLastActivity).toLocaleDateString(),
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getBoard(
  params: { boardId: string },
  context: ToolContext
): Promise<ToolResult> {
  const auth = await getTrelloAuth(context);
  if (!auth) {
    return { success: false, error: "Trello not connected." };
  }

  try {
    const [board, lists] = await Promise.all([
      trelloFetch(`/boards/${params.boardId}?fields=name,url,desc,dateLastActivity,memberships`, auth),
      trelloFetch(`/boards/${params.boardId}/lists?fields=name,pos,closed`, auth),
    ]);

    const activeLists = lists.filter((l: any) => !l.closed);

    return {
      success: true,
      data: { board, lists: activeLists },
      display: {
        type: "card",
        content: {
          title: board.name,
          description: board.desc || "No description",
          fields: [
            { label: "Lists", value: activeLists.map((l: any) => l.name).join(", ") },
            { label: "URL", value: board.url },
          ],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createCard(
  params: {
    boardId: string;
    listName: string;
    name: string;
    description?: string;
    due?: string;
    labels?: string[];
    memberIds?: string[];
  },
  context: ToolContext
): Promise<ToolResult> {
  const auth = await getTrelloAuth(context);
  if (!auth) {
    return { success: false, error: "Trello not connected." };
  }

  try {
    const lists = await trelloFetch(`/boards/${params.boardId}/lists`, auth);
    const targetList = lists.find((l: any) =>
      l.name.toLowerCase().includes(params.listName.toLowerCase())
    );

    if (!targetList) {
      return {
        success: false,
        error: `List "${params.listName}" not found. Available: ${lists.map((l: any) => l.name).join(", ")}`,
      };
    }

    const cardData: any = {
      idList: targetList.id,
      name: params.name,
    };
    if (params.description) cardData.desc = params.description;
    if (params.due) cardData.due = params.due;
    if (params.labels?.length) cardData.idLabels = params.labels.join(",");
    if (params.memberIds?.length) cardData.idMembers = params.memberIds.join(",");

    const card = await trelloFetch("/cards", auth, { method: "POST", body: cardData });

    return {
      success: true,
      data: { id: card.id, name: card.name, url: card.url },
      display: {
        type: "card",
        content: {
          title: `Created: ${card.name}`,
          description: `Added to "${targetList.name}"`,
          fields: [{ label: "URL", value: card.url }],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function moveCard(
  params: { cardId: string; boardId: string; toList: string; position?: string },
  context: ToolContext
): Promise<ToolResult> {
  const auth = await getTrelloAuth(context);
  if (!auth) {
    return { success: false, error: "Trello not connected." };
  }

  try {
    const lists = await trelloFetch(`/boards/${params.boardId}/lists`, auth);
    const targetList = lists.find((l: any) =>
      l.name.toLowerCase().includes(params.toList.toLowerCase())
    );

    if (!targetList) {
      return { success: false, error: `List "${params.toList}" not found` };
    }

    const updateData: any = { idList: targetList.id };
    if (params.position) updateData.pos = params.position;

    const card = await trelloFetch(`/cards/${params.cardId}`, auth, {
      method: "PUT",
      body: updateData,
    });

    return {
      success: true,
      data: { cardId: card.id, newList: targetList.name },
      display: {
        type: "text",
        content: `Moved "${card.name}" to "${targetList.name}"`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function addComment(
  params: { cardId: string; comment: string },
  context: ToolContext
): Promise<ToolResult> {
  const auth = await getTrelloAuth(context);
  if (!auth) {
    return { success: false, error: "Trello not connected." };
  }

  try {
    await trelloFetch(`/cards/${params.cardId}/actions/comments`, auth, {
      method: "POST",
      body: { text: params.comment },
    });

    return {
      success: true,
      data: { cardId: params.cardId },
      display: { type: "text", content: "Comment added to card." },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function listCards(
  params: { boardId: string; listName?: string; query?: string },
  context: ToolContext
): Promise<ToolResult> {
  const auth = await getTrelloAuth(context);
  if (!auth) {
    return { success: false, error: "Trello not connected." };
  }

  try {
    const [lists, cards] = await Promise.all([
      trelloFetch(`/boards/${params.boardId}/lists`, auth),
      trelloFetch(
        `/boards/${params.boardId}/cards?fields=name,desc,idList,due,labels,url,idMembers`,
        auth
      ),
    ]);

    const listMap = new Map(lists.map((l: any) => [l.id, l.name]));

    let filteredCards = cards;
    if (params.listName) {
      const targetList = lists.find((l: any) =>
        l.name.toLowerCase().includes(params.listName!.toLowerCase())
      );
      if (targetList) {
        filteredCards = cards.filter((c: any) => c.idList === targetList.id);
      }
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      filteredCards = filteredCards.filter(
        (c: any) =>
          c.name.toLowerCase().includes(q) || (c.desc || "").toLowerCase().includes(q)
      );
    }

    const formatted = filteredCards.map((c: any) => ({
      id: c.id,
      name: c.name,
      list: listMap.get(c.idList) || "Unknown",
      due: c.due,
      labels: c.labels?.map((l: any) => l.name).filter(Boolean),
      url: c.url,
    }));

    return {
      success: true,
      data: { cards: formatted, lists: lists.map((l: any) => l.name) },
      display: {
        type: "table",
        content: {
          headers: ["Card", "List", "Due", "Labels"],
          rows: formatted.slice(0, 15).map((c: any) => [
            c.name.substring(0, 40),
            c.list,
            c.due ? new Date(c.due).toLocaleDateString() : "-",
            c.labels?.join(", ") || "-",
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createList(
  params: { boardId: string; name: string; position?: string },
  context: ToolContext
): Promise<ToolResult> {
  const auth = await getTrelloAuth(context);
  if (!auth) {
    return { success: false, error: "Trello not connected." };
  }

  try {
    const listData: any = { name: params.name, idBoard: params.boardId };
    if (params.position) listData.pos = params.position;

    const list = await trelloFetch("/lists", auth, { method: "POST", body: listData });

    return {
      success: true,
      data: { id: list.id, name: list.name },
      display: {
        type: "text",
        content: `Created list "${list.name}" on board.`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function manageLabels(
  params: { boardId: string; action: "create" | "update" | "list"; labelId?: string; name?: string; color?: string },
  context: ToolContext
): Promise<ToolResult> {
  const auth = await getTrelloAuth(context);
  if (!auth) {
    return { success: false, error: "Trello not connected." };
  }

  try {
    if (params.action === "list") {
      const labels = await trelloFetch(`/boards/${params.boardId}/labels`, auth);
      return {
        success: true,
        data: { labels },
        display: {
          type: "table",
          content: {
            headers: ["Name", "Color", "ID"],
            rows: labels.map((l: any) => [l.name || "(unnamed)", l.color || "-", l.id]),
          },
        },
      };
    }

    if (params.action === "create") {
      const label = await trelloFetch("/labels", auth, {
        method: "POST",
        body: { name: params.name, color: params.color, idBoard: params.boardId },
      });
      return {
        success: true,
        data: { id: label.id, name: label.name, color: label.color },
        display: { type: "text", content: `Label "${label.name}" created (${label.color}).` },
      };
    }

    if (params.action === "update" && params.labelId) {
      const updateData: any = {};
      if (params.name) updateData.name = params.name;
      if (params.color) updateData.color = params.color;

      const label = await trelloFetch(`/labels/${params.labelId}`, auth, {
        method: "PUT",
        body: updateData,
      });
      return {
        success: true,
        data: { id: label.id, name: label.name, color: label.color },
        display: { type: "text", content: `Label updated: "${label.name}" (${label.color}).` },
      };
    }

    return { success: false, error: "Invalid action or missing labelId for update." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function addChecklist(
  params: { cardId: string; name: string; items?: string[] },
  context: ToolContext
): Promise<ToolResult> {
  const auth = await getTrelloAuth(context);
  if (!auth) {
    return { success: false, error: "Trello not connected." };
  }

  try {
    const checklist = await trelloFetch(`/cards/${params.cardId}/checklists`, auth, {
      method: "POST",
      body: { name: params.name },
    });

    if (params.items?.length) {
      for (const item of params.items) {
        await trelloFetch(`/checklists/${checklist.id}/checkItems`, auth, {
          method: "POST",
          body: { name: item },
        });
      }
    }

    return {
      success: true,
      data: { checklistId: checklist.id, name: checklist.name, itemCount: params.items?.length || 0 },
      display: {
        type: "checklist",
        content: {
          title: checklist.name,
          items: (params.items || []).map((item) => ({ label: item, checked: false })),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Skill Export ---

export const trelloSkill: Skill = {
  id: "trello",
  name: "Trello",
  description: "Full Trello management — boards, lists, cards, labels, checklists, and comments",
  version: "2.0.0",
  author: "Perpetual Core",

  category: "productivity",
  tags: ["trello", "kanban", "tasks", "project-management", "boards"],

  icon: "📋",
  color: "#0079BF",

  tier: "free",
  isBuiltIn: true,

  requiredIntegrations: ["trello"],

  tools: [
    {
      name: "list_boards",
      description: "List all Trello boards you have access to",
      parameters: {
        type: "object",
        properties: {
          filter: { type: "string", description: "Filter boards (optional)" },
        },
      },
      execute: listBoards,
    },
    {
      name: "get_board",
      description: "Get board details including all lists",
      parameters: {
        type: "object",
        properties: {
          boardId: { type: "string", description: "Board ID" },
        },
        required: ["boardId"],
      },
      execute: getBoard,
    },
    {
      name: "create_card",
      description: "Create a new card with optional labels and members",
      parameters: {
        type: "object",
        properties: {
          boardId: { type: "string", description: "Board ID" },
          listName: { type: "string", description: "List name to add card to" },
          name: { type: "string", description: "Card title" },
          description: { type: "string", description: "Card description (Markdown)" },
          due: { type: "string", description: "Due date (ISO format)" },
          labels: { type: "array", description: "Label IDs to apply" },
          memberIds: { type: "array", description: "Member IDs to assign" },
        },
        required: ["boardId", "listName", "name"],
      },
      execute: createCard,
    },
    {
      name: "move_card",
      description: "Move a card to a different list",
      parameters: {
        type: "object",
        properties: {
          cardId: { type: "string", description: "Card ID to move" },
          boardId: { type: "string", description: "Board ID" },
          toList: { type: "string", description: "Target list name" },
          position: { type: "string", description: "Position in list: 'top', 'bottom', or number" },
        },
        required: ["cardId", "boardId", "toList"],
      },
      execute: moveCard,
    },
    {
      name: "add_comment",
      description: "Add a comment to a card",
      parameters: {
        type: "object",
        properties: {
          cardId: { type: "string", description: "Card ID" },
          comment: { type: "string", description: "Comment text" },
        },
        required: ["cardId", "comment"],
      },
      execute: addComment,
    },
    {
      name: "list_cards",
      description: "List cards on a board with optional list filter and search",
      parameters: {
        type: "object",
        properties: {
          boardId: { type: "string", description: "Board ID" },
          listName: { type: "string", description: "Filter to cards in this list (partial match)" },
          query: { type: "string", description: "Search cards by name or description" },
        },
        required: ["boardId"],
      },
      execute: listCards,
    },
    {
      name: "create_list",
      description: "Create a new list on a board",
      parameters: {
        type: "object",
        properties: {
          boardId: { type: "string", description: "Board ID" },
          name: { type: "string", description: "List name" },
          position: { type: "string", description: "Position: 'top', 'bottom', or number" },
        },
        required: ["boardId", "name"],
      },
      execute: createList,
    },
    {
      name: "manage_labels",
      description: "Create, update, or list labels on a board",
      parameters: {
        type: "object",
        properties: {
          boardId: { type: "string", description: "Board ID" },
          action: { type: "string", description: "Action to perform", enum: ["create", "update", "list"] },
          labelId: { type: "string", description: "Label ID (for update)" },
          name: { type: "string", description: "Label name (for create/update)" },
          color: { type: "string", description: "Label color (green, yellow, orange, red, purple, blue, sky, lime, pink, black)" },
        },
        required: ["boardId", "action"],
      },
      execute: manageLabels,
    },
    {
      name: "add_checklist",
      description: "Add a checklist with items to a card",
      parameters: {
        type: "object",
        properties: {
          cardId: { type: "string", description: "Card ID" },
          name: { type: "string", description: "Checklist name" },
          items: { type: "array", description: "Array of checklist item names" },
        },
        required: ["cardId", "name"],
      },
      execute: addChecklist,
    },
  ],

  systemPrompt: `You have access to Trello. Available actions:
- list_boards / get_board: Browse boards and their lists
- list_cards: View cards with optional list filter and search
- create_card: Create card with labels, members, due dates
- move_card: Move card between lists
- add_comment: Add comment to card
- create_list: Add new list to board
- manage_labels: Create, update, or list board labels
- add_checklist: Add checklist with items to card
Always get board ID first (from list_boards) before other operations. Confirm before creating or moving cards.`,
};
