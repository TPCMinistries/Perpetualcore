import { createClient } from "@/lib/supabase/server";
import { searchDocuments, shouldUseRAG } from "@/lib/documents/rag";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint to test RAG functionality
 * Visit /api/test-rag to see if RAG is working
 *
 * DEVELOPMENT ONLY - Returns 404 in production
 */
export async function GET(req: NextRequest) {
  // Block access in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
    errors: [],
  };

  try {
    const supabase = await createClient();

    // Test 1: Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      results.tests.authentication = {
        status: "FAILED",
        error: "Not authenticated. Please log in first.",
      };
      return Response.json(results, { status: 401 });
    }

    results.tests.authentication = {
      status: "PASSED",
      userId: user.id,
    };

    // Test 2: Check profile and organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      results.tests.profile = {
        status: "FAILED",
        error: profileError.message,
      };
    } else {
      const organizationId = profile?.organization_id || user.id;
      results.tests.profile = {
        status: "PASSED",
        organizationId,
      };
    }

    // Test 3: Check for documents
    const organizationId = profile?.organization_id || user.id;
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("id, title, status, file_type")
      .eq("organization_id", organizationId)
      .limit(10);

    if (docsError) {
      results.tests.documents = {
        status: "FAILED",
        error: docsError.message,
      };
    } else {
      results.tests.documents = {
        status: documents && documents.length > 0 ? "PASSED" : "WARNING",
        count: documents?.length || 0,
        documents: documents?.map((d) => ({
          id: d.id,
          title: d.title,
          status: d.status,
          type: d.file_type,
        })),
        message:
          documents && documents.length === 0
            ? "No documents uploaded. Upload documents in Knowledge → Documents"
            : undefined,
      };
    }

    // Test 4: Check for document chunks with embeddings
    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("document_id, chunk_index, embedding")
      .not("embedding", "is", null)
      .limit(5);

    if (chunksError) {
      results.tests.embeddings = {
        status: "FAILED",
        error: chunksError.message,
      };
    } else {
      results.tests.embeddings = {
        status: chunks && chunks.length > 0 ? "PASSED" : "WARNING",
        count: chunks?.length || 0,
        message:
          chunks && chunks.length === 0
            ? "No embeddings found. Documents may still be processing or embedding generation failed."
            : `Found ${chunks?.length} chunks with embeddings`,
      };
    }

    // Test 5: Check if search function exists
    const { data: functionExists, error: functionError } = await supabase.rpc(
      "search_document_chunks",
      {
        query_embedding: new Array(1536).fill(0), // Dummy embedding
        org_id: organizationId,
        requesting_user_id: user.id,
        match_threshold: 0.9,
        match_count: 1,
        search_scope: "all",
        conversation_id: null,
        space_id: null,
      }
    );

    if (functionError) {
      results.tests.search_function = {
        status: "FAILED",
        error: functionError.message,
        hint: functionError.message.includes("function")
          ? "Database function 'search_document_chunks' does not exist. Run migrations."
          : "Unknown error calling search function",
      };
    } else {
      results.tests.search_function = {
        status: "PASSED",
        message: "Search function exists and is callable",
      };
    }

    // Test 6: Check OpenAI API key
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    results.tests.openai_key = {
      status: hasOpenAIKey ? "PASSED" : "FAILED",
      message: hasOpenAIKey
        ? "OPENAI_API_KEY environment variable is set"
        : "OPENAI_API_KEY environment variable is missing. Add it to Vercel environment variables.",
    };

    // Test 7: Test shouldUseRAG function
    const testQueries = [
      "hi",
      "What is the GDI?",
      "can you read my documents about the GDI",
    ];
    results.tests.should_use_rag = {
      status: "INFO",
      results: testQueries.map((q) => ({
        query: q,
        shouldUseRAG: shouldUseRAG(q),
      })),
    };

    // Test 8: Try actual RAG search if possible
    if (hasOpenAIKey && chunks && chunks.length > 0) {
      try {
        const searchResults = await searchDocuments(
          "test query about documents",
          organizationId,
          user.id,
          5,
          0.3,
          { scope: "all" }
        );

        results.tests.rag_search = {
          status: "PASSED",
          message: `RAG search executed successfully. Found ${searchResults.length} results.`,
          resultsCount: searchResults.length,
        };
      } catch (error: any) {
        results.tests.rag_search = {
          status: "FAILED",
          error: error.message,
        };
      }
    } else {
      results.tests.rag_search = {
        status: "SKIPPED",
        reason: !hasOpenAIKey
          ? "OpenAI API key missing"
          : "No embeddings available",
      };
    }

    // Summary
    const allTests = Object.values(results.tests);
    const passed = allTests.filter((t: any) => t.status === "PASSED").length;
    const failed = allTests.filter((t: any) => t.status === "FAILED").length;
    const warnings = allTests.filter((t: any) => t.status === "WARNING").length;

    results.summary = {
      total: allTests.length,
      passed,
      failed,
      warnings,
      status: failed > 0 ? "ISSUES_FOUND" : warnings > 0 ? "WARNINGS" : "ALL_PASSED",
    };

    return Response.json(results, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    results.errors.push(error.message);
    results.tests.global_error = {
      status: "FAILED",
      error: error.message,
      stack: error.stack,
    };
    return Response.json(results, { status: 500 });
  }
}
