import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { requireRender } from "@/lib/press/service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ renderId: string }> }) {
  try {
    const render = await requireRender((await params).renderId);
    if (render.status !== "completed" || !render.output_bucket || !render.output_path) {
      return NextResponse.json({ error: "Render is not ready" }, { status: 409 });
    }
    const admin = createPressAdminClient();
    const expiresIn = 900;
    const { data, error } = await admin.storage.from(render.output_bucket)
      .createSignedUrl(render.output_path, expiresIn, { download: true });
    if (error || !data?.signedUrl) throw error ?? new Error("Unable to sign render download");
    return NextResponse.json({
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
  } catch (error) { return pressErrorResponse(error); }
}
