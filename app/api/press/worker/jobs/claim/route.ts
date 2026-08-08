import { NextRequest, NextResponse } from "next/server";
import { PressHttpError, requireWorkerAuthorization } from "@/lib/press/auth";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { claimJobSchema } from "@/lib/press/schemas";
import { asJob } from "@/lib/press/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    requireWorkerAuthorization(request.headers.get("authorization"));
    const input = claimJobSchema.parse(await request.json());
    const admin = createPressAdminClient();
    const heartbeatAt = new Date().toISOString();
    const { error: heartbeatError } = await admin.from("press_worker_heartbeats").upsert({
      worker_id: input.workerId,
      last_seen_at: heartbeatAt,
      current_job_id: null,
      metadata: { jobTypes: input.jobTypes ?? [] },
    }, { onConflict: "worker_id" });
    if (heartbeatError) throw heartbeatError;
    const { data: claimedRows, error: claimError } = await admin.rpc("press_claim_next_job", {
      p_worker_id: input.workerId,
      p_lease_seconds: input.leaseSeconds,
      ...(input.jobTypes ? { p_job_types: input.jobTypes } : {}),
    });
    if (claimError) throw claimError;
    const claimed = claimedRows?.[0];
    if (!claimed) return NextResponse.json({ job: null });
    const job = asJob(claimed);
    const { error: jobHeartbeatError } = await admin.from("press_worker_heartbeats").update({
      last_seen_at: heartbeatAt,
      current_job_id: job.id,
    }).eq("worker_id", input.workerId);
    if (jobHeartbeatError) throw jobHeartbeatError;
    let source: { bucket: string; path: string; signedUrl: string; expiresAt: string } | null = null;
    let outputUpload: { bucket: string; path: string; token: string; uploadUrl: string } | null = null;
    let sourceAssetId = job.asset_id;
    if (!sourceAssetId && job.job_type === "render_clip") {
      const { data: sourceAsset, error: sourceAssetError } = await admin.from("press_assets")
        .select("id").eq("project_id", job.project_id).eq("organization_id", job.organization_id)
        .in("kind", ["source", "source_audio", "source_video"]).order("created_at", { ascending: true })
        .limit(1).maybeSingle();
      if (sourceAssetError) throw sourceAssetError;
      sourceAssetId = sourceAsset?.id ? String(sourceAsset.id) : null;
    }
    if (sourceAssetId) {
      const { data: asset, error: assetError } = await admin.from("press_assets")
        .select("bucket, storage_path").eq("id", sourceAssetId).eq("organization_id", job.organization_id).maybeSingle();
      if (assetError) throw assetError;
      if (asset?.bucket && asset.storage_path) {
        const expiresIn = 900;
        const { data: signed, error: signError } = await admin.storage.from(String(asset.bucket))
          .createSignedUrl(String(asset.storage_path), expiresIn);
        if (signError) throw signError;
        if (signed?.signedUrl) {
          source = {
            bucket: String(asset.bucket), path: String(asset.storage_path), signedUrl: signed.signedUrl,
            expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
          };
        }
      }
    }
    if (job.render_id) {
      const { data: render, error: renderError } = await admin.from("press_renders")
        .select("output_bucket, output_path").eq("id", job.render_id)
        .eq("organization_id", job.organization_id).maybeSingle();
      if (renderError) throw renderError;
      if (render?.output_bucket && render.output_path) {
        await admin.from("press_renders").update({ status: "rendering", updated_at: new Date().toISOString() })
          .eq("id", job.render_id).eq("organization_id", job.organization_id);
        const { data: signedUpload, error: uploadError } = await admin.storage
          .from(String(render.output_bucket)).createSignedUploadUrl(String(render.output_path), { upsert: true });
        if (uploadError) throw uploadError;
        if (signedUpload) {
          outputUpload = {
            bucket: String(render.output_bucket), path: signedUpload.path, token: signedUpload.token,
            uploadUrl: signedUpload.signedUrl,
          };
        }
      }
    }
    const inputData: Record<string, unknown> = {
      sourceUrl: source?.signedUrl ?? null,
      sourceExpiresAt: source?.expiresAt ?? null,
      outputUpload,
    };
    if (job.job_type === "transcribe_media" && Array.isArray(job.payload.derivedAssets)) {
      const reservations = job.payload.derivedAssets
        .map((value) => value && typeof value === "object" ? value as Record<string, unknown> : {})
        .filter((value) => typeof value.assetId === "string" && typeof value.kind === "string");
      const artifactUploads = [];
      for (const reservation of reservations) {
        const { data: asset, error: assetError } = await admin.from("press_assets")
          .select("id, kind, bucket, storage_path, mime_type")
          .eq("id", String(reservation.assetId))
          .eq("project_id", job.project_id)
          .eq("organization_id", job.organization_id)
          .maybeSingle();
        if (assetError) throw assetError;
        if (!asset || asset.kind !== reservation.kind || asset.bucket !== "press-assets") {
          throw new PressHttpError(409, "Derived asset reservation is invalid");
        }
        const { data: signedUpload, error: uploadError } = await admin.storage
          .from("press-assets")
          .createSignedUploadUrl(String(asset.storage_path), { upsert: true });
        if (uploadError) throw uploadError;
        artifactUploads.push({
          assetId: String(asset.id),
          kind: String(asset.kind),
          bucket: "press-assets",
          path: signedUpload.path,
          uploadUrl: signedUpload.signedUrl,
          mimeType: String(asset.mime_type),
        });
      }
      inputData.artifactUploads = artifactUploads;
    }
    if (job.job_type === "score_clips") {
      const requestedTranscriptId = typeof job.payload.transcriptId === "string" ? job.payload.transcriptId : null;
      let transcriptQuery = admin.from("press_transcripts").select("id, full_text, language, version")
        .eq("project_id", job.project_id).eq("organization_id", job.organization_id)
        .order("version", { ascending: false }).limit(1);
      if (requestedTranscriptId) transcriptQuery = transcriptQuery.eq("id", requestedTranscriptId);
      const { data: transcriptRows, error: transcriptError } = await transcriptQuery;
      if (transcriptError) throw transcriptError;
      const transcript = transcriptRows?.[0];
      if (!transcript) throw new PressHttpError(409, "Score job has no transcript");
      const { data: segments, error: segmentError } = await admin.from("press_transcript_segments")
        .select("id, start_ms, end_ms, speaker, text, confidence")
        .eq("transcript_id", String(transcript.id)).order("position", { ascending: true });
      if (segmentError) throw segmentError;
      inputData.transcript = {
        id: transcript.id, fullText: transcript.full_text, language: transcript.language,
        version: transcript.version,
        segments: (segments ?? []).map((segment) => ({
          id: segment.id, startMs: segment.start_ms, endMs: segment.end_ms,
          speaker: segment.speaker, text: segment.text, confidence: segment.confidence,
        })),
      };
      if (job.generation_run_id) {
        const { data: generation, error: generationError } = await admin.from("press_generation_runs")
          .select("id, recipe, provider, title, brief, config")
          .eq("id", job.generation_run_id).eq("organization_id", job.organization_id).maybeSingle();
        if (generationError) throw generationError;
        if (!generation) throw new PressHttpError(409, "Generation run not found");
        inputData.generation = generation;
        const { error: generationUpdateError } = await admin.from("press_generation_runs").update({
          status: "processing", error_message: null, updated_at: new Date().toISOString(),
        }).eq("id", job.generation_run_id).eq("organization_id", job.organization_id);
        if (generationUpdateError) throw generationUpdateError;
      }
    }
    if (job.job_type === "render_clip" && job.render_id) {
      const { data: render, error: renderError } = await admin.from("press_renders")
        .select("clip_id, aspect_ratio, template, caption_style, settings")
        .eq("id", job.render_id).eq("organization_id", job.organization_id).maybeSingle();
      if (renderError) throw renderError;
      if (!render?.clip_id) throw new PressHttpError(409, "Render job has no render specification");
      const { data: clip, error: clipError } = await admin.from("press_clips")
        .select("id, start_ms, end_ms, title, hook, summary")
        .eq("id", String(render.clip_id)).eq("organization_id", job.organization_id).maybeSingle();
      if (clipError) throw clipError;
      if (!clip) throw new PressHttpError(409, "Render job has no clip");
      const { data: transcriptRows, error: transcriptError } = await admin.from("press_transcripts")
        .select("id").eq("project_id", job.project_id).eq("organization_id", job.organization_id)
        .order("version", { ascending: false }).limit(1);
      if (transcriptError) throw transcriptError;
      const transcriptId = transcriptRows?.[0]?.id;
      let segmentRows: Record<string, unknown>[] = [];
      if (transcriptId) {
        const segmentResult = await admin.from("press_transcript_segments")
          .select("id, start_ms, end_ms, speaker, text, confidence")
          .eq("transcript_id", String(transcriptId)).lt("start_ms", Number(clip.end_ms))
          .gt("end_ms", Number(clip.start_ms)).order("position", { ascending: true });
        if (segmentResult.error) throw segmentResult.error;
        segmentRows = segmentResult.data ?? [];
      }
      inputData.clip = {
        id: clip.id, startMs: clip.start_ms, endMs: clip.end_ms,
        title: clip.title, hook: clip.hook, summary: clip.summary,
      };
      inputData.transcriptSegments = segmentRows.map((segment) => ({
        id: segment.id, startMs: segment.start_ms, endMs: segment.end_ms,
        speaker: segment.speaker, text: segment.text, confidence: segment.confidence,
      }));
      const captionStyle = typeof render.caption_style === "string" ? render.caption_style : null;
      inputData.render = {
        id: job.render_id, aspectRatio: render.aspect_ratio, template: render.template,
        captionStyle, settings: render.settings,
      };
    }
    return NextResponse.json({
      job: {
        ...job,
        input: inputData,
      },
    });
  } catch (error) { return pressErrorResponse(error); }
}
