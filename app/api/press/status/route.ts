import { NextResponse } from "next/server";
import { requirePressUser } from "@/lib/press/auth";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export async function GET() {
  try {
    await requirePressUser();
    const configured = Boolean(process.env.PRESS_WORKER_SECRET);
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_worker_heartbeats")
      .select("last_seen_at")
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    const lastSeenAt = data?.last_seen_at ?? null;
    const workerOnline = configured && lastSeenAt !== null
      && Date.now() - new Date(lastSeenAt).getTime() <= ONLINE_WINDOW_MS;

    return NextResponse.json({
      ready: workerOnline,
      workerConfigured: configured,
      workerOnline,
      lastSeenAt,
      generationProviders: {
        internal: workerOnline,
        heygen: false,
        elevenlabs: false,
        chatterbox: false,
      },
      message: !configured
        ? "The Press media worker is not configured."
        : workerOnline
          ? "Press media processing is online."
          : "The Press media worker is offline. Uploads are paused to protect your source recording.",
    });
  } catch (error) {
    return pressErrorResponse(error);
  }
}
