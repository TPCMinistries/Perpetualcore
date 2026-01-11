import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, content, url } = body;

    if (type === "quick_note") {
      if (!content || typeof content !== "string") {
        return NextResponse.json(
          { error: "Content is required" },
          { status: 400 }
        );
      }

      // Determine memory type based on content
      const memoryType = detectMemoryType(content);

      // Insert into user_ai_memory
      const { data, error } = await supabase
        .from("user_ai_memory")
        .insert({
          user_id: user.id,
          memory_type: memoryType,
          content: content.trim(),
          source: "manual",
          confidence: 1.0, // High confidence since user explicitly told us
          is_verified: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to save memory:", error);
        return NextResponse.json(
          { error: "Failed to save memory" },
          { status: 500 }
        );
      }

      // Log the learning event
      await supabase.from("ai_learning_log").insert({
        user_id: user.id,
        event_type: "memory_created",
        memory_id: data.id,
        details: { source: "quick_note", manual: true },
      });

      return NextResponse.json({
        success: true,
        memory: data,
      });
    }

    if (type === "url_import") {
      if (!url || typeof url !== "string") {
        return NextResponse.json(
          { error: "URL is required" },
          { status: 400 }
        );
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL" },
          { status: 400 }
        );
      }

      // For now, just save the URL as a reference
      // In a full implementation, this would:
      // 1. Fetch the URL content
      // 2. Extract text using a parser
      // 3. Generate embeddings
      // 4. Store in documents table with RAG indexing

      const { data, error } = await supabase
        .from("user_ai_memory")
        .insert({
          user_id: user.id,
          memory_type: "context",
          content: `Reference URL: ${url}`,
          key: "imported_url",
          value: { url, imported_at: new Date().toISOString() },
          source: "url_import",
          confidence: 0.8,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to save URL import:", error);
        return NextResponse.json(
          { error: "Failed to import URL" },
          { status: 500 }
        );
      }

      // Log the learning event
      await supabase.from("ai_learning_log").insert({
        user_id: user.id,
        event_type: "memory_created",
        memory_id: data.id,
        details: { source: "url_import", url },
      });

      return NextResponse.json({
        success: true,
        memory: data,
      });
    }

    return NextResponse.json(
      { error: "Invalid teach type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Teach API error:", error);
    return NextResponse.json(
      { error: "Failed to process teach request" },
      { status: 500 }
    );
  }
}

/**
 * Detect the type of memory based on content patterns
 */
function detectMemoryType(content: string): string {
  const lowerContent = content.toLowerCase();

  // Check for preferences
  if (
    lowerContent.includes("prefer") ||
    lowerContent.includes("like to") ||
    lowerContent.includes("don't like") ||
    lowerContent.includes("rather")
  ) {
    return "preference";
  }

  // Check for goals
  if (
    lowerContent.includes("goal") ||
    lowerContent.includes("want to") ||
    lowerContent.includes("aim to") ||
    lowerContent.includes("trying to") ||
    lowerContent.includes("plan to")
  ) {
    return "goal";
  }

  // Check for projects
  if (
    lowerContent.includes("project") ||
    lowerContent.includes("working on") ||
    lowerContent.includes("building")
  ) {
    return "project";
  }

  // Check for relationships
  if (
    lowerContent.includes("my ") &&
    (lowerContent.includes("colleague") ||
      lowerContent.includes("boss") ||
      lowerContent.includes("client") ||
      lowerContent.includes("partner") ||
      lowerContent.includes("team"))
  ) {
    return "relationship";
  }

  // Check for skills
  if (
    lowerContent.includes("expert in") ||
    lowerContent.includes("good at") ||
    lowerContent.includes("experienced with") ||
    lowerContent.includes("know how to")
  ) {
    return "skill";
  }

  // Check for challenges
  if (
    lowerContent.includes("struggling") ||
    lowerContent.includes("challenge") ||
    lowerContent.includes("difficult") ||
    lowerContent.includes("problem")
  ) {
    return "challenge";
  }

  // Check for workflow
  if (
    lowerContent.includes("every day") ||
    lowerContent.includes("usually") ||
    lowerContent.includes("routine") ||
    lowerContent.includes("workflow")
  ) {
    return "workflow";
  }

  // Check for style
  if (
    lowerContent.includes("style") ||
    lowerContent.includes("tone") ||
    lowerContent.includes("write") ||
    lowerContent.includes("communicate")
  ) {
    return "style";
  }

  // Default to fact
  return "fact";
}
