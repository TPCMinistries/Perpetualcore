import { createAdminClient } from "@/lib/supabase/server";

export async function seedLorenzoContext(userId: string) {
  const supabase = createAdminClient();

  const contextItems = [
    // Entities
    {
      user_id: userId,
      context_type: "entity" as const,
      name: "IHA",
      aliases: ["Institute for Human Advancement"],
      metadata: { type: "nonprofit", description: "Parent nonprofit organization" },
      is_active: true,
    },
    {
      user_id: userId,
      context_type: "entity" as const,
      name: "Uplift Communities",
      aliases: ["Uplift", "DYCD"],
      metadata: { type: "operating arm", description: "Workforce programs, DYCD contracts" },
      is_active: true,
    },
    {
      user_id: userId,
      context_type: "entity" as const,
      name: "DeepFutures Capital",
      aliases: ["DeepFutures", "the fund"],
      metadata: { type: "investment fund", description: "Investment fund" },
      is_active: true,
    },
    {
      user_id: userId,
      context_type: "entity" as const,
      name: "TPC Ministries",
      aliases: ["TPC", "Third Presbyterian", "the church"],
      metadata: { type: "ministry", description: "Third Presbyterian Church - ministry, faith" },
      is_active: true,
    },
    {
      user_id: userId,
      context_type: "entity" as const,
      name: "Perpetual Core",
      aliases: ["the platform", "AI OS"],
      metadata: { type: "SaaS", description: "AI OS platform - SaaS product" },
      is_active: true,
    },
    {
      user_id: userId,
      context_type: "entity" as const,
      name: "Personal/Family",
      aliases: ["personal", "family"],
      metadata: { type: "personal", description: "Personal life, family matters" },
      is_active: true,
    },

    // People
    {
      user_id: userId,
      context_type: "person" as const,
      name: "Dr. Michael Silber",
      aliases: ["Silber", "Dr. Silber", "Mike Silber"],
      metadata: { entity_link: "Uplift Communities", role: "Medical Director, KBCC" },
      is_active: true,
    },
    {
      user_id: userId,
      context_type: "person" as const,
      name: "Achumboro",
      aliases: ["Achu"],
      metadata: { entity_link: "Uplift Communities", role: "COO" },
      is_active: true,
    },
    {
      user_id: userId,
      context_type: "person" as const,
      name: "Pastor Richardson",
      aliases: ["Richardson", "Pastor R"],
      metadata: { entity_link: "TPC Ministries", role: "Senior Pastor" },
      is_active: true,
    },
    {
      user_id: userId,
      context_type: "person" as const,
      name: "Pastor Chambers",
      aliases: ["Dad", "Pops", "my father"],
      metadata: { entity_link: "TPC Ministries", role: "Ministry Leader, Father" },
      is_active: true,
    },

    // Projects
    {
      user_id: userId,
      context_type: "project" as const,
      name: "Kenya 2026",
      aliases: ["Kenya trip", "Kenya mission"],
      metadata: { entity_link: "IHA", type: "mission trip" },
      is_active: true,
    },
    {
      user_id: userId,
      context_type: "project" as const,
      name: "DYCD Cohort 4",
      aliases: ["Cohort 4", "C4"],
      metadata: { entity_link: "Uplift Communities", type: "workforce program" },
      is_active: true,
    },
    {
      user_id: userId,
      context_type: "project" as const,
      name: "AI Academy",
      aliases: ["IHA Academy", "the academy"],
      metadata: { entity_link: "IHA", type: "education platform" },
      is_active: true,
    },
    {
      user_id: userId,
      context_type: "project" as const,
      name: "Streams of Grace",
      aliases: ["SOG", "Streams"],
      metadata: { entity_link: "TPC Ministries", type: "faith app" },
      is_active: true,
    },
  ];

  const { data, error } = await supabase
    .from("voice_intel_context")
    .upsert(contextItems, { onConflict: "user_id,context_type,name", ignoreDuplicates: true })
    .select();

  if (error) {
    console.error("Seed context error:", error);
    throw error;
  }

  return data;
}
