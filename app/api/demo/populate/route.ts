import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sampleDocuments,
  sampleTasks,
  sampleConversations,
  sampleCalendarEvents,
} from "@/lib/demo/sampleData";

export async function POST() {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to get organization_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const organization_id = profile.organization_id;

    // Check if demo data already exists
    const { data: existingData, error: checkError } = await supabase
      .from("documents")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("title", "Product Roadmap 2025")
      .single();

    if (existingData) {
      return NextResponse.json({
        success: false,
        message: "Demo data already exists. Clear existing data first.",
      });
    }

    let documentsCreated = 0;
    let tasksCreated = 0;
    let conversationsCreated = 0;
    let eventsCreated = 0;

    // Insert sample documents
    for (const doc of sampleDocuments) {
      const { error } = await supabase.from("documents").insert({
        organization_id,
        user_id: user.id,
        title: doc.title,
        content: doc.content,
        file_type: doc.file_type,
        file_size: Buffer.from(doc.content).length,
        status: "completed",
        metadata: {
          wordCount: doc.content.split(" ").length,
          charCount: doc.content.length,
        },
      });

      if (!error) documentsCreated++;
    }

    // Insert sample tasks
    for (const task of sampleTasks) {
      const { error } = await supabase.from("tasks").insert({
        organization_id,
        user_id: user.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
      });

      if (!error) tasksCreated++;
    }

    // Insert sample conversations and messages
    for (const conv of sampleConversations) {
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          organization_id,
          user_id: user.id,
          title: conv.title,
          model: "claude-sonnet-4",
        })
        .select()
        .single();

      if (!convError && conversation) {
        conversationsCreated++;

        // Insert messages for this conversation
        for (const msg of conv.messages) {
          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            role: msg.role,
            content: msg.content,
          });
        }
      }
    }

    // Insert sample calendar events
    for (const event of sampleCalendarEvents) {
      const { error } = await supabase.from("calendar_events").insert({
        organization_id,
        user_id: user.id,
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
      });

      if (!error) eventsCreated++;
    }

    // Mark user as having demo data
    await supabase
      .from("profiles")
      .update({ demo_mode: true })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      message: "Demo data populated successfully!",
      summary: {
        documents: documentsCreated,
        tasks: tasksCreated,
        conversations: conversationsCreated,
        events: eventsCreated,
      },
    });
  } catch (error) {
    console.error("Demo populate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
