// Client-side media prep for Press Stories uploads.
// Images: decode -> downscale to a max edge -> re-encode as JPEG (this also handles HEIC on
// Safari, which decodes HEIC natively via createImageBitmap/<img>).
// Videos: kept as the original file; we only extract a JPEG poster frame client-side.

export type ProcessedImage = { blob: Blob; width: number; height: number };
export type VideoPoster = { blob: Blob; width: number; height: number; durationMs: number };
export type VideoMeta = { width: number | null; height: number | null; durationMs: number | null };

function drawScaled(source: CanvasImageSource, sourceWidth: number, sourceHeight: number, maxEdge: number): { canvas: HTMLCanvasElement; width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.drawImage(source, 0, 0, width, height);
  return { canvas, width, height };
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image."))), "image/jpeg", quality);
  });
}

export async function downscaleImageToJpeg(file: File, maxEdge = 1600, quality = 0.85): Promise<ProcessedImage> {
  // Try the fast path first (also decodes HEIC on Safari).
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const { canvas, width, height } = drawScaled(bitmap, bitmap.width, bitmap.height, maxEdge);
      const blob = await canvasToJpeg(canvas, quality);
      return { blob, width, height };
    } finally {
      bitmap.close();
    }
  } catch {
    // Fall back to <img> decoding.
  }

  const url = URL.createObjectURL(file);
  try {
    const img = document.createElement("img");
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("couldn't read this image"));
      img.src = url;
    });
    const { canvas, width, height } = drawScaled(img, img.naturalWidth, img.naturalHeight, maxEdge);
    const blob = await canvasToJpeg(canvas, quality);
    return { blob, width, height };
  } catch {
    throw new Error("couldn't read this image");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadVideoElement(file: File): Promise<{ video: HTMLVideoElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    const timeout = setTimeout(() => reject(new Error("Timed out reading this video.")), 15000);
    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      resolve({ video, url });
    };
    video.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("couldn't read this video"));
    };
    video.src = url;
  });
}

export async function readVideoMeta(file: File): Promise<VideoMeta> {
  const { video, url } = await loadVideoElement(file);
  try {
    return {
      width: video.videoWidth || null,
      height: video.videoHeight || null,
      durationMs: Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : null,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function extractVideoPoster(file: File, maxEdge = 1280): Promise<VideoPoster> {
  const { video, url } = await loadVideoElement(file);
  try {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const seekTo = duration > 0 ? Math.min(1, duration * 0.1) : 0;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out extracting a poster frame.")), 15000);
      video.onseeked = () => {
        clearTimeout(timeout);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("couldn't read this video"));
      };
      video.currentTime = seekTo;
    });
    const { canvas, width, height } = drawScaled(video, video.videoWidth, video.videoHeight, maxEdge);
    const blob = await canvasToJpeg(canvas, 0.85);
    return { blob, width, height, durationMs: Math.round(duration * 1000) };
  } finally {
    URL.revokeObjectURL(url);
  }
}
