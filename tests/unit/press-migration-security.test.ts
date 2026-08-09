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
const workspaceOnboardingSql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260808110616_press_workspace_onboarding.sql"),
  "utf8",
);
const pilotLimitsSql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260809190000_press_atomic_finalize_and_pilot_limits.sql"),
  "utf8",
);
const jobFencingSql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260809193000_press_job_fencing_and_result_idempotency.sql"),
  "utf8",
);
const workspaceOnboardingSecuritySql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260809201500_press_workspace_onboarding_security.sql"),
  "utf8",
);
const resultConflictTargetsSql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260809210000_press_result_conflict_targets.sql"),
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

  it("creates a first-use workspace through the trusted server boundary only", () => {
    expect(workspaceOnboardingSql).toContain("v_user_id uuid := p_user_id");
    expect(workspaceOnboardingSql).toContain("press_ensure_workspace(p_user_id uuid)");
    expect(workspaceOnboardingSql).toContain("auth.role() IS DISTINCT FROM 'service_role'");
    expect(workspaceOnboardingSql).toContain("SET search_path = public, pg_temp");
    expect(workspaceOnboardingSql).toContain(
      "ON CONFLICT (organization_id, user_id) DO UPDATE",
    );
    expect(workspaceOnboardingSql).toMatch(
      /FROM public\.organization_members AS member[\s\S]+member\.user_id = v_user_id/,
    );
    expect(workspaceOnboardingSql).not.toMatch(
      /SELECT\s+profile\.organization_id\s+INTO\s+v_org_id/i,
    );
  });

  it("does not grant workspace roles from editable user metadata", () => {
    expect(workspaceOnboardingSql).toContain("raw_user_meta_data ->> 'organization_name'");
    expect(workspaceOnboardingSql).not.toMatch(
      /raw_(?:user|app)_meta_data\s*->>?\s*'role'/i,
    );
    expect(workspaceOnboardingSql).toContain(
      "REVOKE ALL ON FUNCTION public.press_ensure_workspace(uuid) FROM PUBLIC",
    );
    expect(workspaceOnboardingSql).toContain(
      "REVOKE ALL ON FUNCTION public.press_ensure_workspace(uuid) FROM anon",
    );
    expect(workspaceOnboardingSql).toContain(
      "REVOKE ALL ON FUNCTION public.press_ensure_workspace(uuid) FROM authenticated",
    );
    expect(workspaceOnboardingSql).toContain(
      "GRANT EXECUTE ON FUNCTION public.press_ensure_workspace(uuid) TO service_role",
    );
  });

  it("reserves and finalizes pilot uploads atomically behind service-role RPCs", () => {
    expect(pilotLimitsSql).toContain("pg_advisory_xact_lock");
    expect(pilotLimitsSql).toContain("v_reserved_bytes + p_file_size > 10737418240");
    expect(pilotLimitsSql).toContain("p_file_size NOT BETWEEN 1 AND 536870912");
    expect(pilotLimitsSql).toContain("ON CONFLICT (idempotency_key) DO UPDATE");
    expect(pilotLimitsSql).toContain("REVOKE ALL ON FUNCTION public.press_reserve_asset_upload");
    expect(pilotLimitsSql).toContain("REVOKE ALL ON FUNCTION public.press_finalize_asset_upload");
    expect(pilotLimitsSql).toContain("TO service_role");
    expect(pilotLimitsSql).toContain("'audio/x-m4a'");
  });

  it("fences worker leases and makes retryable results idempotent by job", () => {
    expect(jobFencingSql).toContain("lease_token = gen_random_uuid()");
    expect(jobFencingSql).toContain("press_replace_transcript_for_job");
    expect(jobFencingSql).toContain("WHERE source_job_id = p_job_id");
    expect(jobFencingSql).toContain("press_clips_source_job_position_uidx");
    expect(jobFencingSql).toContain("REVOKE ALL ON FUNCTION public.press_replace_transcript_for_job");
  });

  it("runs workspace onboarding with auth access but only for the service role", () => {
    expect(workspaceOnboardingSecuritySql).toMatch(
      /ALTER FUNCTION public\.press_ensure_workspace\(uuid\) SECURITY DEFINER/i,
    );
    expect(workspaceOnboardingSecuritySql).toContain("SET search_path = public, pg_temp");
    expect(workspaceOnboardingSecuritySql).toMatch(
      /REVOKE ALL ON FUNCTION public\.press_ensure_workspace\(uuid\)[\s\S]+authenticated/i,
    );
    expect(workspaceOnboardingSecuritySql).toContain(
      "GRANT EXECUTE ON FUNCTION public.press_ensure_workspace(uuid) TO service_role",
    );
  });

  it("provides non-partial conflict targets for idempotent worker results", () => {
    expect(resultConflictTargetsSql).toContain("DROP INDEX IF EXISTS public.press_transcripts_source_job_uidx");
    expect(resultConflictTargetsSql).toMatch(
      /CREATE UNIQUE INDEX press_transcripts_source_job_uidx\s+ON public\.press_transcripts \(source_job_id\);/i,
    );
    expect(resultConflictTargetsSql).toContain("DROP INDEX IF EXISTS public.press_clips_source_job_position_uidx");
    expect(resultConflictTargetsSql).toMatch(
      /CREATE UNIQUE INDEX press_clips_source_job_position_uidx\s+ON public\.press_clips \(source_job_id, source_position\);/i,
    );
    expect(resultConflictTargetsSql).not.toMatch(/WHERE source_job_id IS NOT NULL/i);
  });
});
