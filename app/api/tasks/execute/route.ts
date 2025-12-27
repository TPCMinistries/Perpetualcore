import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatCompletion } from "@/lib/ai/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExecutionResult {
  strategy: "immediate" | "decompose" | "blocked";
  result?: string;
  content?: {
    type: "social_posts" | "email" | "document" | "plan" | "research" | "other";
    items: Array<{
      title?: string;
      platform?: string;
      content: string;
    }>;
  };
  subtasks?: Array<{
    title: string;
    description?: string;
  }>;
  blockReason?: string;
  confidence: number;
}

/**
 * POST /api/tasks/execute
 * AI task execution - actually generates content for executable tasks
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, platforms } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Default platforms if not specified
    const selectedPlatforms = platforms && platforms.length > 0
      ? platforms
      : ["twitter", "linkedin", "instagram"];

    // Fetch the task
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if task is already completed
    if (task.status === "done") {
      return NextResponse.json(
        { error: "Task is already completed" },
        { status: 400 }
      );
    }

    // Format platform list for the prompt
    const platformList = selectedPlatforms.map((p: string) => {
      const names: Record<string, string> = {
        twitter: "Twitter/X",
        linkedin: "LinkedIn",
        instagram: "Instagram",
        facebook: "Facebook",
        youtube: "YouTube",
      };
      return names[p] || p;
    }).join(", ");

    // Analyze and execute the task with AI
    const executionPrompt = `You are an AI assistant that executes tasks. Analyze this task and either execute it or explain what's needed.

**Task:**
Title: ${task.title}
Description: ${task.description || "No description provided"}

**Target Platforms:** ${platformList}

**Instructions:**
1. Determine what kind of output this task needs
2. If it's content creation (social posts, emails, documents), CREATE the actual content
3. Create content for EACH of the target platforms specified above: ${platformList}
4. If it's too complex, break it into subtasks
5. If it needs human action (like payments, external systems), explain what's needed

**Platform-specific guidelines:**
- Twitter/X: Max 280 characters, use hashtags, engaging tone
- LinkedIn: Professional tone, can be longer (up to 3000 chars), industry-focused
- Instagram: Visual-focused captions, use emojis, relevant hashtags
- Facebook: Conversational, can include links, moderate length
- YouTube: Video description/title, include keywords, call-to-action for subscribers

**Response Format (JSON only):**
{
  "strategy": "immediate" | "decompose" | "blocked",
  "contentType": "social_posts" | "email" | "document" | "plan" | "research" | "other",
  "content": [
    {
      "title": "Optional title",
      "platform": "twitter/linkedin/facebook/instagram/email/etc",
      "content": "The actual generated content here"
    }
  ],
  "subtasks": [{"title": "...", "description": "..."}],
  "blockReason": "...",
  "confidence": 0.95,
  "summary": "Brief summary of what was done"
}

**Example for "Create social media posts for product launch" with platforms [Twitter/X, LinkedIn]:**
{
  "strategy": "immediate",
  "contentType": "social_posts",
  "content": [
    {"platform": "twitter", "content": "🚀 Exciting news! Our new product is here..."},
    {"platform": "linkedin", "content": "We're thrilled to announce..."}
  ],
  "confidence": 0.95,
  "summary": "Created 2 social media posts for product launch"
}

Now execute the task for these platforms: ${platformList}. Respond with JSON only.`;

    const result = await getChatCompletion("gpt-4o", [
      {
        role: "system",
        content:
          "You are a task execution AI. When asked to create content, you create ACTUAL content, not placeholders. Always respond with valid JSON only.",
      },
      { role: "user", content: executionPrompt },
    ]);

    // Parse AI response
    const responseText = result.response || result;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AI could not process this task", raw: responseText },
        { status: 500 }
      );
    }

    const executionResult = JSON.parse(jsonMatch[0]);

    // If task was executed immediately with content, save deliverables
    const savedDeliverables: string[] = [];
    if (executionResult.strategy === "immediate" && executionResult.content?.length > 0) {
      const contentType = executionResult.contentType || "other";

      for (const item of executionResult.content) {
        // Map content type to deliverable type
        let deliverableType = contentType;
        if (contentType === "social_posts") {
          deliverableType = "social_post";
        }

        // Determine platform from item or content type
        let platform = item.platform?.toLowerCase().replace("/x", "").trim() || null;
        if (platform === "twitter") platform = "twitter";
        else if (platform === "linkedin") platform = "linkedin";
        else if (platform === "instagram") platform = "instagram";
        else if (platform === "facebook") platform = "facebook";
        else if (platform === "youtube") platform = "youtube";

        const { data: deliverable, error: deliverableError } = await supabase
          .from("task_deliverables")
          .insert({
            task_id: taskId,
            user_id: user.id,
            content_type: deliverableType,
            title: item.title || `${platform ? platform.charAt(0).toUpperCase() + platform.slice(1) + " " : ""}${contentType === "social_posts" ? "Post" : "Content"}`,
            content: item.content,
            platform: platform,
            format: "plain",
            metadata: {
              char_count: item.content.length,
              original_platform: item.platform,
            },
            ai_generated: true,
            ai_model: "gpt-4o",
            ai_prompt_context: task.title,
          })
          .select("id")
          .single();

        if (!deliverableError && deliverable) {
          savedDeliverables.push(deliverable.id);
        }
      }

      // Mark task as done
      await supabase
        .from("tasks")
        .update({ status: "done" })
        .eq("id", taskId);
    } else if (executionResult.strategy === "immediate") {
      // No content but still immediate - just mark done
      await supabase
        .from("tasks")
        .update({ status: "done" })
        .eq("id", taskId);
    }

    // If task needs subtasks, create them
    if (executionResult.strategy === "decompose" && executionResult.subtasks?.length > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      for (const subtask of executionResult.subtasks) {
        await supabase.from("tasks").insert({
          organization_id: profile?.organization_id,
          user_id: user.id,
          title: subtask.title,
          description: subtask.description || null,
          priority: task.priority,
          status: "todo",
          project_id: task.project_id,
        });
      }

      // Mark parent as in_progress (waiting for subtasks)
      await supabase
        .from("tasks")
        .update({ status: "in_progress" })
        .eq("id", taskId);
    }

    return NextResponse.json({
      success: true,
      taskId,
      ...executionResult,
      savedDeliverables,
      deliverableCount: savedDeliverables.length,
    });

  } catch (error) {
    console.error("Task execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute task", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks/execute?taskId=xxx
 * Check execution status or get execution history
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = req.nextUrl.searchParams.get("taskId");

    if (taskId) {
      // Get specific task
      const { data: task } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      return NextResponse.json({ task });
    }

    // Get all tasks that can be executed
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "done")
      .order("created_at", { ascending: false });

    return NextResponse.json({
      tasks: tasks || [],
      count: tasks?.length || 0,
    });
  } catch (error) {
    console.error("GET tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
