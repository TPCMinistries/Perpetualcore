#!/usr/bin/env ts-node
/**
 * Script to generate beta invite codes
 * Usage: npx ts-node scripts/generate-beta-codes.ts [count] [tier]
 * Example: npx ts-node scripts/generate-beta-codes.ts 10 standard
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in environment variables");
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateCode(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function generateBetaCodes() {
  const count = parseInt(process.argv[2]) || 10;
  const tier = process.argv[3] || "standard";
  const maxUses = 1;
  const expiresInDays = 90; // 90 days expiry

  console.log(`\n🎟️  Generating ${count} beta invite codes...`);
  console.log(`   Tier: ${tier}`);
  console.log(`   Max uses per code: ${maxUses}`);
  console.log(`   Expires in: ${expiresInDays} days\n`);

  const codes = [];
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const code = generateCode();
    codes.push({
      code,
      max_uses: maxUses,
      beta_tier: tier,
      expires_at: expiresAt.toISOString(),
    });
  }

  const { data, error } = await supabase
    .from("beta_invite_codes")
    .insert(codes)
    .select();

  if (error) {
    console.error("❌ Error creating invite codes:", error.message);
    process.exit(1);
  }

  console.log("✅ Successfully generated codes:\n");
  console.log("━".repeat(60));
  data?.forEach((code, index) => {
    console.log(`${(index + 1).toString().padStart(2, "0")}. ${code.code} (Tier: ${code.beta_tier})`);
  });
  console.log("━".repeat(60));
  console.log(`\n📋 Total: ${data?.length} codes created`);
  console.log(`🔗 Share these with your beta testers!`);
  console.log(`📅 Valid until: ${expiresAt.toLocaleDateString()}\n`);
}

generateBetaCodes().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
