import crypto from "crypto";

const PLAUD_API_BASE =
  process.env.PLAUD_API_BASE_URL || "https://api.plaud.ai/v1";

export function verifyPlaudSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.PLAUD_WEBHOOK_SECRET;
  if (!secret) {
    console.error("PLAUD_WEBHOOK_SECRET not configured");
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function fetchPlaudTranscript(
  workflowId: string
): Promise<{ text: string; srt: string }> {
  const token = process.env.PLAUD_API_TOKEN;
  if (!token) throw new Error("PLAUD_API_TOKEN not configured");

  const [textRes, srtRes] = await Promise.all([
    fetch(`${PLAUD_API_BASE}/transcripts/${workflowId}?format=txt`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${PLAUD_API_BASE}/transcripts/${workflowId}?format=srt`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  if (!textRes.ok) {
    throw new Error(
      `Plaud transcript fetch failed: ${textRes.status} ${textRes.statusText}`
    );
  }
  if (!srtRes.ok) {
    throw new Error(
      `Plaud SRT fetch failed: ${srtRes.status} ${srtRes.statusText}`
    );
  }

  const text = await textRes.text();
  const srt = await srtRes.text();

  return { text, srt };
}

export async function fetchPlaudAudio(fileId: string): Promise<Buffer> {
  const token = process.env.PLAUD_API_TOKEN;
  if (!token) throw new Error("PLAUD_API_TOKEN not configured");

  const res = await fetch(`${PLAUD_API_BASE}/files/${fileId}/audio`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `Plaud audio fetch failed: ${res.status} ${res.statusText}`
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
