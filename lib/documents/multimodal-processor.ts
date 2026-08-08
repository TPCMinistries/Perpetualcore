/**
 * Multi-modal Document Processor
 * Handles images (OCR + AI), audio (transcription), video, and web clips
 */

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export type MediaType = "document" | "image" | "audio" | "video" | "web_clip";

export interface MediaMetadata {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  duration?: number;
  bitrate?: number;
  channels?: number;
  sampleRate?: number;
  codec?: string;
  frameRate?: number;
}

export interface ProcessingResult {
  success: boolean;
  mediaType: MediaType;
  transcription?: string;
  ocrText?: string;
  aiDescription?: string;
  thumbnailUrl?: string;
  duration?: number;
  metadata?: MediaMetadata;
  error?: string;
}

/**
 * Detect media type from file extension or MIME type
 */
export function detectMediaType(filename: string, mimeType?: string): MediaType {
  const ext = filename.split(".").pop()?.toLowerCase();

  // Image formats
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg"];
  if (imageExtensions.includes(ext || "") || mimeType?.startsWith("image/")) {
    return "image";
  }

  // Audio formats
  const audioExtensions = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"];
  if (audioExtensions.includes(ext || "") || mimeType?.startsWith("audio/")) {
    return "audio";
  }

  // Video formats
  const videoExtensions = ["mp4", "webm", "mov", "avi", "mkv", "m4v", "wmv"];
  if (videoExtensions.includes(ext || "") || mimeType?.startsWith("video/")) {
    return "video";
  }

  // Default to document
  return "document";
}

/**
 * Process an image with OCR and AI description
 */
export async function processImage(
  imageUrl: string,
  documentId: string
): Promise<ProcessingResult> {
  try {
    // Use OpenAI Vision to describe the image
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and provide: 1) A detailed description of what you see. 2) Any text visible in the image (OCR). 3) Key entities (people, places, objects). Format as JSON with keys: description, ocrText (array of text found), entities (array).",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = visionResponse.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from vision model");
    }

    const parsed = JSON.parse(content);

    // Update document in database
    const supabase = await createClient();
    await supabase
      .from("documents")
      .update({
        media_type: "image",
        ocr_text: Array.isArray(parsed.ocrText) ? parsed.ocrText.join("\n") : parsed.ocrText,
        ai_description: parsed.description,
        media_metadata: { entities: parsed.entities },
      })
      .eq("id", documentId);

    return {
      success: true,
      mediaType: "image",
      ocrText: Array.isArray(parsed.ocrText) ? parsed.ocrText.join("\n") : parsed.ocrText,
      aiDescription: parsed.description,
      metadata: { entities: parsed.entities } as any,
    };
  } catch (error: any) {
    console.error("Image processing error:", error);
    return {
      success: false,
      mediaType: "image",
      error: error.message,
    };
  }
}

/**
 * Process audio with Whisper transcription
 */
export async function processAudio(
  audioUrl: string,
  documentId: string
): Promise<ProcessingResult> {
  try {
    // Update status to processing
    const supabase = await createClient();
    await supabase
      .from("documents")
      .update({
        transcription_status: "processing",
      })
      .eq("id", documentId);

    // Fetch the audio file
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch audio file");
    }

    const audioBlob = await response.blob();

    // Create a File object for the API
    const audioFile = new File([audioBlob], "audio.mp3", {
      type: audioBlob.type || "audio/mpeg",
    });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
      response_format: "verbose_json",
    });

    // Calculate duration if available
    const duration = (transcription as any).duration || null;

    // Update document with transcription
    await supabase
      .from("documents")
      .update({
        media_type: "audio",
        transcription: transcription.text,
        transcription_status: "completed",
        duration_seconds: duration ? Math.round(duration) : null,
        content: transcription.text, // Also update content for search
      })
      .eq("id", documentId);

    return {
      success: true,
      mediaType: "audio",
      transcription: transcription.text,
      duration: duration ? Math.round(duration) : undefined,
    };
  } catch (error: any) {
    console.error("Audio processing error:", error);

    // Update status to failed
    const supabase = await createClient();
    await supabase
      .from("documents")
      .update({
        transcription_status: "failed",
      })
      .eq("id", documentId);

    return {
      success: false,
      mediaType: "audio",
      error: error.message,
    };
  }
}

/**
 * Process video (extract audio, transcribe, generate thumbnails)
 */
export async function processVideo(
  videoUrl: string,
  documentId: string
): Promise<ProcessingResult> {
  // Note: Full video processing would require a service like FFmpeg
  // For now, we'll attempt audio extraction and transcription

  try {
    const supabase = await createClient();
    await supabase
      .from("documents")
      .update({
        transcription_status: "processing",
        media_type: "video",
      })
      .eq("id", documentId);

    // Attempt to transcribe the video directly (Whisper can handle video files)
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch video file");
    }

    const videoBlob = await response.blob();
    const videoFile = new File([videoBlob], "video.mp4", {
      type: videoBlob.type || "video/mp4",
    });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: videoFile,
      model: "whisper-1",
      language: "en",
      response_format: "verbose_json",
    });

    const duration = (transcription as any).duration || null;

    await supabase
      .from("documents")
      .update({
        transcription: transcription.text,
        transcription_status: "completed",
        duration_seconds: duration ? Math.round(duration) : null,
        content: transcription.text,
      })
      .eq("id", documentId);

    return {
      success: true,
      mediaType: "video",
      transcription: transcription.text,
      duration: duration ? Math.round(duration) : undefined,
    };
  } catch (error: any) {
    console.error("Video processing error:", error);

    const supabase = await createClient();
    await supabase
      .from("documents")
      .update({
        transcription_status: "failed",
      })
      .eq("id", documentId);

    return {
      success: false,
      mediaType: "video",
      error: error.message,
    };
  }
}

/**
 * Process a web clip (extract content from URL)
 */
export async function processWebClip(
  sourceUrl: string,
  documentId: string,
  organizationId: string
): Promise<ProcessingResult> {
  try {
    const supabase = await createClient();

    // Create web clip record
    const { data: clip, error: insertError } = await supabase
      .from("web_clips")
      .insert({
        document_id: documentId,
        organization_id: organizationId,
        source_url: sourceUrl,
        extraction_status: "processing",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Fetch the URL
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "PerpetualCore/1.0 (+https://perpetualcore.com)",
      },
    });

    const finalUrl = response.url;
    const html = await response.text();

    // Parse the domain
    const url = new URL(finalUrl);
    const domain = url.hostname;

    // Extract metadata using regex (simple approach)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

    const pageTitle = titleMatch?.[1]?.trim() || "";
    const pageDescription = descMatch?.[1]?.trim() || "";
    const ogImage = ogImageMatch?.[1]?.trim() || "";

    // Extract text content (simple approach - strip HTML tags)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 50000);

    const wordCount = textContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Update web clip
    await supabase
      .from("web_clips")
      .update({
        final_url: finalUrl,
        domain,
        page_title: pageTitle,
        page_description: pageDescription,
        og_image: ogImage,
        full_text: textContent,
        word_count: wordCount,
        reading_time_minutes: readingTime,
        extraction_status: "completed",
      })
      .eq("id", clip.id);

    // Update document
    await supabase
      .from("documents")
      .update({
        media_type: "web_clip",
        title: pageTitle || sourceUrl,
        content: textContent,
        summary: pageDescription,
        thumbnail_url: ogImage,
        media_metadata: {
          sourceUrl,
          finalUrl,
          domain,
          wordCount,
          readingTime,
        },
      })
      .eq("id", documentId);

    return {
      success: true,
      mediaType: "web_clip",
      aiDescription: pageDescription,
      thumbnailUrl: ogImage,
      metadata: {
        sourceUrl,
        finalUrl,
        domain,
        wordCount,
        readingTime,
      } as any,
    };
  } catch (error: any) {
    console.error("Web clip processing error:", error);

    const supabase = await createClient();
    await supabase
      .from("web_clips")
      .update({
        extraction_status: "failed",
        extraction_error: error.message,
      })
      .eq("document_id", documentId);

    return {
      success: false,
      mediaType: "web_clip",
      error: error.message,
    };
  }
}

/**
 * Process any media type based on detection
 */
export async function processMedia(
  url: string,
  documentId: string,
  organizationId: string,
  filename: string,
  mimeType?: string
): Promise<ProcessingResult> {
  const mediaType = detectMediaType(filename, mimeType);

  switch (mediaType) {
    case "image":
      return processImage(url, documentId);
    case "audio":
      return processAudio(url, documentId);
    case "video":
      return processVideo(url, documentId);
    default:
      return {
        success: true,
        mediaType: "document",
      };
  }
}

/**
 * Get processing status for a document
 */
export async function getProcessingStatus(
  documentId: string
): Promise<{
  mediaType: MediaType;
  transcriptionStatus?: string;
  hasTranscription: boolean;
  hasOcr: boolean;
  hasAiDescription: boolean;
}> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("documents")
    .select("media_type, transcription_status, transcription, ocr_text, ai_description")
    .eq("id", documentId)
    .single();

  return {
    mediaType: data?.media_type || "document",
    transcriptionStatus: data?.transcription_status,
    hasTranscription: !!data?.transcription,
    hasOcr: !!data?.ocr_text,
    hasAiDescription: !!data?.ai_description,
  };
}
