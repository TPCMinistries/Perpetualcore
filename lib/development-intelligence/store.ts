import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type {
  AnalysisRequest,
  DevelopmentAnalysisOutput,
} from "./schemas";
import type { AnalysisRun } from "./analyzer";
import { HDI_PROMPT_VERSION, HDI_SCHEMA_VERSION } from "./analyzer";
import { getRubric } from "./rubrics";

function getAdmin() {
  return createAdminClient();
}

export interface RequestIdentity {
  userId: string;
  organizationId: string;
  role: "owner" | "admin";
}

export interface DevelopmentAnalysisRecord {
  id: string;
  session_id: string;
  title: string;
  lens: string;
  summary: string;
  strengths: string[];
  growth_areas: string[];
  limitations: string[];
  safety_flags: string[];
  status: string;
  human_review_status: string;
  human_review_note: string | null;
  created_at: string;
  occurred_at: string;
  evidence_count?: number;
  commitment_count?: number;
}

export async function beginAnalysisSession(
  identity: RequestIdentity,
  request: AnalysisRequest
): Promise<string> {
  const hashSecret = process.env.HDI_SOURCE_HASH_SECRET;
  if (!hashSecret || hashSecret.length < 32) {
    throw new Error("HDI_SOURCE_HASH_SECRET must be configured with at least 32 characters");
  }
  const sourceHash = createHmac("sha256", hashSecret)
    .update(request.transcript)
    .digest("hex");
  const { data, error } = await getAdmin().rpc("hdi_begin_session", {
    p_organization_id: identity.organizationId,
    p_requested_by: identity.userId,
    p_session: {
      title: request.title,
      lens: request.lens,
      source_type: request.sourceType,
      source_hash: sourceHash,
      participant_labels: request.participantLabels,
      occurred_at: request.occurredAt || new Date().toISOString(),
    },
  });

  if (error || !data) {
    throw new Error(`Unable to establish HDI consent record: ${error?.message || "unknown error"}`);
  }
  return data as string;
}

export async function persistAnalysis(
  identity: RequestIdentity,
  sessionId: string,
  request: AnalysisRequest,
  run: AnalysisRun
): Promise<string> {
  const supabase = getAdmin();
  const rubric = getRubric(request.lens);

  const { data: analysisId, error } = await supabase.rpc(
    "hdi_persist_analysis",
    {
      p_organization_id: identity.organizationId,
      p_requested_by: identity.userId,
      p_session_id: sessionId,
      p_analysis: {
      rubric_key: rubric.key,
      rubric_version: rubric.version,
      model: run.model,
      model_response_id: run.responseId,
      prompt_version: HDI_PROMPT_VERSION,
      schema_version: HDI_SCHEMA_VERSION,
      summary: run.output.summary,
      strengths: run.output.strengths,
      growth_areas: run.output.growthAreas,
      limitations: run.output.limitations,
      safety_flags: run.output.safetyFlags,
      processing_duration_ms: run.durationMs,
      },
      p_observations: run.output.observations.map((observation) => ({
        criterion_key: observation.criterionKey,
        criterion_label: observation.criterionLabel,
        evidence_level: observation.evidenceLevel,
        observation: observation.observation,
        evidence_quote: observation.evidenceQuote,
        speaker_label: observation.speakerLabel,
        start_ms: observation.startMs,
        end_ms: observation.endMs,
        confidence: observation.confidence,
        developmental_action: observation.developmentalAction,
      })),
      p_commitments: run.output.commitments.map((commitment) => ({
        statement: commitment.statement,
        owner_label: commitment.ownerLabel,
        due_date: commitment.dueDate,
        evidence_quote: commitment.evidenceQuote,
      })),
    }
  );

  if (error || !analysisId) {
    throw new Error(`Unable to persist HDI analysis: ${error?.message || "unknown error"}`);
  }

  return analysisId as string;
}

export async function markAnalysisSessionFailed(
  identity: RequestIdentity,
  sessionId: string
): Promise<void> {
  const { error } = await getAdmin().rpc("hdi_fail_session", {
    p_organization_id: identity.organizationId,
    p_requested_by: identity.userId,
    p_session_id: sessionId,
  });
  if (error) console.error("Unable to mark HDI session failed:", error.message);
}

export async function listAnalyses(
  identity: RequestIdentity,
  options: { limit: number; lens?: string; reviewStatus?: string }
): Promise<DevelopmentAnalysisRecord[]> {
  const supabase = getAdmin();
  let query = supabase
    .from("hdi_analyses")
    .select(
      "id,session_id,summary,strengths,growth_areas,limitations,safety_flags,status,human_review_status,human_review_note,created_at,hdi_sessions!inner(title,lens,occurred_at)"
    )
    .eq("organization_id", identity.organizationId)
    .order("created_at", { ascending: false })
    .limit(options.limit);

  if (options.lens) query = query.eq("hdi_sessions.lens", options.lens);
  if (options.reviewStatus) {
    query = query.eq("human_review_status", options.reviewStatus);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((row) => {
    const session = row.hdi_sessions as unknown as {
      title: string;
      lens: string;
      occurred_at: string;
    };
    return {
      id: row.id as string,
      session_id: row.session_id as string,
      title: session.title,
      lens: session.lens,
      summary: row.summary as string,
      strengths: (row.strengths || []) as string[],
      growth_areas: (row.growth_areas || []) as string[],
      limitations: (row.limitations || []) as string[],
      safety_flags: (row.safety_flags || []) as string[],
      status: row.status as string,
      human_review_status: row.human_review_status as string,
      human_review_note: row.human_review_note as string | null,
      created_at: row.created_at as string,
      occurred_at: session.occurred_at,
    };
  });
}

export async function getAnalysis(
  identity: RequestIdentity,
  analysisId: string
): Promise<{
  analysis: DevelopmentAnalysisRecord;
  evidence: DevelopmentAnalysisOutput["observations"];
  commitments: DevelopmentAnalysisOutput["commitments"];
} | null> {
  const supabase = getAdmin();
  const { data: row, error } = await supabase
    .from("hdi_analyses")
    .select(
      "id,session_id,summary,strengths,growth_areas,limitations,safety_flags,status,human_review_status,human_review_note,created_at,hdi_sessions!inner(title,lens,occurred_at)"
    )
    .eq("organization_id", identity.organizationId)
    .eq("id", analysisId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  const [evidenceResult, commitmentResult] = await Promise.all([
    supabase
      .from("hdi_evidence")
      .select("*")
      .eq("organization_id", identity.organizationId)
      .eq("analysis_id", analysisId)
      .order("created_at", { ascending: true }),
    supabase
      .from("hdi_commitments")
      .select("*")
      .eq("organization_id", identity.organizationId)
      .eq("analysis_id", analysisId)
      .order("created_at", { ascending: true }),
  ]);

  if (evidenceResult.error) throw new Error(evidenceResult.error.message);
  if (commitmentResult.error) throw new Error(commitmentResult.error.message);

  const session = row.hdi_sessions as unknown as {
    title: string;
    lens: string;
    occurred_at: string;
  };

  return {
    analysis: {
      id: row.id as string,
      session_id: row.session_id as string,
      title: session.title,
      lens: session.lens,
      summary: row.summary as string,
      strengths: (row.strengths || []) as string[],
      growth_areas: (row.growth_areas || []) as string[],
      limitations: (row.limitations || []) as string[],
      safety_flags: (row.safety_flags || []) as string[],
      status: row.status as string,
      human_review_status: row.human_review_status as string,
      human_review_note: row.human_review_note as string | null,
      created_at: row.created_at as string,
      occurred_at: session.occurred_at,
    },
    evidence: (evidenceResult.data || []).map((item) => ({
      criterionKey: item.criterion_key as string,
      criterionLabel: item.criterion_label as string,
      evidenceLevel: item.evidence_level as "demonstrated" | "emerging" | "not_observed",
      observation: item.observation as string,
      evidenceQuote: item.evidence_quote as string,
      speakerLabel: item.speaker_label as string | null,
      startMs: item.start_ms as number | null,
      endMs: item.end_ms as number | null,
      confidence: Number(item.confidence),
      developmentalAction: item.developmental_action as string,
    })),
    commitments: (commitmentResult.data || []).map((item) => ({
      statement: item.statement as string,
      ownerLabel: item.owner_label as string | null,
      dueDate: item.due_date as string | null,
      evidenceQuote: item.evidence_quote as string,
    })),
  };
}

export async function reviewAnalysis(
  identity: RequestIdentity,
  analysisId: string,
  review: { status: "approved" | "needs_revision" | "rejected"; note?: string }
): Promise<void> {
  const supabase = getAdmin();
  const { error } = await supabase.rpc("hdi_review_analysis", {
    p_organization_id: identity.organizationId,
    p_reviewer_id: identity.userId,
    p_analysis_id: analysisId,
    p_status: review.status,
    p_note: review.note || "",
  });

  if (error) throw new Error(error.message);
}
