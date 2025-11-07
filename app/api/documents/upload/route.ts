import { createClient } from "@/lib/supabase/server";
import { processAndStoreDocument } from "@/lib/documents/processor";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// File size limits (in bytes)
const FREE_TIER_FILE_LIMIT = 10 * 1024 * 1024; // 10MB
const PAID_TIER_FILE_LIMIT = 50 * 1024 * 1024; // 50MB
const FREE_TIER_TOTAL_LIMIT = 100 * 1024 * 1024; // 100MB total

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
    const supabase = createClient();

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

    if (profileError || !profile || !profile.organization_id) {
      return new Response("Profile not found", { status: 400 });
    }

    // Get subscription plan
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("organization_id", profile.organization_id)
      .single();

    const plan = subscription?.plan || "free";

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

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

    // Check file size based on plan
    const fileLimit =
      plan === "free" ? FREE_TIER_FILE_LIMIT : PAID_TIER_FILE_LIMIT;
    if (file.size > fileLimit) {
      return new Response(
        `File too large. Maximum size for ${plan} plan: ${
          fileLimit / 1024 / 1024
        }MB`,
        { status: 400 }
      );
    }

    // For free tier, check total storage used
    if (plan === "free") {
      const { data: documents } = await supabase
        .from("documents")
        .select("file_size")
        .eq("organization_id", profile.organization_id);

      const totalStorage =
        documents?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;

      if (totalStorage + file.size > FREE_TIER_TOTAL_LIMIT) {
        return new Response(
          `Storage limit exceeded. Free tier allows 100MB total storage. Consider upgrading to Pro.`,
          { status: 400 }
        );
      }
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
        organization_id: profile.organization_id,
        user_id: user.id,
        title: file.name,
        content: "", // Will be filled during processing
        file_url: uploadData.path,
        file_type: file.type,
        file_size: file.size,
        status: "processing",
      })
      .select()
      .single();

    if (docError) {
      console.error("Document creation error:", docError);
      // Clean up uploaded file
      await supabase.storage.from("documents").remove([uniqueFilename]);
      return new Response("Failed to create document record", { status: 500 });
    }

    // Process document synchronously to ensure chunks are created
    try {
      await processAndStoreDocument(document.id);
      console.log(`✅ Document ${document.id} processed successfully`);
    } catch (processError) {
      console.error("Document processing error:", processError);
      // Document status will be set to "failed" by processAndStoreDocument
    }

    // Fetch updated document with final status
    const { data: updatedDoc } = await supabase
      .from("documents")
      .select("id, title, status, file_size, created_at")
      .eq("id", document.id)
      .single();

    return Response.json(updatedDoc || {
      id: document.id,
      title: document.title,
      status: "failed",
      file_size: document.file_size,
      created_at: document.created_at,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
