/**
 * Trello Skill
 *
 * Manage Trello boards, lists, and cards.
 * Requires Trello API key and token.
 */

import { Skill, ToolContext, ToolResult } from "../types";

const TRELLO_API = "https://api.trello.com/1";

function getTrelloAuth(): { key: string; token: string } | null {
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_TOKEN;
  if (!key || !token) return null;
  return { key, token };
}

async function listBoards(
  params: {},
  context: ToolContext
): Promise<ToolResult> {
  const auth = getTrelloAuth();
  if (!auth) {
    return { success: false, error: "Trello not connected. Please add TRELLO_API_KEY and TRELLO_TOKEN." };
  }

  try {
    const response = await fetch(
      `${TRELLO_API}/members/me/boards?key=${auth.key}&token=${auth.token}&fields=name,url,closed,dateLastActivity`
    );

    if (!response.ok) {
      return { success: false, error: "Failed to fetch boards" };
    }

    const boards = await response.json();
    const activeBoards = boards.filter((b: any) => !b.closed);

    return {
      success: true,
      data: { boards: activeBoards },
      display: {
        type: "table",
        content: {
          headers: ["Board", "Last Activity", "URL"],
          rows: activeBoards.slice(0, 10).map((b: any) => [
            b.name,
            new Date(b.dateLastActivity).toLocaleDateString(),
            b.url,
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function listCards(
  params: { boardId: string; listName?: string },
  context: ToolContext
): Promise<ToolResult> {
  const auth = getTrelloAuth();
  if (!auth) {
    return { success: false, error: "Trello not connected" };
  }

  try {
    // Get lists first
    const listsResponse = await fetch(
      `${TRELLO_API}/boards/${params.boardId}/lists?key=${auth.key}&token=${auth.token}`
    );
    const lists = await listsResponse.json();

    // Get cards
    const cardsResponse = await fetch(
      `${TRELLO_API}/boards/${params.boardId}/cards?key=${auth.key}&token=${auth.token}&fields=name,desc,idList,due,labels,url`
    );
    const cards = await cardsResponse.json();

    // Create list name map
    const listMap = new Map(lists.map((l: any) => [l.id, l.name]));

    // Filter by list name if provided
    let filteredCards = cards;
    if (params.listName) {
      const targetList = lists.find((l: any) =>
        l.name.toLowerCase().includes(params.listName!.toLowerCase())
      );
      if (targetList) {
        filteredCards = cards.filter((c: any) => c.idList === targetList.id);
      }
    }

    const formattedCards = filteredCards.map((c: any) => ({
      id: c.id,
      name: c.name,
      list: listMap.get(c.idList) || "Unknown",
      due: c.due,
      labels: c.labels?.map((l: any) => l.name).filter(Boolean),
      url: c.url,
    }));

    return {
      success: true,
      data: { cards: formattedCards, lists: lists.map((l: any) => l.name) },
      display: {
        type: "table",
        content: {
          headers: ["Card", "List", "Due", "Labels"],
          rows: formattedCards.slice(0, 10).map((c: any) => [
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

async function createCard(
  params: { boardId: string; listName: string; name: string; description?: string; due?: string },
  context: ToolContext
): Promise<ToolResult> {
  const auth = getTrelloAuth();
  if (!auth) {
    return { success: false, error: "Trello not connected" };
  }

  try {
    // Find the list
    const listsResponse = await fetch(
      `${TRELLO_API}/boards/${params.boardId}/lists?key=${auth.key}&token=${auth.token}`
    );
    const lists = await listsResponse.json();

    const targetList = lists.find((l: any) =>
      l.name.toLowerCase().includes(params.listName.toLowerCase())
    );

    if (!targetList) {
      return { success: false, error: `List "${params.listName}" not found. Available lists: ${lists.map((l: any) => l.name).join(", ")}` };
    }

    // Create the card
    const cardData: any = {
      idList: targetList.id,
      name: params.name,
      key: auth.key,
      token: auth.token,
    };

    if (params.description) cardData.desc = params.description;
    if (params.due) cardData.due = params.due;

    const response = await fetch(`${TRELLO_API}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cardData),
    });

    if (!response.ok) {
      return { success: false, error: "Failed to create card" };
    }

    const card = await response.json();

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
  params: { cardId: string; toList: string; boardId: string },
  context: ToolContext
): Promise<ToolResult> {
  const auth = getTrelloAuth();
  if (!auth) {
    return { success: false, error: "Trello not connected" };
  }

  try {
    // Find the target list
    const listsResponse = await fetch(
      `${TRELLO_API}/boards/${params.boardId}/lists?key=${auth.key}&token=${auth.token}`
    );
    const lists = await listsResponse.json();

    const targetList = lists.find((l: any) =>
      l.name.toLowerCase().includes(params.toList.toLowerCase())
    );

    if (!targetList) {
      return { success: false, error: `List "${params.toList}" not found` };
    }

    // Move the card
    const response = await fetch(
      `${TRELLO_API}/cards/${params.cardId}?key=${auth.key}&token=${auth.token}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idList: targetList.id }),
      }
    );

    if (!response.ok) {
      return { success: false, error: "Failed to move card" };
    }

    const card = await response.json();

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
  const auth = getTrelloAuth();
  if (!auth) {
    return { success: false, error: "Trello not connected" };
  }

  try {
    const response = await fetch(
      `${TRELLO_API}/cards/${params.cardId}/actions/comments?key=${auth.key}&token=${auth.token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: params.comment }),
      }
    );

    if (!response.ok) {
      return { success: false, error: "Failed to add comment" };
    }

    return {
      success: true,
      data: { cardId: params.cardId, comment: params.comment },
      display: {
        type: "text",
        content: `Comment added to card`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const trelloSkill: Skill = {
  id: "trello",
  name: "Trello",
  description: "Manage Trello boards, lists, and cards",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "productivity",
  tags: ["trello", "kanban", "tasks", "project-management"],

  icon: "📋",
  color: "#0079BF",

  tier: "free",
  isBuiltIn: true,

  requiredEnvVars: ["TRELLO_API_KEY", "TRELLO_TOKEN"],

  tools: [
    {
      name: "list_boards",
      description: "List all Trello boards you have access to",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: listBoards,
    },
    {
      name: "list_cards",
      description: "List cards on a Trello board, optionally filtered by list",
      parameters: {
        type: "object",
        properties: {
          boardId: {
            type: "string",
            description: "Board ID (get from list_boards)",
          },
          listName: {
            type: "string",
            description: "Filter to cards in this list (optional, partial match)",
          },
        },
        required: ["boardId"],
      },
      execute: listCards,
    },
    {
      name: "create_card",
      description: "Create a new card on a Trello board",
      parameters: {
        type: "object",
        properties: {
          boardId: {
            type: "string",
            description: "Board ID",
          },
          listName: {
            type: "string",
            description: "Name of the list to add card to",
          },
          name: {
            type: "string",
            description: "Card title",
          },
          description: {
            type: "string",
            description: "Card description (optional)",
          },
          due: {
            type: "string",
            description: "Due date in ISO format (optional)",
          },
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
          cardId: {
            type: "string",
            description: "Card ID to move",
          },
          boardId: {
            type: "string",
            description: "Board ID the card is on",
          },
          toList: {
            type: "string",
            description: "Name of the list to move to",
          },
        },
        required: ["cardId", "boardId", "toList"],
      },
      execute: moveCard,
    },
    {
      name: "add_comment",
      description: "Add a comment to a Trello card",
      parameters: {
        type: "object",
        properties: {
          cardId: {
            type: "string",
            description: "Card ID",
          },
          comment: {
            type: "string",
            description: "Comment text",
          },
        },
        required: ["cardId", "comment"],
      },
      execute: addComment,
    },
  ],

  systemPrompt: `You have access to Trello. When users ask about tasks or boards:
- Use list_boards first to find board IDs
- Use list_cards to see cards on a board
- Use create_card to add new tasks
- Use move_card to update task status (e.g., move to "Done")
Always get the board ID first before other operations.`,
};
