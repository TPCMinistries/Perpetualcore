import { createAdminClient } from "@/lib/supabase/server";
import type {
  VoiceIntelClassification,
  VoiceIntelAction,
  VoiceIntelContext,
  ExtractedPerson,
  PropheticWord,
  EntityType,
} from "@/lib/voice-intel/types";

// ============================================================
// Types
// ============================================================

export interface PersonBrief {
  name: string;
  entityLink: string | null;
  role: string | null;
  totalMentions: number;
  recentMentions: { memoTitle: string; date: string; summary: string }[];
  actionItems: { title: string; status: string; tier: string }[];
  propheticWords: { content: string; date: string }[];
  lastMentioned: string | null;
  sentiment: string;
}

export interface PatternInsight {
  type: "frequency" | "relationship" | "entity_focus" | "action_trend";
  title: string;
  description: string;
  data: Record<string, unknown>;
}

export interface EntityDashboard {
  entity: string;
  totalMemos: number;
  recentActivity: { activity: string; count: number }[];
  topPeople: { name: string; count: number }[];
  pendingActions: number;
  recentClassifications: { date: string; activity: string; summary: string }[];
}

// ============================================================
// Helpers
// ============================================================

const ENTITIES: EntityType[] = [
  "IHA",
  "Uplift Communities",
  "DeepFutures Capital",
  "TPC Ministries",
  "Perpetual Core",
  "Personal/Family",
];

function countMap<T extends string>(items: T[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) {
    map[item] = (map[item] || 0) + 1;
  }
  return map;
}

function topN(map: Record<string, number>, n: number): { name: string; count: number }[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

function inferSentiment(summaries: string[]): string {
  if (summaries.length === 0) return "neutral";
  const text = summaries.join(" ").toLowerCase();
  const positiveTerms = ["success", "great", "excited", "growth", "opportunity", "blessed", "progress", "win", "good"];
  const negativeTerms = ["problem", "issue", "concern", "fail", "delay", "stuck", "frustrated", "risk", "behind"];
  let pos = 0;
  let neg = 0;
  for (const term of positiveTerms) {
    if (text.includes(term)) pos++;
  }
  for (const term of negativeTerms) {
    if (text.includes(term)) neg++;
  }
  if (pos > neg + 1) return "positive";
  if (neg > pos + 1) return "negative";
  if (pos > 0 && neg > 0) return "mixed";
  return "neutral";
}

// ============================================================
// getPersonBrief
// ============================================================

export async function getPersonBrief(
  userId: string,
  personName: string
): Promise<PersonBrief> {
  const supabase = createAdminClient();

  // Look up person in context table
  const { data: contextRow } = await supabase
    .from("voice_intel_context")
    .select("*")
    .eq("user_id", userId)
    .eq("context_type", "person")
    .ilike("name", personName)
    .maybeSingle();

  // Find all classifications mentioning this person (JSONB text search)
  const { data: classifications } = await supabase
    .from("voice_intel_classifications")
    .select("*, voice_memos!inner(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const matching = (classifications || []).filter((c: VoiceIntelClassification & { voice_memos: { title: string } }) => {
    const people = (c.people || []) as ExtractedPerson[];
    return people.some(
      (p) => p.name.toLowerCase() === personName.toLowerCase()
    );
  });

  // Find actions related to this person
  const { data: actions } = await supabase
    .from("voice_intel_actions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const relatedActions = (actions || []).filter((a: VoiceIntelAction) =>
    (a.related_people || []).some(
      (p: string) => p.toLowerCase() === personName.toLowerCase()
    )
  );

  // Collect prophetic words mentioning this person
  const propheticWords: { content: string; date: string }[] = [];
  for (const c of matching) {
    const pws = (c.prophetic_words || []) as PropheticWord[];
    for (const pw of pws) {
      if (pw.recipient.toLowerCase() === personName.toLowerCase()) {
        propheticWords.push({ content: pw.content, date: c.created_at });
      }
    }
  }

  const summaries = matching
    .map((c: VoiceIntelClassification) => c.brain_summary || "")
    .filter(Boolean);

  // Get entity link from context or first matching classification
  let entityLink: string | null = null;
  let role: string | null = null;
  if (contextRow) {
    entityLink = (contextRow.metadata as Record<string, unknown>)?.entity_link as string || null;
    role = (contextRow.metadata as Record<string, unknown>)?.role as string || null;
  }
  if (!entityLink && matching.length > 0) {
    const firstPerson = (matching[0].people as ExtractedPerson[]).find(
      (p) => p.name.toLowerCase() === personName.toLowerCase()
    );
    entityLink = firstPerson?.entity_link || null;
    role = firstPerson?.role || null;
  }

  return {
    name: personName,
    entityLink,
    role,
    totalMentions: matching.length,
    recentMentions: matching.slice(0, 10).map((c: VoiceIntelClassification & { voice_memos: { title: string } }) => ({
      memoTitle: c.voice_memos?.title || "Untitled",
      date: c.created_at,
      summary: c.brain_summary || "",
    })),
    actionItems: relatedActions.slice(0, 10).map((a: VoiceIntelAction) => ({
      title: a.title,
      status: a.status,
      tier: a.tier,
    })),
    propheticWords: propheticWords.slice(0, 10),
    lastMentioned: matching.length > 0 ? matching[0].created_at : null,
    sentiment: inferSentiment(summaries),
  };
}

// ============================================================
// detectPatterns
// ============================================================

export async function detectPatterns(
  userId: string
): Promise<PatternInsight[]> {
  const supabase = createAdminClient();

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: classifications } = await supabase
    .from("voice_intel_classifications")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false });

  const rows = classifications || [];
  if (rows.length === 0) return [];

  const insights: PatternInsight[] = [];

  // 1. Entity frequency
  const entityCounts = countMap(rows.map((r: VoiceIntelClassification) => r.entity));
  const topEntities = topN(entityCounts, 3);
  if (topEntities.length > 0) {
    insights.push({
      type: "entity_focus",
      title: `Most active entity: ${topEntities[0].name}`,
      description: `In the last 30 days, "${topEntities[0].name}" appeared in ${topEntities[0].count} of ${rows.length} voice memos. ${topEntities.length > 1 ? `Followed by "${topEntities[1].name}" (${topEntities[1].count}).` : ""}`,
      data: { entityCounts, topEntities },
    });
  }

  // 2. Activity distribution
  const activityCounts = countMap(rows.map((r: VoiceIntelClassification) => r.activity));
  const topActivities = topN(activityCounts, 3);
  if (topActivities.length > 0) {
    insights.push({
      type: "frequency",
      title: `Dominant activity: ${topActivities[0].name}`,
      description: `"${topActivities[0].name}" is your most common activity type (${topActivities[0].count} memos). ${topActivities.length > 1 ? `"${topActivities[1].name}" follows with ${topActivities[1].count}.` : ""}`,
      data: { activityCounts, topActivities },
    });
  }

  // 3. People frequency
  const peopleCounts: Record<string, number> = {};
  for (const row of rows) {
    const people = (row.people || []) as ExtractedPerson[];
    for (const p of people) {
      peopleCounts[p.name] = (peopleCounts[p.name] || 0) + 1;
    }
  }
  const topPeople = topN(peopleCounts, 5);
  if (topPeople.length > 0) {
    insights.push({
      type: "relationship",
      title: `Most mentioned person: ${topPeople[0].name}`,
      description: `"${topPeople[0].name}" was mentioned in ${topPeople[0].count} memos over the last 30 days. Top 3: ${topPeople.slice(0, 3).map((p) => `${p.name} (${p.count})`).join(", ")}.`,
      data: { peopleCounts: Object.fromEntries(topPeople.map((p) => [p.name, p.count])) },
    });
  }

  // 4. Action type patterns
  const actionTypeCounts = countMap(rows.map((r: VoiceIntelClassification) => r.action_type));
  const topActionTypes = topN(actionTypeCounts, 3);
  if (topActionTypes.length > 0) {
    insights.push({
      type: "action_trend",
      title: `Primary action mode: ${topActionTypes[0].name}`,
      description: `You're mostly in "${topActionTypes[0].name}" mode (${topActionTypes[0].count} memos). ${topActionTypes.length > 1 ? `Also frequently "${topActionTypes[1].name}" (${topActionTypes[1].count}).` : ""}`,
      data: { actionTypeCounts, topActionTypes },
    });
  }

  // 5. Prophetic content frequency
  const propheticCount = rows.filter(
    (r: VoiceIntelClassification) => r.has_prophetic_content
  ).length;
  if (propheticCount > 0) {
    const pct = Math.round((propheticCount / rows.length) * 100);
    insights.push({
      type: "frequency",
      title: `Prophetic content in ${pct}% of memos`,
      description: `${propheticCount} of your ${rows.length} voice memos in the last 30 days contained prophetic words or ministry content.`,
      data: { propheticCount, totalMemos: rows.length, percentage: pct },
    });
  }

  return insights;
}

// ============================================================
// getEntityDashboard
// ============================================================

export async function getEntityDashboard(
  userId: string,
  entity: string
): Promise<EntityDashboard> {
  const supabase = createAdminClient();

  const { data: classifications } = await supabase
    .from("voice_intel_classifications")
    .select("*")
    .eq("user_id", userId)
    .eq("entity", entity)
    .order("created_at", { ascending: false });

  const rows = classifications || [];

  // Activity breakdown
  const activityCounts = countMap(rows.map((r: VoiceIntelClassification) => r.activity));
  const recentActivity = topN(activityCounts, 7);

  // People mentioned
  const peopleCounts: Record<string, number> = {};
  for (const row of rows) {
    const people = (row.people || []) as ExtractedPerson[];
    for (const p of people) {
      peopleCounts[p.name] = (peopleCounts[p.name] || 0) + 1;
    }
  }
  const topPeople = topN(peopleCounts, 10);

  // Pending actions for this entity
  const { count: pendingActions } = await supabase
    .from("voice_intel_actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("related_entity", entity)
    .eq("status", "pending");

  return {
    entity,
    totalMemos: rows.length,
    recentActivity,
    topPeople,
    pendingActions: pendingActions || 0,
    recentClassifications: rows.slice(0, 10).map((c: VoiceIntelClassification) => ({
      date: c.created_at,
      activity: c.activity,
      summary: c.brain_summary || "",
    })),
  };
}

// ============================================================
// buildDailyDigest
// ============================================================

export async function buildDailyDigest(
  userId: string
): Promise<{ subject: string; html: string }> {
  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com";

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString();
  const dateLabel = yesterday.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Get yesterday's classifications
  const { data: classifications } = await supabase
    .from("voice_intel_classifications")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", yesterdayStr)
    .order("created_at", { ascending: false });

  const rows = classifications || [];

  // Get yesterday's actions
  const { data: actions } = await supabase
    .from("voice_intel_actions")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", yesterdayStr)
    .order("priority", { ascending: false });

  const actionRows = actions || [];

  // Count by tier
  const tierCounts = { red: 0, yellow: 0, green: 0 };
  for (const a of actionRows) {
    tierCounts[a.tier as keyof typeof tierCounts] =
      (tierCounts[a.tier as keyof typeof tierCounts] || 0) + 1;
  }

  // Pending red-tier actions
  const pendingRed = actionRows.filter(
    (a: VoiceIntelAction) => a.tier === "red" && a.status === "pending"
  );

  // Discoveries
  const allDiscoveries = rows.flatMap(
    (c: VoiceIntelClassification) => c.discoveries || []
  );

  // Entity activity summary
  const entityCounts = countMap(rows.map((r: VoiceIntelClassification) => r.entity));
  const topEntities = topN(entityCounts, 6);

  // Build HTML
  const pendingRedHtml =
    pendingRed.length > 0
      ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin: 0 0 8px 0; font-size: 14px;">Pending Red-Tier Actions (${pendingRed.length})</h3>
          ${pendingRed
            .map(
              (a: VoiceIntelAction) =>
                `<div style="padding: 8px 0; border-bottom: 1px solid #fee2e2;">
                  <strong style="color: #991b1b;">${a.title}</strong>
                  <div style="color: #6b7280; font-size: 13px;">${a.description || ""}</div>
                </div>`
            )
            .join("")}
          <a href="${appUrl}/dashboard/voice-intel" style="display: inline-block; margin-top: 12px; color: #dc2626; font-weight: 600; font-size: 13px;">Review in Dashboard &rarr;</a>
        </div>`
      : "";

  const discoveriesHtml =
    allDiscoveries.length > 0
      ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #16a34a; margin: 0 0 8px 0; font-size: 14px;">New Discoveries (${allDiscoveries.length})</h3>
          ${allDiscoveries
            .map(
              (d) =>
                `<div style="padding: 4px 0; color: #374151; font-size: 13px;">
                  <strong>${d.type}:</strong> ${d.name} &mdash; ${d.inferred_context}
                </div>`
            )
            .join("")}
        </div>`
      : "";

  const entitySummaryHtml =
    topEntities.length > 0
      ? `
        <div style="margin: 16px 0;">
          <h3 style="color: #374151; margin: 0 0 8px 0; font-size: 14px;">Entity Activity</h3>
          ${topEntities
            .map(
              (e) =>
                `<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6;">
                  <span style="color: #374151; font-size: 13px;">${e.name}</span>
                  <span style="color: #6b7280; font-size: 13px;">${e.count} memo${e.count !== 1 ? "s" : ""}</span>
                </div>`
            )
            .join("")}
        </div>`
      : "";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Voice Intelligence Digest</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">${dateLabel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px 30px;">
            <!-- Summary Stats -->
            <div style="display: flex; gap: 12px; margin-bottom: 20px;">
              <div style="flex: 1; text-align: center; background: #f9fafb; border-radius: 8px; padding: 12px;">
                <div style="font-size: 24px; font-weight: 700; color: #111827;">${rows.length}</div>
                <div style="font-size: 12px; color: #6b7280;">Memos Processed</div>
              </div>
              <div style="flex: 1; text-align: center; background: #fef2f2; border-radius: 8px; padding: 12px;">
                <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${tierCounts.red}</div>
                <div style="font-size: 12px; color: #6b7280;">Red Tier</div>
              </div>
              <div style="flex: 1; text-align: center; background: #fffbeb; border-radius: 8px; padding: 12px;">
                <div style="font-size: 24px; font-weight: 700; color: #d97706;">${tierCounts.yellow}</div>
                <div style="font-size: 12px; color: #6b7280;">Yellow Tier</div>
              </div>
              <div style="flex: 1; text-align: center; background: #f0fdf4; border-radius: 8px; padding: 12px;">
                <div style="font-size: 24px; font-weight: 700; color: #16a34a;">${tierCounts.green}</div>
                <div style="font-size: 12px; color: #6b7280;">Green Tier</div>
              </div>
            </div>

            ${pendingRedHtml}
            ${discoveriesHtml}
            ${entitySummaryHtml}

            <!-- CTA -->
            <div style="text-align: center; margin: 24px 0;">
              <a href="${appUrl}/dashboard/voice-intel" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">Open Voice Intelligence</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background: #f9fafb; padding: 16px 30px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">Perpetual Core &mdash; Your AI Operating System</p>
          </td>
        </tr>
      </table>
    </div>`;

  return {
    subject: `Voice Intelligence Daily Digest — ${dateLabel}`,
    html,
  };
}
