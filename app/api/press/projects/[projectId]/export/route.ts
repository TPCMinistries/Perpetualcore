import { NextRequest, NextResponse } from "next/server";
import { PRESS_ADMIN_ROLES } from "@/lib/press/auth";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { requireProject } from "@/lib/press/service";

export const runtime = "nodejs";
export const maxDuration = 60;

function safeExportName(title: string): string {
  return title.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "press-recording";
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId, PRESS_ADMIN_ROLES);
    const admin = createPressAdminClient();
    const [assets, transcripts, clips, renders, generations, publications, analytics, jobs] = await Promise.all([
      admin.from("press_assets").select("id,kind,original_filename,mime_type,file_size,duration_seconds,status,created_at,updated_at")
        .eq("project_id", project.id).eq("organization_id", project.organization_id),
      admin.from("press_transcripts").select("id,asset_id,version,full_text,language,status,created_at,updated_at")
        .eq("project_id", project.id).eq("organization_id", project.organization_id).order("version"),
      admin.from("press_clips").select("id,generation_run_id,version,start_ms,end_ms,title,hook,summary,score,scores,status,rejection_reason,reviewed_at,created_at,updated_at")
        .eq("project_id", project.id).eq("organization_id", project.organization_id),
      admin.from("press_renders").select("id,clip_id,aspect_ratio,template,caption_style,status,settings,created_at,updated_at")
        .eq("project_id", project.id).eq("organization_id", project.organization_id),
      admin.from("press_generation_runs").select("id,recipe,provider,status,title,brief,config,output_count,error_message,created_at,updated_at")
        .eq("project_id", project.id).eq("organization_id", project.organization_id),
      admin.from("press_publications").select("id,clip_id,render_id,provider,mode,status,scheduled_for,external_url,created_at,updated_at")
        .eq("project_id", project.id).eq("organization_id", project.organization_id),
      admin.from("press_analytics_events").select("id,clip_id,provider,metric,value,observed_at,created_at")
        .eq("project_id", project.id).eq("organization_id", project.organization_id),
      admin.from("press_jobs").select("id,job_type,status,progress,attempts,max_attempts,created_at,updated_at")
        .eq("project_id", project.id).eq("organization_id", project.organization_id),
    ]);
    const results = [assets, transcripts, clips, renders, generations, publications, analytics, jobs];
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;

    const transcriptIds = (transcripts.data ?? []).map((transcript) => transcript.id);
    const segments = transcriptIds.length > 0
      ? await admin.from("press_transcript_segments")
          .select("id,transcript_id,position,start_ms,end_ms,speaker,text,confidence,created_at,updated_at")
          .in("transcript_id", transcriptIds).eq("organization_id", project.organization_id).order("position")
      : { data: [], error: null };
    if (segments.error) throw segments.error;

    const exportedAt = new Date().toISOString();
    const body = JSON.stringify({
      schema: "perpetual-core-press-export-v1",
      exportedAt,
      mediaIncluded: false,
      mediaNote: "Source and render files remain available through their secure download controls and are not embedded in this metadata export.",
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        platforms: project.platforms,
        rightsAttestedAt: project.rights_attested_at,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
      assets: assets.data ?? [],
      transcripts: transcripts.data ?? [],
      transcriptSegments: segments.data ?? [],
      clips: clips.data ?? [],
      renders: renders.data ?? [],
      generationRuns: generations.data ?? [],
      publications: publications.data ?? [],
      analyticsEvents: analytics.data ?? [],
      jobs: jobs.data ?? [],
    }, null, 2);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeExportName(project.title)}-press-export.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return pressErrorResponse(error);
  }
}
