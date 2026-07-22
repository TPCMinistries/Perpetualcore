import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type { RequestIdentity } from "./store";
import type {
  CreateSubjectInput,
  LinkSubjectSessionInput,
  SubjectListQuery,
  UpdateCommitmentInput,
  UpdateSubjectInput,
  WithdrawLongitudinalConsentInput,
} from "./profile-schemas";

type ConsentStatus = "granted" | "withdrawn" | "expired" | "refused" | "none";

export interface DevelopmentSubjectSummary {
  id: string;
  displayLabel: string;
  subjectType: string;
  status: "active" | "archived";
  baselinePolicy: "self_longitudinal";
  consentStatus: ConsentStatus;
  sessionCount: number;
  observationCount: number;
  openCommitmentCount: number;
  lastObservedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DevelopmentSubjectDetail {
  subject: DevelopmentSubjectSummary;
  sessions: Array<{
    sessionId: string;
    analysisId: string | null;
    participantLabel: string;
    role: string | null;
    title: string;
    lens: string;
    occurredAt: string;
  }>;
  observations: Array<{
    id: string;
    metricKey: string;
    evidenceLevel: string;
    observedAt: string;
    analysisId: string;
  }>;
  commitments: Array<{
    id: string;
    statement: string;
    ownerLabel: string | null;
    dueDate: string | null;
    status: string;
    analysisId: string;
    updatedAt: string;
  }>;
}

export class ProfileOperationError extends Error {
  constructor(
    message: string,
    readonly status: 404 | 409 | 500
  ) {
    super(message);
    this.name = "ProfileOperationError";
  }
}

function getAdmin() {
  return createAdminClient();
}

function normalizeConsentStatus(eventType: string | undefined): ConsentStatus {
  if (eventType === "granted" || eventType === "verified") return "granted";
  if (eventType === "withdrawn") return "withdrawn";
  if (eventType === "expired") return "expired";
  if (eventType === "refused") return "refused";
  return "none";
}

function toOperationError(message: string): ProfileOperationError {
  const normalized = message.toLowerCase();
  if (normalized.includes("not found")) {
    return new ProfileOperationError(message, 404);
  }
  if (
    normalized.includes("consent") ||
    normalized.includes("already linked") ||
    normalized.includes("approved analysis") ||
    normalized.includes("duplicate key")
  ) {
    return new ProfileOperationError(message, 409);
  }
  return new ProfileOperationError(message, 500);
}

async function callProfileRpc(
  name:
    | "hdi_create_subject"
    | "hdi_update_subject"
    | "hdi_withdraw_longitudinal_consent"
    | "hdi_link_session_subject"
    | "hdi_update_commitment_status",
  args: Record<string, unknown>
): Promise<unknown> {
  // The migration is additive and database types are regenerated only after
  // production activation; keep this boundary locally typed without `any`.
  const { data, error } = await getAdmin().rpc(name as never, args as never);
  if (error) throw toOperationError(error.message);
  return data as unknown;
}

export async function listSubjects(
  identity: RequestIdentity,
  query: SubjectListQuery
): Promise<DevelopmentSubjectSummary[]> {
  const supabase = getAdmin();
  let subjectQuery = supabase
    .from("hdi_subjects")
    .select(
      "id,display_label,subject_type,status,baseline_policy,created_at,updated_at"
    )
    .eq("organization_id", identity.organizationId)
    .order("updated_at", { ascending: false })
    .limit(query.limit);

  if (query.status) subjectQuery = subjectQuery.eq("status", query.status);

  const { data: subjects, error } = await subjectQuery;
  if (error) throw new Error(error.message);
  if (!subjects?.length) return [];

  const subjectIds = subjects.map((subject) => subject.id);
  const [consentResult, sessionsResult, observationsResult, commitmentsResult] =
    await Promise.all([
      supabase
        .from("hdi_consent_events")
        .select("id,subject_id,event_type,occurred_at")
        .eq("organization_id", identity.organizationId)
        .eq("scope", "longitudinal_tracking")
        .in("subject_id", subjectIds)
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false }),
      supabase
        .from("hdi_session_subjects")
        .select("subject_id")
        .eq("organization_id", identity.organizationId)
        .in("subject_id", subjectIds),
      supabase
        .from("hdi_profile_observations")
        .select("subject_id,observed_at")
        .eq("organization_id", identity.organizationId)
        .in("subject_id", subjectIds)
        .order("observed_at", { ascending: false }),
      supabase
        .from("hdi_commitments")
        .select("subject_id,status")
        .eq("organization_id", identity.organizationId)
        .in("subject_id", subjectIds)
        .in("status", ["open", "unverified"]),
    ]);

  for (const result of [
    consentResult,
    sessionsResult,
    observationsResult,
    commitmentsResult,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  const latestConsent = new Map<string, string>();
  for (const row of consentResult.data || []) {
    if (row.subject_id && !latestConsent.has(row.subject_id)) {
      latestConsent.set(row.subject_id, row.event_type);
    }
  }

  const sessionCounts = new Map<string, number>();
  for (const row of sessionsResult.data || []) {
    sessionCounts.set(row.subject_id, (sessionCounts.get(row.subject_id) || 0) + 1);
  }

  const observationCounts = new Map<string, number>();
  const lastObservedAt = new Map<string, string>();
  for (const row of observationsResult.data || []) {
    observationCounts.set(
      row.subject_id,
      (observationCounts.get(row.subject_id) || 0) + 1
    );
    if (!lastObservedAt.has(row.subject_id)) {
      lastObservedAt.set(row.subject_id, row.observed_at);
    }
  }

  const commitmentCounts = new Map<string, number>();
  for (const row of commitmentsResult.data || []) {
    if (!row.subject_id) continue;
    commitmentCounts.set(
      row.subject_id,
      (commitmentCounts.get(row.subject_id) || 0) + 1
    );
  }

  return subjects.map((subject) => ({
    id: subject.id,
    displayLabel: subject.display_label,
    subjectType: subject.subject_type,
    status: subject.status as "active" | "archived",
    baselinePolicy: "self_longitudinal",
    consentStatus: normalizeConsentStatus(latestConsent.get(subject.id)),
    sessionCount: sessionCounts.get(subject.id) || 0,
    observationCount: observationCounts.get(subject.id) || 0,
    openCommitmentCount: commitmentCounts.get(subject.id) || 0,
    lastObservedAt: lastObservedAt.get(subject.id) || null,
    createdAt: subject.created_at,
    updatedAt: subject.updated_at,
  }));
}

async function getSubjectSummary(
  identity: RequestIdentity,
  subjectId: string
): Promise<DevelopmentSubjectSummary | null> {
  const supabase = getAdmin();
  const { data: subject, error } = await supabase
    .from("hdi_subjects")
    .select(
      "id,display_label,subject_type,status,baseline_policy,created_at,updated_at"
    )
    .eq("organization_id", identity.organizationId)
    .eq("id", subjectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!subject) return null;

  const [consentResult, sessionsResult, observationsResult, commitmentsResult] =
    await Promise.all([
      supabase
        .from("hdi_consent_events")
        .select("event_type")
        .eq("organization_id", identity.organizationId)
        .eq("subject_id", subjectId)
        .eq("scope", "longitudinal_tracking")
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("hdi_session_subjects")
        .select("session_id", { count: "exact", head: true })
        .eq("organization_id", identity.organizationId)
        .eq("subject_id", subjectId),
      supabase
        .from("hdi_profile_observations")
        .select("observed_at", { count: "exact" })
        .eq("organization_id", identity.organizationId)
        .eq("subject_id", subjectId)
        .order("observed_at", { ascending: false })
        .limit(1),
      supabase
        .from("hdi_commitments")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", identity.organizationId)
        .eq("subject_id", subjectId)
        .in("status", ["open", "unverified"]),
    ]);

  for (const result of [
    consentResult,
    sessionsResult,
    observationsResult,
    commitmentsResult,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    id: subject.id,
    displayLabel: subject.display_label,
    subjectType: subject.subject_type,
    status: subject.status as "active" | "archived",
    baselinePolicy: "self_longitudinal",
    consentStatus: normalizeConsentStatus(consentResult.data?.event_type),
    sessionCount: sessionsResult.count || 0,
    observationCount: observationsResult.count || 0,
    openCommitmentCount: commitmentsResult.count || 0,
    lastObservedAt: observationsResult.data?.[0]?.observed_at || null,
    createdAt: subject.created_at,
    updatedAt: subject.updated_at,
  };
}

export async function createSubject(
  identity: RequestIdentity,
  input: CreateSubjectInput
): Promise<DevelopmentSubjectSummary> {
  const subjectId = await callProfileRpc("hdi_create_subject", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_subject: {
      display_label: input.displayLabel,
      subject_type: input.subjectType,
      opaque_external_ref: input.opaqueExternalRef || `hdi_${randomUUID()}`,
      consent_confirmed: input.consentConfirmed,
      consent_basis: input.consentBasis,
    },
  });
  if (typeof subjectId !== "string") {
    throw new ProfileOperationError("HDI subject creation returned an invalid ID", 500);
  }
  const subject = await getSubjectSummary(identity, subjectId);
  if (!subject) throw new ProfileOperationError("HDI subject not found after creation", 500);
  return subject;
}

export async function getSubject(
  identity: RequestIdentity,
  subjectId: string
): Promise<DevelopmentSubjectDetail | null> {
  const subject = await getSubjectSummary(identity, subjectId);
  if (!subject) return null;
  const supabase = getAdmin();
  const [sessionsResult, observationsResult, commitmentsResult] = await Promise.all([
    supabase
      .from("hdi_session_subjects")
      .select(
        "session_id,participant_label,role,hdi_sessions!inner(title,lens,occurred_at)"
      )
      .eq("organization_id", identity.organizationId)
      .eq("subject_id", subjectId),
    supabase
      .from("hdi_profile_observations")
      .select("id,metric_key,evidence_level,observed_at,analysis_id")
      .eq("organization_id", identity.organizationId)
      .eq("subject_id", subjectId)
      .order("observed_at", { ascending: false })
      .limit(250),
    supabase
      .from("hdi_commitments")
      .select("id,statement,owner_label,due_date,status,analysis_id,updated_at")
      .eq("organization_id", identity.organizationId)
      .eq("subject_id", subjectId)
      .order("updated_at", { ascending: false })
      .limit(100),
  ]);

  for (const result of [sessionsResult, observationsResult, commitmentsResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const sessionIds = (sessionsResult.data || []).map((row) => row.session_id);
  const approvedAnalysisBySession = new Map<string, string>();
  if (sessionIds.length > 0) {
    const approvedAnalysesResult = await supabase
      .from("hdi_analyses")
      .select("id,session_id,created_at")
      .eq("organization_id", identity.organizationId)
      .eq("human_review_status", "approved")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: false });
    if (approvedAnalysesResult.error) {
      throw new Error(approvedAnalysesResult.error.message);
    }
    for (const analysis of approvedAnalysesResult.data || []) {
      if (!approvedAnalysisBySession.has(analysis.session_id)) {
        approvedAnalysisBySession.set(analysis.session_id, analysis.id);
      }
    }
  }

  return {
    subject,
    sessions: (sessionsResult.data || []).map((row) => {
      const session = row.hdi_sessions as unknown as {
        title: string;
        lens: string;
        occurred_at: string;
      };
      return {
        sessionId: row.session_id,
        analysisId: approvedAnalysisBySession.get(row.session_id) || null,
        participantLabel: row.participant_label,
        role: row.role,
        title: session.title,
        lens: session.lens,
        occurredAt: session.occurred_at,
      };
    }),
    observations: (observationsResult.data || []).map((row) => ({
      id: row.id,
      metricKey: row.metric_key,
      evidenceLevel: row.evidence_level,
      observedAt: row.observed_at,
      analysisId: row.analysis_id,
    })),
    commitments: (commitmentsResult.data || []).map((row) => ({
      id: row.id,
      statement: row.statement,
      ownerLabel: row.owner_label,
      dueDate: row.due_date,
      status: row.status,
      analysisId: row.analysis_id,
      updatedAt: row.updated_at,
    })),
  };
}

export async function updateSubject(
  identity: RequestIdentity,
  subjectId: string,
  input: UpdateSubjectInput
): Promise<DevelopmentSubjectSummary> {
  await callProfileRpc("hdi_update_subject", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_subject_id: subjectId,
    p_changes: {
      ...(input.displayLabel !== undefined
        ? { display_label: input.displayLabel }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });
  const subject = await getSubjectSummary(identity, subjectId);
  if (!subject) throw new ProfileOperationError("HDI subject not found", 404);
  return subject;
}

export async function withdrawLongitudinalConsent(
  identity: RequestIdentity,
  subjectId: string,
  input: WithdrawLongitudinalConsentInput
): Promise<void> {
  await callProfileRpc("hdi_withdraw_longitudinal_consent", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_subject_id: subjectId,
    p_reason: input.reason || "",
  });
}

export async function linkSubjectSession(
  identity: RequestIdentity,
  subjectId: string,
  input: LinkSubjectSessionInput
): Promise<{ linkedEvidenceCount: number; linkedCommitmentCount: number }> {
  const result = await callProfileRpc("hdi_link_session_subject", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_subject_id: subjectId,
    p_session_id: input.sessionId,
    p_participant_label: input.participantLabel,
    p_role: input.role || "",
  });
  if (!result || typeof result !== "object") {
    throw new ProfileOperationError("HDI session link returned an invalid result", 500);
  }
  const value = result as Record<string, unknown>;
  return {
    linkedEvidenceCount:
      typeof value.linked_evidence_count === "number"
        ? value.linked_evidence_count
        : 0,
    linkedCommitmentCount:
      typeof value.linked_commitment_count === "number"
        ? value.linked_commitment_count
        : 0,
  };
}

export async function updateCommitmentStatus(
  identity: RequestIdentity,
  commitmentId: string,
  input: UpdateCommitmentInput
): Promise<void> {
  await callProfileRpc("hdi_update_commitment_status", {
    p_organization_id: identity.organizationId,
    p_actor_id: identity.userId,
    p_commitment_id: commitmentId,
    p_status: input.status,
    p_note: input.note || "",
  });
}
