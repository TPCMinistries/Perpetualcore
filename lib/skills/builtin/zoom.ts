/**
 * Zoom Skill
 *
 * Manage Zoom meetings and scheduling.
 * Wraps existing Zoom OAuth integration from lib/integrations/config.ts
 */

import { Skill, ToolContext, ToolResult } from "../types";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveCredential } from "../credentials";

async function getZoomToken(userId: string, organizationId: string): Promise<string | null> {
  const cred = await resolveCredential("zoom", userId, organizationId);
  if (cred?.key) return cred.key;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("integrations")
    .select("access_token")
    .eq("organization_id", organizationId)
    .eq("provider", "zoom")
    .eq("is_active", true)
    .single();

  return data?.access_token || null;
}

async function zoomApi(token: string, path: string, method: string = "GET", body?: any): Promise<any> {
  const response = await fetch(`https://api.zoom.us/v2${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

/**
 * List upcoming meetings
 */
async function listMeetings(
  params: { type?: string },
  context: ToolContext
): Promise<ToolResult> {
  const token = await getZoomToken(context.userId, context.organizationId);
  if (!token) {
    return { success: false, error: "Zoom not connected. Please add your token in Settings > Skills." };
  }

  const result = await zoomApi(token, `/users/me/meetings?type=${params.type || "upcoming"}`);

  if (result.code) {
    return { success: false, error: result.message || "Failed to list meetings" };
  }

  const meetings = (result.meetings || []).map((m: any) => ({
    id: m.id,
    topic: m.topic,
    startTime: m.start_time,
    duration: m.duration,
    joinUrl: m.join_url,
    status: m.status,
  }));

  return {
    success: true,
    data: { meetings },
    display: {
      type: "table",
      content: {
        headers: ["Topic", "Start", "Duration", "Status"],
        rows: meetings.slice(0, 10).map((m: any) => [
          m.topic?.substring(0, 30) || "-",
          m.startTime ? new Date(m.startTime).toLocaleString() : "-",
          `${m.duration} min`,
          m.status || "-",
        ]),
      },
    },
  };
}

/**
 * Create a new meeting
 */
async function createMeeting(
  params: {
    topic: string;
    startTime?: string;
    duration?: number;
    agenda?: string;
  },
  context: ToolContext
): Promise<ToolResult> {
  const token = await getZoomToken(context.userId, context.organizationId);
  if (!token) {
    return { success: false, error: "Zoom not connected." };
  }

  const meetingData: any = {
    topic: params.topic,
    type: params.startTime ? 2 : 1, // 2=scheduled, 1=instant
    duration: params.duration || 30,
    settings: {
      join_before_host: true,
      waiting_room: false,
      auto_recording: "none",
    },
  };

  if (params.startTime) meetingData.start_time = params.startTime;
  if (params.agenda) meetingData.agenda = params.agenda;

  const result = await zoomApi(token, "/users/me/meetings", "POST", meetingData);

  if (result.code) {
    return { success: false, error: result.message || "Failed to create meeting" };
  }

  return {
    success: true,
    data: {
      id: result.id,
      joinUrl: result.join_url,
      startUrl: result.start_url,
      password: result.password,
    },
    display: {
      type: "card",
      content: {
        title: `Meeting Created: ${params.topic}`,
        description: params.agenda || "No agenda set",
        fields: [
          { label: "Join URL", value: result.join_url },
          { label: "Meeting ID", value: result.id?.toString() },
          { label: "Duration", value: `${params.duration || 30} minutes` },
          { label: "Password", value: result.password || "None" },
        ],
      },
    },
  };
}

/**
 * Get meeting details
 */
async function getMeeting(
  params: { meetingId: string },
  context: ToolContext
): Promise<ToolResult> {
  const token = await getZoomToken(context.userId, context.organizationId);
  if (!token) {
    return { success: false, error: "Zoom not connected." };
  }

  const result = await zoomApi(token, `/meetings/${params.meetingId}`);

  if (result.code) {
    return { success: false, error: result.message || "Meeting not found" };
  }

  return {
    success: true,
    data: result,
    display: {
      type: "card",
      content: {
        title: result.topic,
        description: result.agenda || "No agenda",
        fields: [
          { label: "Start", value: result.start_time ? new Date(result.start_time).toLocaleString() : "Instant" },
          { label: "Duration", value: `${result.duration} min` },
          { label: "Join URL", value: result.join_url },
          { label: "Status", value: result.status || "-" },
        ],
      },
    },
  };
}

export const zoomSkill: Skill = {
  id: "zoom",
  name: "Zoom",
  description: "Schedule and manage Zoom meetings directly from your AI assistant",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "communication",
  tags: ["zoom", "meetings", "video", "conferencing", "scheduling"],

  icon: "📹",
  color: "#2D8CFF",

  tier: "pro",
  isBuiltIn: true,

  requiredEnvVars: [],
  requiredIntegrations: ["zoom"],

  configSchema: {
    apiToken: {
      type: "string",
      label: "Zoom OAuth Token",
      description: "Connect via OAuth in Integrations, or paste a token here",
      required: true,
      placeholder: "eyJ...",
    },
  },

  tools: [
    {
      name: "list_meetings",
      description: "List upcoming Zoom meetings",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "Meeting type: upcoming, live, or scheduled (default: upcoming)" },
        },
      },
      execute: listMeetings,
    },
    {
      name: "create_meeting",
      description: "Create a new Zoom meeting",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Meeting topic/name" },
          startTime: { type: "string", description: "Start time in ISO format (optional, omit for instant meeting)" },
          duration: { type: "number", description: "Duration in minutes (default: 30)" },
          agenda: { type: "string", description: "Meeting agenda (optional)" },
        },
        required: ["topic"],
      },
      execute: createMeeting,
    },
    {
      name: "get_meeting",
      description: "Get details of a specific Zoom meeting",
      parameters: {
        type: "object",
        properties: {
          meetingId: { type: "string", description: "Zoom meeting ID" },
        },
        required: ["meetingId"],
      },
      execute: getMeeting,
    },
  ],

  systemPrompt: `You have Zoom integration. When users ask about meetings:
- Use "list_meetings" to show upcoming meetings
- Use "create_meeting" to schedule new meetings (ask for topic, time, duration)
- Use "get_meeting" for meeting details
Share join URLs when creating meetings. Confirm before scheduling.`,
};
