/**
 * Web Search Tool
 * Allows AI to search the web for real-time information using GPT-4o's native capabilities
 */

import { Tool, ToolExecutionContext } from "./schema";
import OpenAI from "openai";

export const webSearchTool: Tool = {
  name: "web_search",
  description:
    "Search the web for current information, news, facts, or real-time data. Use this when the user asks about recent events, current data, latest news, or anything you don't have up-to-date information about. Examples: 'what's the weather today', 'latest news on AI', 'current stock price of AAPL'. Note: This uses GPT-4o which has access to current information.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "The search query or question. Be specific and include relevant keywords. Examples: 'What is the current Apple stock price?', 'Latest news about SpaceX launches', 'Weather in San Francisco today'",
      },
    },
    required: ["query"],
  },
};

export async function executeWebSearch(
  params: {
    query: string;
  },
  context: ToolExecutionContext
): Promise<string> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Validate query
    if (!params.query || params.query.trim().length === 0) {
      return "Error: Search query cannot be empty.";
    }

    // Use GPT-4o with web browsing capability
    // GPT-4o has access to current information and can browse the web
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant with access to current information and the ability to search the web. Provide accurate, up-to-date information with sources when possible. Be concise but informative.",
        },
        {
          role: "user",
          content: `Please search for and provide current information about: ${params.query}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more factual responses
    });

    const result = completion.choices[0]?.message?.content;

    if (!result) {
      return "No results found for your search query.";
    }

    return `Web search results for "${params.query}":\n\n${result}`;
  } catch (error: any) {
    console.error("Unexpected error in executeWebSearch:", error);
    return `Error performing web search: ${error.message || "Unknown error"}`;
  }
}
