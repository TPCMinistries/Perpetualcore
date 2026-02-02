/**
 * Web Search Skill
 *
 * Search the web and fetch content from URLs.
 * Uses DuckDuckGo for search (no API key required).
 */

import { Skill, ToolContext, ToolResult } from "../types";

async function searchWeb(
  params: { query: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const query = encodeURIComponent(params.query);
    const limit = params.limit || 5;

    // Use DuckDuckGo HTML endpoint (no API key needed)
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${query}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PerpetualCore/1.0)",
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: "Search failed" };
    }

    const html = await response.text();

    // Parse results from HTML (basic extraction)
    const results: { title: string; url: string; snippet: string }[] = [];
    const resultRegex = /<a class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([^<]+)<\/a>/gi;

    let match;
    while ((match = resultRegex.exec(html)) !== null && results.length < limit) {
      const url = match[1].replace(/.*uddg=([^&]+).*/, (_, u) => decodeURIComponent(u));
      results.push({
        title: match[2].trim(),
        url: url,
        snippet: match[3].trim().replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
      });
    }

    // Fallback: try alternative parsing if no results
    if (results.length === 0) {
      const altRegex = /<a rel="nofollow" class="result__url" href="([^"]+)"[^>]*>/gi;
      const titleRegex = /<a class="result__a"[^>]*>([^<]+)<\/a>/gi;

      const urls: string[] = [];
      const titles: string[] = [];

      while ((match = altRegex.exec(html)) !== null) urls.push(match[1]);
      while ((match = titleRegex.exec(html)) !== null) titles.push(match[1]);

      for (let i = 0; i < Math.min(urls.length, titles.length, limit); i++) {
        results.push({
          title: titles[i]?.trim() || "Untitled",
          url: urls[i] || "",
          snippet: "",
        });
      }
    }

    if (results.length === 0) {
      return {
        success: true,
        data: { query: params.query, results: [] },
        display: {
          type: "text",
          content: `No results found for "${params.query}"`,
        },
      };
    }

    return {
      success: true,
      data: { query: params.query, results },
      display: {
        type: "markdown",
        content: results
          .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   [${r.url}](${r.url})`)
          .join("\n\n"),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function fetchUrl(
  params: { url: string; extractText?: boolean },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const response = await fetch(params.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PerpetualCore/1.0)",
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch URL: ${response.statusText}` };
    }

    const contentType = response.headers.get("content-type") || "";
    const html = await response.text();

    if (params.extractText !== false) {
      // Extract main text content
      let text = html
        // Remove scripts and styles
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        // Remove HTML tags
        .replace(/<[^>]+>/g, " ")
        // Decode entities
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        // Clean whitespace
        .replace(/\s+/g, " ")
        .trim();

      // Limit to first 2000 chars
      if (text.length > 2000) {
        text = text.substring(0, 2000) + "...";
      }

      return {
        success: true,
        data: {
          url: params.url,
          contentType,
          textLength: text.length,
          text,
        },
        display: {
          type: "text",
          content: text,
        },
      };
    }

    return {
      success: true,
      data: {
        url: params.url,
        contentType,
        htmlLength: html.length,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const webSearchSkill: Skill = {
  id: "web-search",
  name: "Web Search",
  description: "Search the web and fetch content from URLs",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "utility",
  tags: ["search", "web", "browse", "fetch"],

  icon: "🔍",
  color: "#4285F4",

  tier: "free",
  isBuiltIn: true,

  tools: [
    {
      name: "search",
      description: "Search the web for information",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
          limit: {
            type: "number",
            description: "Maximum number of results (default 5, max 10)",
          },
        },
        required: ["query"],
      },
      execute: searchWeb,
    },
    {
      name: "fetch_url",
      description: "Fetch and extract text content from a URL",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL to fetch",
          },
          extractText: {
            type: "boolean",
            description: "Extract readable text from HTML (default true)",
          },
        },
        required: ["url"],
      },
      execute: fetchUrl,
    },
  ],

  systemPrompt: `You can search the web and fetch URLs. When users need current information:
- Use search for general queries
- Use fetch_url to get content from specific pages
- Always cite sources when using web information`,
};
