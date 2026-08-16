import { describe, expect, it } from "vitest";
import {
  PRESS_TUS_CHUNK_BYTES,
  PRESS_TUS_RETRY_DELAYS_MS,
  createPressResumableUpload,
  getPressTusEndpoint,
} from "@/lib/press/resumable-upload";

describe("Press resumable uploads", () => {
  it("uses the direct hosted Storage endpoint and preserves local endpoints", () => {
    expect(getPressTusEndpoint("https://project-ref.supabase.co"))
      .toBe("https://project-ref.storage.supabase.co/storage/v1/upload/resumable/sign");
    expect(getPressTusEndpoint("http://127.0.0.1:54321"))
      .toBe("http://127.0.0.1:54321/storage/v1/upload/resumable/sign");
  });

  it("creates a signed, non-upsert TUS upload with exact Supabase settings", async () => {
    const file = new File(["press"], "sample.mp4", { type: "video/mp4", lastModified: 1234 });
    const upload = createPressResumableUpload({
      assetId: "4e5ddd2c-78ab-4ab0-8744-eec9ced2d3f0",
      bucket: "press-assets",
      path: "org/project/asset/sample.mp4",
      token: "signed-token",
      file,
      onProgress: () => undefined,
      onSuccess: () => undefined,
      onError: () => undefined,
    });

    expect(upload.options.chunkSize).toBe(PRESS_TUS_CHUNK_BYTES);
    expect(upload.options.retryDelays).toEqual([...PRESS_TUS_RETRY_DELAYS_MS]);
    expect(upload.options.uploadDataDuringCreation).toBe(true);
    expect(upload.options.removeFingerprintOnSuccess).toBe(true);
    expect(upload.options.endpoint).toBe("https://test.storage.supabase.co/storage/v1/upload/resumable/sign");
    expect(upload.options.headers).toMatchObject({ apikey: "test-anon-key", "x-signature": "signed-token" });
    expect(upload.options.headers).not.toHaveProperty("authorization");
    expect(upload.options.headers).not.toHaveProperty("x-upsert");
    expect(upload.options.metadata).toEqual({
      bucketName: "press-assets",
      objectName: "org/project/asset/sample.mp4",
      contentType: "video/mp4",
      cacheControl: "3600",
    });
    await expect(upload.options.fingerprint?.(file, upload.options))
      .resolves.toContain("4e5ddd2c-78ab-4ab0-8744-eec9ced2d3f0");
  });

  it("scopes resumable fingerprints to the reserved asset", async () => {
    const file = new File(["press"], "same.mp4", { type: "video/mp4", lastModified: 1234 });
    const build = (assetId: string) => createPressResumableUpload({
      assetId,
      bucket: "press-assets",
      path: `org/project/${assetId}/same.mp4`,
      token: "signed-token",
      file,
      onProgress: () => undefined,
      onSuccess: () => undefined,
      onError: () => undefined,
    });
    const first = build("11111111-1111-4111-8111-111111111111");
    const second = build("22222222-2222-4222-8222-222222222222");
    await expect(first.options.fingerprint?.(file, first.options))
      .resolves.not.toBe(await second.options.fingerprint?.(file, second.options));
  });
});
