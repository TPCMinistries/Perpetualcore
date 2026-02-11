import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/server";
import { buildBrainPrompt, buildBrainUserMessage } from "@/lib/voice-intel/brain-prompt";
import type {
  VoiceIntelContext,
  BrainClassificationOutput,
  ClassifyVoiceMemoResult,
  VoiceIntelClassification,
  VoiceIntelAction,
} from "@/lib/voice-intel/types";

const PROCESSING_MODEL = "claude-sonnet-4-5-20250929";

export async function classifyVoiceMemo(
  memoId: string,
  userId: string,
  transcript: string,
  title?: string
): Promise<ClassifyVoiceMemoResult> {
  const supabase = createAdminClient();
  const startTime = Date.now();

  try {
    // Update classification status to processing
    await supabase
      .from("voice_memos")
      .update({ classification_status: "processing" })
      .eq("id", memoId);

    // 1. Load user's context
    const { data: contextRows } = await supabase
      .from("voice_intel_context")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    const context: VoiceIntelContext[] = contextRows || [];

    // 2. Build prompts
    const systemPrompt = buildBrainPrompt(context);
    const userMessage = buildBrainUserMessage(transcript, title);

    // 3. Call Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: PROCESSING_MODEL,
      max_tokens: 4096,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const aiText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // 4. Parse JSON response
    let output: BrainClassificationOutput;
    try {
      output = JSON.parse(aiText);
    } catch {
      console.error("Brain classifier: failed to parse JSON:", aiText.slice(0, 500));
      throw new Error("Brain classifier returned invalid JSON");
    }

    const durationMs = Date.now() - startTime;

    // 5. Insert classification row
    const { data: classification, error: classError } = await supabase
      .from("voice_intel_classifications")
      .insert({
        voice_memo_id: memoId,
        user_id: userId,
        entity: output.entity,
        activity: output.activity,
        action_type: output.action_type,
        confidence_scores: output.confidence,
        people: output.people,
        prophetic_words: output.prophetic_words,
        has_prophetic_content: output.has_prophetic_content,
        discoveries: output.discoveries,
        brain_summary: output.summary,
        brain_raw_output: output,
        action_items: output.action_items,
        processing_model: PROCESSING_MODEL,
        processing_duration_ms: durationMs,
      })
      .select()
      .single();

    if (classError || !classification) {
      console.error("Brain classifier: insert classification error:", classError);
      throw new Error("Failed to insert classification");
    }

    // 6. Insert action items
    const actionInserts = output.action_items.map((item) => {
      const isAutoComplete = item.tier === "yellow" || item.tier === "green";
      return {
        user_id: userId,
        classification_id: classification.id,
        voice_memo_id: memoId,
        tier: item.tier,
        action_type: item.action_type,
        title: item.title,
        description: item.description,
        related_entity: item.related_entity,
        related_people: item.related_people,
        delivery_payload: item.delivery_payload || {},
        status: isAutoComplete ? "auto_completed" : "pending",
        priority: item.tier === "red" ? 1 : item.tier === "yellow" ? 2 : 3,
        completed_at: isAutoComplete ? new Date().toISOString() : null,
      };
    });

    let actions: VoiceIntelAction[] = [];
    if (actionInserts.length > 0) {
      const { data: insertedActions, error: actionsError } = await supabase
        .from("voice_intel_actions")
        .insert(actionInserts)
        .select();

      if (actionsError) {
        console.error("Brain classifier: insert actions error:", actionsError);
      } else {
        actions = insertedActions || [];
      }
    }

    // 7. Process discoveries — insert new context items
    if (output.discoveries.length > 0) {
      const discoveryInserts = output.discoveries.map((d) => ({
        user_id: userId,
        context_type: d.type,
        name: d.name,
        aliases: [],
        metadata: { inferred_context: d.inferred_context, source: "discovery" },
        is_active: true,
      }));

      const { error: discoveryError } = await supabase
        .from("voice_intel_context")
        .upsert(discoveryInserts, { onConflict: "user_id,context_type,name", ignoreDuplicates: true });

      if (discoveryError) {
        console.error("Brain classifier: insert discoveries error:", discoveryError);
      }
    }

    // 8. Update voice_memos row
    const updateFields: Record<string, unknown> = {
      classification_status: "completed",
      classification_id: classification.id,
    };

    if (
      output.title_suggestion &&
      title &&
      title.startsWith("Voice Memo ")
    ) {
      updateFields.title = output.title_suggestion;
    }

    await supabase
      .from("voice_memos")
      .update(updateFields)
      .eq("id", memoId);

    return {
      classification: classification as VoiceIntelClassification,
      actions,
      discoveries: output.discoveries,
    };
  } catch (error) {
    console.error(`Brain classifier failed for memo ${memoId}:`, error);

    // Mark as failed
    await supabase
      .from("voice_memos")
      .update({ classification_status: "failed" })
      .eq("id", memoId);

    throw error;
  }
}
