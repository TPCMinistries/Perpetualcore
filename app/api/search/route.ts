import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { universalSearch } from "@/lib/search/universal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Universal search across all content
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Parse filters
    const typesParam = searchParams.get("types");
    const types = typesParam
      ? (typesParam.split(",") as Array<
          "conversation" | "document" | "task" | "calendar" | "email"
        >)
      : undefined;

    const authorsParam = searchParams.get("authors");
    const authors = authorsParam ? authorsParam.split(",") : undefined;

    const tagsParam = searchParams.get("tags");
    const tags = tagsParam ? tagsParam.split(",") : undefined;

    const categoriesParam = searchParams.get("categories");
    const categories = categoriesParam ? categoriesParam.split(",") : undefined;

    const filters = {
      types,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      authors,
      tags,
      categories,
      location: searchParams.get("location") || undefined,
      hasAttachments: searchParams.get("hasAttachments") === "true" ? true : undefined,
    };

    // Perform universal search
    const searchResults = await universalSearch(
      query,
      user.id,
      profile.organization_id,
      filters
    );

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
