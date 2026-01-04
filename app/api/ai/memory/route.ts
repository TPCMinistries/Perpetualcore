import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserMemories, addMemory, deleteMemory, verifyMemory, MemoryType } from "@/lib/ai/memory";

export const runtime = "nodejs";

/**
 * GET - Get user's AI memories
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as MemoryType | undefined;
    const limit = parseInt(searchParams.get("limit") || "50");

    const memories = await getUserMemories(supabase, user.id, {
      type: type || undefined,
      limit,
    });

    return NextResponse.json({ memories });
  } catch (error) {
    console.error("Memory GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    );
  }
}

/**
 * POST - Add a new memory
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, content, key, source, confidence } = body;

    if (!type || !content) {
      return NextResponse.json(
        { error: "type and content are required" },
        { status: 400 }
      );
    }

    const memoryId = await addMemory(supabase, user.id, {
      type,
      content,
      key,
      source: source || "manual",
      confidence: confidence || 1.0,
    });

    if (!memoryId) {
      return NextResponse.json(
        { error: "Failed to add memory" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: memoryId, success: true });
  } catch (error) {
    console.error("Memory POST error:", error);
    return NextResponse.json(
      { error: "Failed to add memory" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Verify a memory
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { memoryId, action } = body;

    if (!memoryId) {
      return NextResponse.json(
        { error: "memoryId is required" },
        { status: 400 }
      );
    }

    if (action === "verify") {
      const success = await verifyMemory(supabase, memoryId, user.id);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Memory PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update memory" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a memory
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memoryId = searchParams.get("id");

    if (!memoryId) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const success = await deleteMemory(supabase, memoryId, user.id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Memory DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete memory" },
      { status: 500 }
    );
  }
}
