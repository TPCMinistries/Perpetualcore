import { describe, expect, it } from "vitest";
import {
  claimJobSchema,
  clipActionSchema,
  createProjectSchema,
  createAuthenticClipPackSchema,
  createRendersSchema,
  reportJobSchema,
  transcriptionResultSchema,
  updateTranscriptSchema,
  uploadIntentSchema,
} from "@/lib/press/schemas";

describe("Press request schemas", () => {
  it("requires an explicit rights attestation when a project is created", () => {
    expect(() => createProjectSchema.parse({ title: "Town hall" })).toThrow();
    expect(createProjectSchema.parse({ title: "Town hall", rightsAttested: true }))
      .toMatchObject({ title: "Town hall", rightsAttested: true, platforms: [] });
  });

  it("accepts supported media metadata and rejects oversized uploads", () => {
    expect(uploadIntentSchema.parse({
      fileName: "interview.mp4",
      mimeType: "video/mp4",
      fileSize: 1024,
    }).mimeType).toBe("video/mp4");

    expect(() => uploadIntentSchema.parse({
      fileName: "archive.mp4",
      mimeType: "video/mp4",
      fileSize: (2 * 1024 * 1024 * 1024) + 1,
    })).toThrow();
    expect(() => uploadIntentSchema.parse({
      fileName: "payload.html",
      mimeType: "text/html",
      fileSize: 1024,
    })).toThrow();
  });

  it("requires valid, ordered transcript segments", () => {
    const valid = {
      version: 2,
      fullText: "A useful moment.",
      segments: [{ startMs: 1000, endMs: 2500, text: "A useful moment." }],
    };
    expect(updateTranscriptSchema.parse(valid)).toEqual(valid);
    expect(() => updateTranscriptSchema.parse({
      ...valid,
      segments: [{ startMs: 2500, endMs: 1000, text: "Backwards" }],
    })).toThrow();
  });

  it("requires a reason when an operator rejects a clip", () => {
    expect(() => clipActionSchema.parse({ action: "reject", version: 1 })).toThrow();
    expect(clipActionSchema.parse({
      action: "reject",
      version: 1,
      rejectionReason: "Context is incomplete",
    }).action).toBe("reject");
  });

  it("limits one render request to the supported output formats", () => {
    expect(createRendersSchema.parse({
      formats: [{ aspectRatio: "9:16" }, { aspectRatio: "1:1" }, { aspectRatio: "16:9" }],
    }).formats).toHaveLength(3);
    expect(() => createRendersSchema.parse({ formats: [{ aspectRatio: "4:5" }] })).toThrow();
  });

  it("validates worker leases, failure reports, and transcription results", () => {
    expect(claimJobSchema.parse({ workerId: "press-worker-1" }).leaseSeconds).toBe(300);
    expect(() => reportJobSchema.parse({ workerId: "press-worker-1", status: "failed" })).toThrow();
    expect(reportJobSchema.parse({
      workerId: "press-worker-1",
      status: "failed",
      errorMessage: "FFmpeg exited with code 1",
    }).status).toBe("failed");
    expect(() => transcriptionResultSchema.parse({
      fullText: "Bad timing",
      segments: [{ startMs: 5, endMs: 5, text: "Bad timing" }],
    })).toThrow();
  });

  it("validates an intentional authentic clip pack brief", () => {
    const valid = createAuthenticClipPackSchema.parse({
      recipe: "authentic_clip_pack",
      title: "Operating system lessons",
      brief: "Prioritize practical examples.",
      clipCount: 5,
      targetMinSeconds: 30,
      targetMaxSeconds: 60,
      goals: ["teach", "demonstrate"],
      formats: ["9:16", "1:1"],
      captions: true,
      idempotencyKey: "clip-pack:12345678",
    });
    expect(valid.clipCount).toBe(5);
    expect(() => createAuthenticClipPackSchema.parse({
      ...valid,
      targetMinSeconds: 60,
      targetMaxSeconds: 30,
    })).toThrow();
    expect(() => createAuthenticClipPackSchema.parse({ ...valid, rawProviderId: "not-allowed" })).toThrow();
  });
});
