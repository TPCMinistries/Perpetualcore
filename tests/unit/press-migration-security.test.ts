import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260715_press_foundation.sql",
);
const sql = readFileSync(migrationPath, "utf8");
const membershipSql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260715_press_membership_backfill.sql"),
  "utf8",
);
const heartbeatSql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260715_press_worker_heartbeat.sql"),
  "utf8",
);
const generationSql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260715_press_generation_studio.sql"),
  "utf8",
);
const productionArtifactsSql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260716_press_production_artifacts.sql"),
  "utf8",
);

describe("Press foundation migration security contract", () => {
  it("defines every runtime table with RLS", () => {
    const tables = [
      "press_projects",
      "press_assets",
      "press_jobs",
      "press_transcripts",
      "press_transcript_segments",
      "press_clips",
      "press_renders",
      "press_brand_profiles",
      "press_voice_consents",
      "press_publish_targets",
      "press_publish_credentials",
      "press_publications",
      "press_analytics_events",
    ];
    for (const table of tables) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
  });

  it("uses hardened non-recursive membership helpers", () => {
    expect(sql).toMatch(/press_has_org_role[\s\S]+SECURITY DEFINER/);
    expect(sql).toContain("SET search_path = public, pg_temp");
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.press_has_org_role(uuid, text[]) FROM PUBLIC, anon");
    expect(sql).not.toContain("created_by = created_by");
  });

  it("binds child resources to the same organization as their parent", () => {
    expect(sql.match(/FOREIGN KEY \([^)]*organization_id\)/g)?.length).toBeGreaterThanOrEqual(9);
    expect(sql).toContain("press organization_id is immutable");
  });

  it("keeps buckets private and renders worker-write-only", () => {
    expect(sql).toContain("('press-assets', 'press-assets', false");
    expect(sql).toContain("('press-renders', 'press-renders', false");
    expect(sql).toContain("press_storage_assets_insert");
    expect(sql).not.toMatch(/CREATE POLICY press_storage_renders_(insert|update|delete)/);
  });

  it("keeps queue, credentials, and analytics writes service-role only", () => {
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.press_claim_next_job(text, integer, text[]) TO service_role");
    expect(sql).toContain("FOR UPDATE SKIP LOCKED");
    expect(sql).not.toMatch(/CREATE POLICY press_jobs_(insert|update|delete)/);
    expect(sql).not.toMatch(/CREATE POLICY press_analytics_(insert|update|delete)/);
    expect(sql).not.toMatch(/CREATE POLICY press_publish_credentials_/);
  });

  it("fails publication execution closed", () => {
    expect(sql).toContain("provider publishing is service-role only");
    expect(sql).toContain("adapter_configured = true");
    expect(sql).toContain("CREATE POLICY press_publications_select");
    expect(sql).toContain("UNIQUE (organization_id, idempotency_key)");
  });

  it("makes transcript replacement atomic and service-role only", () => {
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.press_replace_transcript");
    expect(sql).toContain("jsonb_array_elements(p_segments) WITH ORDINALITY");
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.press_replace_transcript(uuid, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated",
    );
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.press_update_transcript");
    expect(sql).toContain("WHERE id = p_transcript_id FOR UPDATE");
  });

  it("backfills legacy organization access idempotently without weakening authorization", () => {
    expect(membershipSql).toContain("organization_members_org_user_idx");
    expect(membershipSql).toContain("ON CONFLICT (organization_id, user_id) DO NOTHING");
    expect(membershipSql).toContain("WHERE profile.organization_id IS NOT NULL");
    expect(membershipSql).not.toContain("DISABLE ROW LEVEL SECURITY");
  });

  it("keeps worker liveness service-role only", () => {
    expect(heartbeatSql).toContain("ALTER TABLE public.press_worker_heartbeats ENABLE ROW LEVEL SECURITY");
    expect(heartbeatSql).toContain("REVOKE ALL ON public.press_worker_heartbeats FROM PUBLIC, anon, authenticated");
    expect(heartbeatSql).toContain("GRANT SELECT, INSERT, UPDATE, DELETE ON public.press_worker_heartbeats TO service_role");
    expect(heartbeatSql).not.toMatch(/CREATE POLICY/);
  });

  it("queues clip-pack generation atomically and keeps mutations service-role only", () => {
    expect(generationSql).toContain("CREATE TABLE IF NOT EXISTS public.press_generation_runs");
    expect(generationSql).toContain("FOREIGN KEY (project_id, organization_id)");
    expect(generationSql).toContain("press_jobs_generation_run_tenant_fk");
    expect(generationSql).toContain("press_clips_generation_run_tenant_fk");
    expect(generationSql).toContain("CREATE OR REPLACE FUNCTION public.press_queue_authentic_clip_pack");
    expect(generationSql).toContain("auth.role() IS DISTINCT FROM 'service_role'");
    expect(generationSql).toContain("GRANT SELECT ON public.press_generation_runs TO authenticated");
    expect(generationSql).not.toMatch(/CREATE POLICY press_generation_runs_(insert|update|delete)/);
    expect(generationSql).toContain("ON CONFLICT (idempotency_key) DO NOTHING");
  });

  it("keeps worker derivatives private and explicitly allows waveform artifacts", () => {
    expect(productionArtifactsSql).toContain("'proxy','poster','waveform'");
    expect(productionArtifactsSql).toContain("where id = 'press-assets'");
    expect(productionArtifactsSql).toContain("'application/json'");
    expect(productionArtifactsSql).not.toContain("public = true");
  });
});
