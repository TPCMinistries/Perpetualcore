import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { clipActionSchema } from "@/lib/press/schemas";
import { asClip, requireClip } from "@/lib/press/service";
import { requirePressUser } from "@/lib/press/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ clipId: string }> }) {
  try {
    const clip = await requireClip((await params).clipId);
    const input = clipActionSchema.parse(await request.json());
    if (clip.version !== input.version) {
      return NextResponse.json({ error: "Clip changed", currentVersion: clip.version }, { status: 409 });
    }
    const { user } = await requirePressUser();
    const updates: Record<string, unknown> = { version: input.version + 1, updated_at: new Date().toISOString() };
    if (input.action === "approve") {
      updates.status = "approved"; updates.rejection_reason = null;
      updates.reviewed_by = user.id; updates.reviewed_at = new Date().toISOString();
    } else if (input.action === "reject") {
      updates.status = "rejected"; updates.rejection_reason = input.rejectionReason;
      updates.reviewed_by = user.id; updates.reviewed_at = new Date().toISOString();
    } else {
      const start = input.startMs ?? clip.start_ms;
      const end = input.endMs ?? clip.end_ms;
      if (end <= start) return NextResponse.json({ error: "endMs must be after startMs" }, { status: 400 });
      if (input.startMs !== undefined) updates.start_ms = input.startMs;
      if (input.endMs !== undefined) updates.end_ms = input.endMs;
      if (input.title !== undefined) updates.title = input.title;
      if (input.hook !== undefined) updates.hook = input.hook;
      if (clip.status === "approved") {
        updates.status = "proposed";
        updates.reviewed_by = null;
        updates.reviewed_at = null;
        updates.rejection_reason = null;
      }
    }
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_clips").update(updates)
      .eq("id", clip.id).eq("organization_id", clip.organization_id).eq("version", input.version)
      .select("*").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Clip changed" }, { status: 409 });
    return NextResponse.json({ clip: asClip(data) });
  } catch (error) { return pressErrorResponse(error); }
}
