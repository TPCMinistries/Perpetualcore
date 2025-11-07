import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mock templates as fallback
const MOCK_TEMPLATES = [
  {
    id: "customer-support",
    name: "Customer Support Agent",
    description: "Handles customer inquiries, provides answers from knowledge base, and routes complex issues to human agents. Perfect for reducing support team workload.",
    agent_type: "conversational",
    icon: "💬",
    category: "Communication",
    capabilities: ["Knowledge Base Search", "Email Response", "Ticket Routing", "FAQ Answers"],
    usage_count: 1247,
  },
  {
    id: "email-organizer",
    name: "Email Organizer",
    description: "Automatically sorts, labels, and prioritizes incoming emails. Flags important messages and archives newsletters.",
    agent_type: "automation",
    icon: "📧",
    category: "Productivity",
    capabilities: ["Email Classification", "Priority Detection", "Auto-labeling", "Smart Filtering"],
    usage_count: 892,
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes Agent",
    description: "Summarizes meeting transcripts, extracts action items, and distributes notes to attendees automatically.",
    agent_type: "analysis",
    icon: "📝",
    category: "Productivity",
    capabilities: ["Transcript Analysis", "Action Item Extraction", "Summary Generation", "Distribution"],
    usage_count: 743,
  },
  {
    id: "content-moderator",
    name: "Content Moderator",
    description: "Reviews user-generated content for policy violations, inappropriate language, and spam. Flags items for human review.",
    agent_type: "moderation",
    icon: "🛡️",
    category: "Analytics",
    capabilities: ["Content Analysis", "Policy Checking", "Spam Detection", "Flagging System"],
    usage_count: 531,
  },
  {
    id: "data-analyst",
    name: "Data Analysis Agent",
    description: "Analyzes datasets, generates insights, creates visualizations, and answers questions about your data in natural language.",
    agent_type: "analysis",
    icon: "📊",
    category: "Analytics",
    capabilities: ["Data Analysis", "Visualization", "Insight Generation", "Natural Language Queries"],
    usage_count: 467,
  },
  {
    id: "research-assistant",
    name: "Research Assistant",
    description: "Searches through documents, compiles research summaries, and answers questions using your knowledge base and web sources.",
    agent_type: "research",
    icon: "🔍",
    category: "Knowledge",
    capabilities: ["Document Search", "Web Research", "Summary Compilation", "Citation Management"],
    usage_count: 398,
  },
];

export async function GET() {
  try {
    const supabase = createClient();

    const { data: templates, error } = await supabase
      .from("agent_templates")
      .select("*")
      .order("usage_count", { ascending: false });

    // Return mock templates if database query fails or returns empty
    if (error || !templates || templates.length === 0) {
      console.log("Using mock templates (database not available or empty)");
      return NextResponse.json({ templates: MOCK_TEMPLATES });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Templates API error, returning mock data:", error);
    return NextResponse.json({ templates: MOCK_TEMPLATES });
  }
}
