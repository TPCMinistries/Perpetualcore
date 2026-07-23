import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import type { RequestIdentity } from "../store";
import {
  agenticPlanSchema,
  createPlaybookSchema,
  type AgenticPlanRequest,
  type AgentPlaybookRecord,
  type AgentRunRecord,
  type CreatePlaybookInput,
  type PlaybookListQuery,
  type VersionPlaybookInput,
} from "./contracts";
import type { AgenticPlanRun } from "./planner";
import {
  HDI_AGENT_PLANNER_PROMPT_VERSION,
  HDI_AGENT_PLAN_SCHEMA_VERSION,
} from "./planner";

interface PlaybookRow {
  id: string;
  playbook_key: string;
  organization_id: string;
  version: number;
  name: string;
  description: string;
  goal_template: string;
  status: "draft" | "active" | "archived";
  plan: unknown;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RunRow {
  id: string;
  organization_id: string;
  requested_by: string;
  playbook_id: string | null;
  goal: string;
  context: unknown;
  plan: unknown;
  synthesis?: unknown;
  status: "planned" | "running" | "review_ready" | "failed";
  human_review_status: "pending" | "approved" | "needs_revision" | "rejected";
  human_review_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  model: string;
  model_response_id?: string | null;
  prompt_version: string;
  schema_version: string;
  processing_duration_ms?: number | null;
  created_at: string;
  updated_at: string;
}

type RunListRow = Pick<
  RunRow,
  | "id"
  | "playbook_id"
  | "goal"
  | "plan"
  | "synthesis"
  | "status"
  | "human_review_status"
  | "model"
  | "created_at"
  | "updated_at"
>;

export interface AgentRunListQuery {
  limit: number;
  status?: RunRow["status"];
  reviewStatus?: RunRow["human_review_status"];
}

export interface AgentRunListItem {
  id: string;
  playbookId: string | null;
  goal: string;
  planTitle: string;
  intendedUse: string;
  specialistCount: number;
  evidenceCount: number;
  safetyFlagCount: number;
  status: RunRow["status"];
  humanReviewStatus: RunRow["human_review_status"];
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRunSummary {
  total: number;
  planned: number;
  running: number;
  reviewReady: number;
  failed: number;
  pending: number;
  approved: number;
  needsRevision: number;
  rejected: number;
}

export interface AgentRunDetail extends AgentRunRecord {
  requestedBy: string;
  synthesis: Record<string, unknown>;
  modelResponseId: string | null;
  processingDurationMs: number | null;
  humanReviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

type AgenticDatabase = {
  public: {
    Tables: {
      hdi_agent_playbooks: {
        Row: PlaybookRow;
        Insert: Partial<PlaybookRow>;
        Update: Partial<PlaybookRow>;
        Relationships: [];
      };
      hdi_agent_runs: {
        Row: RunRow;
        Insert: Partial<RunRow>;
        Update: Partial<RunRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export class AgenticStoreError extends Error {
  constructor(
    message: string,
    readonly status: 404 | 409 | 500
  ) {
    super(message);
    this.name = "AgenticStoreError";
  }
}

function getAgenticAdmin(): SupabaseClient<AgenticDatabase> {
  return createAdminClient() as unknown as SupabaseClient<AgenticDatabase>;
}

function toStoreError(message: string): AgenticStoreError {
  const normalized = message.toLocaleLowerCase();
  if (normalized.includes("not found")) {
    return new AgenticStoreError(message, 404);
  }
  if (
    normalized.includes("duplicate") ||
    normalized.includes("unique") ||
    normalized.includes("status") ||
    normalized.includes("not pending")
  ) {
    return new AgenticStoreError(message, 409);
  }
  return new AgenticStoreError(message, 500);
}

async function callAgentRpc(
  name:
    | "hdi_create_agent_playbook"
    | "hdi_version_agent_playbook"
    | "hdi_activate_agent_playbook"
    | "hdi_create_agent_run"
    | "hdi_complete_agent_run"
    | "hdi_start_agent_run"
    | "hdi_fail_agent_run"
    | "hdi_review_agent_run"
    | "hdi_agent_run_summary",
  args: Record<string, unknown>
): Promise<unknown> {
  // New additive functions are locally typed until production types regenerate.
  const { data, error } = await createAdminClient().rpc(
    name as never,
    args as never
  );
  if (error) throw toStoreError(error.message);
  return data as unknown;
}

function mapPlaybook(row: PlaybookRow): AgentPlaybookRecord {
  return {
    id: row.id,
    playbookKey: row.playbook_key,
    version: row.version,
    name: row.name,
    description: row.description,
    goalTemplate: row.goal_template,
    status: row.status,
    plan: agenticPlanSchema.parse(row.plan),
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRun(row: RunRow): AgentRunRecord {
  const context =
    row.context && typeof row.context === "object" && !Array.isArray(row.context)
      ? (row.context as AgenticPlanRequest["context"])
      : {};
  return {
    id: row.id,
    playbookId: row.playbook_id,
    goal: row.goal,
    context,
    plan: agenticPlanSchema.parse(row.plan),
    status: row.status,
    humanReviewStatus: row.human_review_status,
    model: row.model,
    promptVersion: row.prompt_version,
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAgentPlaybooks(
  identity: RequestIdentity,
  query: PlaybookListQuery
): Promise<AgentPlaybookRecord[]> {
  let request = getAgenticAdmin()
    .from("hdi_agent_playbooks")
    .select(
      "id,playbook_key,organization_id,version,name,description,goal_template,status,plan,activated_at,created_at,updated_at"
    )
    .eq("organization_id", identity.organizationId)
    .order("updated_at", { ascending: false })
    .limit(query.limit);
  if (query.status) request = request.eq("status", query.status);

  const { data, error } = await request;
  if (error) throw toStoreError(error.message);
  return (data || []).map(mapPlaybook);
}

export async function getAgentPlaybook(
  identity: RequestIdentity,
  playbookId: string
): Promise<AgentPlaybookRecord | null> {
  const { data, error } = await getAgenticAdmin()
    .from("hdi_agent_playbooks")
    .select(
      "id,playbook_key,organization_id,version,name,description,goal_template,status,plan,activated_at,created_at,updated_at"
    )
    .eq("organization_id", identity.organizationId)
    .eq("id", playbookId)
    .maybeSingle();
  if (error) throw toStoreError(error.message);
  return data ? mapPlaybook(data) : null;
}

export async function createAgentPlaybook(
  identity: RequestIdentity,
  input: CreatePlaybookInput
): Promise<AgentPlaybookRecord> {
  const id = await callAgentRpc("hdi_create_agent_playbook", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_playbook: {
      name: input.name,
      description: input.description,
      goal_template: input.goalTemplate,
      plan: input.plan,
    },
  });
  if (typeof id !== "string") {
    throw new AgenticStoreError("HDI playbook creation returned no id", 500);
  }
  const record = await getAgentPlaybook(identity, id);
  if (!record) throw new AgenticStoreError("HDI agent playbook not found", 404);
  return record;
}

export async function versionAgentPlaybook(
  identity: RequestIdentity,
  sourceId: string,
  changes: VersionPlaybookInput
): Promise<AgentPlaybookRecord> {
  const source = await getAgentPlaybook(identity, sourceId);
  if (!source) throw new AgenticStoreError("HDI agent playbook not found", 404);
  const merged = createPlaybookSchema.parse({
    name: changes.name ?? source.name,
    description: changes.description ?? source.description,
    goalTemplate: changes.goalTemplate ?? source.goalTemplate,
    plan: changes.plan ?? source.plan,
  });
  const id = await callAgentRpc("hdi_version_agent_playbook", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_source_id: sourceId,
    p_playbook: {
      name: merged.name,
      description: merged.description,
      goal_template: merged.goalTemplate,
      plan: merged.plan,
    },
  });
  if (typeof id !== "string") {
    throw new AgenticStoreError("HDI playbook versioning returned no id", 500);
  }
  const record = await getAgentPlaybook(identity, id);
  if (!record) throw new AgenticStoreError("HDI agent playbook not found", 404);
  return record;
}

export async function activateAgentPlaybook(
  identity: RequestIdentity,
  playbookId: string
): Promise<AgentPlaybookRecord> {
  await callAgentRpc("hdi_activate_agent_playbook", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_playbook_id: playbookId,
  });
  const record = await getAgentPlaybook(identity, playbookId);
  if (!record) throw new AgenticStoreError("HDI agent playbook not found", 404);
  return record;
}

export async function createAgentRun(
  identity: RequestIdentity,
  request: AgenticPlanRequest,
  planned: AgenticPlanRun
): Promise<string> {
  const id = await callAgentRpc("hdi_create_agent_run", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_run: {
      playbook_id: request.playbookId ?? "",
      goal: request.goal,
      context: request.context,
      plan: planned.plan,
      model: planned.model,
      model_response_id: planned.responseId,
      prompt_version: HDI_AGENT_PLANNER_PROMPT_VERSION,
      schema_version: HDI_AGENT_PLAN_SCHEMA_VERSION,
      processing_duration_ms: planned.durationMs,
    },
  });
  if (typeof id !== "string") {
    throw new AgenticStoreError("HDI agent run creation returned no id", 500);
  }
  return id;
}

export async function getAgentRun(
  identity: RequestIdentity,
  runId: string
): Promise<AgentRunRecord | null> {
  const { data, error } = await getAgenticAdmin()
    .from("hdi_agent_runs")
    .select(
      "id,organization_id,requested_by,playbook_id,goal,context,plan,status,human_review_status,model,prompt_version,schema_version,created_at,updated_at"
    )
    .eq("organization_id", identity.organizationId)
    .eq("id", runId)
    .maybeSingle();
  if (error) throw toStoreError(error.message);
  return data ? mapRun(data) : null;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asBoundedArray(value: unknown, limit: number): unknown[] {
  return Array.isArray(value) ? value.slice(0, limit) : [];
}

export function deriveAgentRunIndicators(value: unknown): {
  evidenceCount: number;
  safetyFlagCount: number;
} {
  const envelope = asObject(value);
  const synthesis = asObject(envelope.synthesis ?? envelope);
  const evidenceQuotes = new Set<string>();
  for (const agreement of asBoundedArray(synthesis.agreements, 24)) {
    for (const quote of asBoundedArray(asObject(agreement).evidenceQuotes, 12)) {
      if (typeof quote === "string" && quote.trim()) {
        evidenceQuotes.add(quote.trim());
      }
    }
  }

  const safetyFlags = new Set<string>();
  const collectSafetyFlags = (candidate: unknown): void => {
    for (const flag of asBoundedArray(asObject(candidate).safetyFlags, 12)) {
      if (typeof flag === "string" && flag.trim()) {
        safetyFlags.add(flag.trim());
      }
    }
  };
  collectSafetyFlags(synthesis);
  for (const report of asBoundedArray(envelope.specialistReports, 5)) {
    collectSafetyFlags(report);
  }
  return {
    evidenceCount: evidenceQuotes.size,
    safetyFlagCount: safetyFlags.size,
  };
}

export async function listAgentRuns(
  identity: RequestIdentity,
  query: AgentRunListQuery
): Promise<AgentRunListItem[]> {
  let request = getAgenticAdmin()
    .from("hdi_agent_runs")
    .select(
      "id,playbook_id,goal,plan,synthesis,status,human_review_status,model,created_at,updated_at"
    )
    .eq("organization_id", identity.organizationId)
    .order("created_at", { ascending: false })
    .limit(query.limit);
  if (query.status) request = request.eq("status", query.status);
  if (query.reviewStatus) {
    request = request.eq("human_review_status", query.reviewStatus);
  }

  const { data, error } = await request;
  if (error) throw toStoreError(error.message);
  const rows = (data || []) as unknown as RunListRow[];
  return rows.map((row) => {
    const plan = agenticPlanSchema.parse(row.plan);
    const indicators = deriveAgentRunIndicators(row.synthesis);
    return {
      id: row.id,
      playbookId: row.playbook_id,
      goal: row.goal,
      planTitle: plan.planTitle,
      intendedUse: plan.intendedUse,
      specialistCount: plan.recommendedSpecialists.length,
      evidenceCount: indicators.evidenceCount,
      safetyFlagCount: indicators.safetyFlagCount,
      status: row.status,
      humanReviewStatus: row.human_review_status,
      model: row.model,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function getAgentRunDetail(
  identity: RequestIdentity,
  runId: string
): Promise<AgentRunDetail | null> {
  const { data, error } = await getAgenticAdmin()
    .from("hdi_agent_runs")
    .select(
      "id,organization_id,requested_by,playbook_id,goal,context,plan,synthesis,status,human_review_status,human_review_note,reviewed_by,reviewed_at,model,model_response_id,prompt_version,schema_version,processing_duration_ms,created_at,updated_at"
    )
    .eq("organization_id", identity.organizationId)
    .eq("id", runId)
    .maybeSingle();
  if (error) throw toStoreError(error.message);
  if (!data) return null;
  const row = data as unknown as RunRow;
  return {
    ...mapRun(row),
    requestedBy: row.requested_by,
    synthesis: asObject(row.synthesis),
    modelResponseId: row.model_response_id ?? null,
    processingDurationMs: row.processing_duration_ms ?? null,
    humanReviewNote: row.human_review_note ?? null,
    reviewedBy: row.reviewed_by ?? null,
    reviewedAt: row.reviewed_at ?? null,
  };
}

function summaryCount(value: unknown): number {
  const count = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

export function mapAgentRunSummary(raw: unknown): AgentRunSummary {
  const value = asObject(raw);
  return {
    total: summaryCount(value.total),
    planned: summaryCount(value.planned),
    running: summaryCount(value.running),
    reviewReady: summaryCount(value.review_ready),
    failed: summaryCount(value.failed),
    pending: summaryCount(value.pending),
    approved: summaryCount(value.approved),
    needsRevision: summaryCount(value.needs_revision),
    rejected: summaryCount(value.rejected),
  };
}

export async function getAgentRunSummary(
  identity: RequestIdentity
): Promise<AgentRunSummary> {
  const raw = await callAgentRpc("hdi_agent_run_summary", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
  });
  return mapAgentRunSummary(raw);
}

export async function reviewAgentRun(
  identity: RequestIdentity,
  runId: string,
  review: {
    status: "approved" | "needs_revision" | "rejected";
    note?: string;
  }
): Promise<void> {
  const run = await getAgentRun(identity, runId);
  if (!run) throw new AgenticStoreError("HDI agent run not found", 404);
  if (run.status !== "review_ready" || run.humanReviewStatus !== "pending") {
    throw new AgenticStoreError("HDI agent run is not pending review", 409);
  }
  await callAgentRpc("hdi_review_agent_run", {
    p_organization_id: identity.organizationId,
    p_reviewer_id: identity.userId,
    p_run_id: runId,
    p_status: review.status,
    p_note: review.note ?? "",
  });
}

const prohibitedStoredKeys = new Set([
  "transcript",
  "rawTranscript",
  "sourceText",
  "recording",
  "video",
]);

export function assertMinimizedAgentResult(
  value: unknown
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Agent run synthesis must be an object");
  }
  const inspect = (candidate: unknown): void => {
    if (!candidate || typeof candidate !== "object") return;
    if (Array.isArray(candidate)) {
      for (const item of candidate) inspect(item);
      return;
    }
    for (const [key, nested] of Object.entries(candidate)) {
      if (prohibitedStoredKeys.has(key)) {
        throw new Error(`Agent run synthesis cannot persist ${key}`);
      }
      inspect(nested);
    }
  };
  inspect(value);
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > 100_000) {
    throw new Error("Agent run synthesis exceeds the minimized result limit");
  }
}

export async function completeAgentRun(
  identity: RequestIdentity,
  runId: string,
  synthesis: unknown,
  processingDurationMs: number
): Promise<void> {
  assertMinimizedAgentResult(synthesis);
  if (!Number.isInteger(processingDurationMs) || processingDurationMs < 0) {
    throw new Error("Agent run processing duration must be a positive integer");
  }
  await callAgentRpc("hdi_complete_agent_run", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_run_id: runId,
    p_synthesis: synthesis,
    p_processing_duration_ms: processingDurationMs,
  });
}

export async function startAgentRun(
  identity: RequestIdentity,
  runId: string
): Promise<void> {
  await callAgentRpc("hdi_start_agent_run", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_run_id: runId,
  });
}

export async function failAgentRun(
  identity: RequestIdentity,
  runId: string
): Promise<void> {
  await callAgentRpc("hdi_fail_agent_run", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_run_id: runId,
  });
}
