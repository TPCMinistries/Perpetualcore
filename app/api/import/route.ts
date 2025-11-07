import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  importFromJSON,
  importFromNotionZip,
  importFromEvernote,
} from "@/lib/import-export/import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST - Import user data from various formats
 */
export async function POST(req: NextRequest) {
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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const format = formData.get("format") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let result;

    switch (format) {
      case "json": {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        result = await importFromJSON(jsonData, user.id, profile.organization_id);
        break;
      }

      case "zip": {
        result = await importFromNotionZip(file, user.id, profile.organization_id);
        break;
      }

      case "evernote": {
        const text = await file.text();
        result = await importFromEvernote(text, user.id, profile.organization_id);
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid format. Supported: json, zip, evernote" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Import API error:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
}
