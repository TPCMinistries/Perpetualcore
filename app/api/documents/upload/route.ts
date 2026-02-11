import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { logActivity } from "@/lib/activity-logger";
import { PLAN_LIMITS, PlanType } from "@/lib/stripe/client";
import { enforceStorageLimit, enforceDocumentLimit } from "@/lib/billing/enforcement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes for upload + processing

// Per-file size limits (in bytes)
const FREE_TIER_FILE_LIMIT = 10 * 1024 * 1024; // 10MB per file
const PAID_TIER_FILE_LIMIT = 50 * 1024 * 1024; // 50MB per file

// Supported file types
const SUPPORTED_TYPES = [
  "application/pdf", // Now supported via Claude's native PDF understanding
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's profile and subscription
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response("Profile not found", { status: 400 });
    }

    // Allow personal uploads without organization
    // Use user_id as org_id if no org exists
    const organizationId = profile.organization_id || user.id;

    // Get subscription plan
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("organization_id", organizationId)
      .single();

    const plan = subscription?.plan || "free";

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const teamId = formData.get("team_id") as string | null;
    const projectId = formData.get("project_id") as string | null;

    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    // Validate file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return new Response(
        `Unsupported file type. Supported types: PDF, DOCX, TXT, MD, CSV.`,
        { status: 400 }
      );
    }

    // Check per-file size limit based on plan
    const fileLimit = plan === "free" ? FREE_TIER_FILE_LIMIT : PAID_TIER_FILE_LIMIT;
    if (file.size > fileLimit) {
      return Response.json(
        {
          error: `File too large. Maximum size for ${plan} plan: ${fileLimit / 1024 / 1024}MB`,
          code: "FILE_TOO_LARGE",
        },
        { status: 400 }
      );
    }

    // Check document count limit (free = 5, starter+ = unlimited)
    const docLimit = await enforceDocumentLimit(organizationId);
    if (!docLimit.allowed) {
      return Response.json(
        {
          error: docLimit.message,
          code: "DOCUMENT_LIMIT",
          current: docLimit.current,
          limit: docLimit.limit,
          plan: docLimit.plan,
        },
        { status: 403 }
      );
    }

    // Check total storage limit using plan-aware enforcement
    const storageLimit = await enforceStorageLimit(organizationId, file.size);
    if (!storageLimit.allowed) {
      return Response.json(
        {
          error: storageLimit.message,
          code: "STORAGE_LIMIT",
          current: storageLimit.current,
          limit: storageLimit.limit,
          plan: storageLimit.plan,
        },
        { status: 403 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const uniqueFilename = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(uniqueFilename, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response("Failed to upload file", { status: 500 });
    }

    // Create document record in database
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        title: file.name,
        content: "", // Will be filled during processing
        file_url: uploadData.path,
        file_type: file.type,
        file_size: file.size,
        status: "processing",
        team_id: teamId || null,
        project_id: projectId || null,
      })
      .select()
      .single();

    if (docError) {
      console.error("Document creation error:", docError);
      await supabase.storage.from("documents").remove([uniqueFilename]);
      return Response.json({
        error: "Failed to create document record",
        code: docError.code,
        message: docError.message,
        hint: docError.code === "42501" ? "RLS policy may be blocking INSERT" : docError.hint,
      }, { status: 500 });
    }

    // Process document synchronously for reliability
    try {
      const { processAndStoreDocument } = await import("@/lib/documents/processor");
      await processAndStoreDocument(document.id);
    } catch (processError: any) {
      console.error(`Document processing failed for ${document.id}:`, processError.message);
      // Don't fail the upload - document is saved, just not processed
    }

    // Fetch updated document status
    const { data: updatedDoc } = await supabase
      .from("documents")
      .select("status, metadata")
      .eq("id", document.id)
      .single();

    // Log activity for document upload
    await logActivity({
      supabase,
      userId: user.id,
      action: "uploaded",
      entityType: "document",
      entityId: document.id,
      entityName: document.title,
      metadata: {
        fileType: file.type,
        fileSize: file.size,
      },
    });

    return Response.json({
      id: document.id,
      title: document.title,
      status: updatedDoc?.status || "processing",
      file_size: document.file_size,
      created_at: document.created_at,
      metadata: updatedDoc?.metadata,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
