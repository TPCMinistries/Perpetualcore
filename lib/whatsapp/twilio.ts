import twilio from "twilio";
import { createClient } from "@/lib/supabase/server";
import { getChatCompletion } from "@/lib/ai/router";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., "whatsapp:+14155238886"

// Lazy initialization to avoid build-time errors
let twilioClient: ReturnType<typeof twilio> | null = null;
function getTwilioClient() {
  if (!twilioClient && accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  mediaUrl?: string
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    // Ensure phone number has whatsapp: prefix
    const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const messageOptions: any = {
      from: twilioPhoneNumber,
      to: toNumber,
      body: message,
    };

    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl];
    }

    const client = getTwilioClient();
    if (!client) {
      throw new Error("Twilio client not initialized");
    }
    const response = await client.messages.create(messageOptions);

    return {
      success: true,
      messageSid: response.sid,
    };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process incoming WhatsApp message
 */
export async function processIncomingWhatsAppMessage(
  from: string,
  to: string,
  body: string,
  messageSid: string,
  numMedia: number = 0,
  mediaUrl?: string
): Promise<{ success: boolean; reply?: string; error?: string }> {
  try {
    const supabase = createClient();

    // Clean phone numbers (remove whatsapp: prefix)
    const fromNumber = from.replace("whatsapp:", "");
    const toNumber = to.replace("whatsapp:", "");

    // Find WhatsApp account
    const { data: account } = await supabase
      .from("whatsapp_accounts")
      .select("*")
      .eq("phone_number", toNumber)
      .eq("enabled", true)
      .single();

    if (!account) {
      console.log("No WhatsApp account found for:", toNumber);
      return {
        success: false,
        error: "Account not found",
      };
    }

    // Save incoming message
    const { data: savedMessage, error: saveError } = await supabase
      .from("whatsapp_messages")
      .insert({
        whatsapp_account_id: account.id,
        organization_id: account.organization_id,
        user_id: account.user_id,
        twilio_message_sid: messageSid,
        direction: "inbound",
        from_number: fromNumber,
        to_number: toNumber,
        body: body,
        media_url: mediaUrl,
        num_media: numMedia,
        status: "received",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving message:", saveError);
    }

    // Update or create conversation
    await supabase
      .from("whatsapp_conversations")
      .upsert({
        whatsapp_account_id: account.id,
        organization_id: account.organization_id,
        user_id: account.user_id,
        phone_number: fromNumber,
        last_message_at: new Date().toISOString(),
        last_message_preview: body.substring(0, 100),
      });

    // If AI is enabled, generate response
    if (account.ai_enabled) {
      const aiResponse = await generateAIResponse(body, account.user_id);

      if (aiResponse) {
        // Send AI response
        const sendResult = await sendWhatsAppMessage(from, aiResponse);

        if (sendResult.success) {
          // Save outbound message
          await supabase.from("whatsapp_messages").insert({
            whatsapp_account_id: account.id,
            organization_id: account.organization_id,
            user_id: account.user_id,
            twilio_message_sid: sendResult.messageSid,
            direction: "outbound",
            from_number: toNumber,
            to_number: fromNumber,
            body: aiResponse,
            status: "sent",
            ai_response: true,
            ai_model: "gpt-4o-mini",
          });
        }

        return {
          success: true,
          reply: aiResponse,
        };
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate AI response for WhatsApp message
 */
async function generateAIResponse(
  message: string,
  userId: string
): Promise<string | null> {
  try {
    const supabase = createClient();

    // Get recent WhatsApp conversation history for context
    const { data: recentMessages } = await supabase
      .from("whatsapp_messages")
      .select("direction, body")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Build conversation context
    const conversationHistory = recentMessages
      ?.reverse()
      .map((msg: any) => ({
        role: msg.direction === "inbound" ? "user" : "assistant",
        content: msg.body,
      })) || [];

    // Add system prompt
    const messages = [
      {
        role: "system" as const,
        content: `You are an AI assistant responding via WhatsApp. Keep responses concise (under 300 characters when possible). Be helpful, friendly, and direct. You have access to the user's AI Brain data.`,
      },
      ...conversationHistory,
      {
        role: "user" as const,
        content: message,
      },
    ];

    const response = await getChatCompletion("gpt-4o-mini", messages);

    return response;
  } catch (error) {
    console.error("Error generating AI response:", error);
    return null;
  }
}

/**
 * Verify WhatsApp number with code
 */
export async function verifyWhatsAppNumber(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { data: account, error } = await supabase
      .from("whatsapp_accounts")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("verification_code", code)
      .single();

    if (error || !account) {
      return {
        success: false,
        error: "Invalid verification code",
      };
    }

    // Mark as verified
    await supabase
      .from("whatsapp_accounts")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
        verification_code: null,
      })
      .eq("id", account.id);

    return { success: true };
  } catch (error) {
    console.error("Error verifying WhatsApp number:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send verification code
 */
export async function sendVerificationCode(
  phoneNumber: string,
  userId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create or update WhatsApp account
    await supabase.from("whatsapp_accounts").upsert({
      user_id: userId,
      organization_id: organizationId,
      phone_number: phoneNumber,
      twilio_phone_number: twilioPhoneNumber,
      status: "pending",
      verification_code: code,
    });

    // Send verification message
    const result = await sendWhatsAppMessage(
      phoneNumber,
      `Your AI Brain verification code is: ${code}\n\nReply with this code to connect your WhatsApp.`
    );

    return result;
  } catch (error) {
    console.error("Error sending verification code:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get message status from Twilio
 */
export async function getMessageStatus(
  messageSid: string
): Promise<{ status: string; error?: string }> {
  try {
    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }

    const client = getTwilioClient();
    if (!client) {
      throw new Error("Twilio client not initialized");
    }
    const message = await client.messages(messageSid).fetch();

    return {
      status: message.status,
    };
  } catch (error) {
    console.error("Error fetching message status:", error);
    return {
      status: "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
