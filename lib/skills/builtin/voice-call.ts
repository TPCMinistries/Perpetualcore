/**
 * Voice Call Skill
 *
 * Enables initiating, monitoring, and ending phone calls via Twilio.
 */

import { Skill, ToolContext, ToolResult } from "../types";
import { initiateCall, getCallStatus, endCall, getUserCalls } from "@/lib/voice/calls";

async function voiceCallInitiate(
  params: {
    to: string;
    greeting?: string;
    instructions?: string;
    record?: boolean;
    maxDuration?: number;
  },
  context: ToolContext
): Promise<ToolResult> {
  try {
    if (!params.to) {
      return { success: false, error: "Phone number is required" };
    }

    if (!/^\+[1-9]\d{1,14}$/.test(params.to)) {
      return {
        success: false,
        error: "Phone number must be in E.164 format (e.g., +1234567890)",
      };
    }

    const result = await initiateCall(context.userId, params.to, {
      greeting: params.greeting,
      instructions: params.instructions,
      record: params.record,
      maxDuration: params.maxDuration,
    });

    return {
      success: true,
      data: result,
      display: {
        type: "card",
        content: {
          title: "Call Initiated",
          description: `Calling ${params.to}`,
          fields: [
            { label: "Call ID", value: result.callId },
            { label: "Status", value: "Initiated" },
          ],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function voiceCallStatus(
  params: { callSid: string },
  context: ToolContext
): Promise<ToolResult> {
  try {
    if (!params.callSid) {
      return { success: false, error: "Call SID is required" };
    }

    const status = await getCallStatus(params.callSid);

    return {
      success: true,
      data: { callSid: params.callSid, status },
      display: {
        type: "card",
        content: {
          title: "Call Status",
          fields: [
            { label: "Call SID", value: params.callSid },
            { label: "Status", value: status },
          ],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function voiceCallEnd(
  params: { callSid: string },
  context: ToolContext
): Promise<ToolResult> {
  try {
    if (!params.callSid) {
      return { success: false, error: "Call SID is required" };
    }

    await endCall(params.callSid);

    return {
      success: true,
      data: { callSid: params.callSid, status: "ended" },
      display: {
        type: "text",
        content: `Call ${params.callSid} has been ended.`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const voiceCallSkill: Skill = {
  id: "voice-call",
  name: "Voice Calls",
  description: "Make and manage phone calls via Twilio",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "communication",
  tags: ["voice", "phone", "call", "twilio"],

  icon: "📞",
  color: "#F22F46",

  requiredEnvVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],

  tier: "pro",
  isBuiltIn: true,

  tools: [
    {
      name: "voice_call_initiate",
      description:
        "Initiate an outbound phone call. Provide a phone number in E.164 format and an optional greeting/instructions.",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "Phone number to call in E.164 format (e.g., +1234567890)",
          },
          greeting: {
            type: "string",
            description: "Opening greeting spoken when the call connects",
          },
          instructions: {
            type: "string",
            description: "Message or instructions to speak during the call",
          },
          record: {
            type: "boolean",
            description: "Whether to record the call (default false)",
          },
          maxDuration: {
            type: "number",
            description: "Maximum call duration in seconds",
          },
        },
        required: ["to"],
      },
      execute: voiceCallInitiate,
    },
    {
      name: "voice_call_status",
      description: "Check the current status of a call",
      parameters: {
        type: "object",
        properties: {
          callSid: {
            type: "string",
            description: "Twilio Call SID to check",
          },
        },
        required: ["callSid"],
      },
      execute: voiceCallStatus,
    },
    {
      name: "voice_call_end",
      description: "End an active phone call",
      parameters: {
        type: "object",
        properties: {
          callSid: {
            type: "string",
            description: "Twilio Call SID to end",
          },
        },
        required: ["callSid"],
      },
      execute: voiceCallEnd,
    },
  ],

  systemPrompt: `You can make phone calls on behalf of the user. When making calls:
- Always ask the user for the phone number and what to say
- Phone numbers must be in E.164 format (e.g., +1234567890)
- Use voice_call_initiate to start a call with a greeting and/or instructions
- Use voice_call_status to check if a call is still active
- Use voice_call_end to hang up an active call
- Calls can optionally be recorded`,
};
