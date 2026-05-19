import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Diagnostic endpoint that surfaces cookie names and auth state.
 * Leaks operational info; gated to non-production environments only.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    // Check what cookies we're receiving
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();

    // Try to create Supabase client and get user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    return Response.json({
      success: true,
      cookiesReceived: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      hasSupabaseCookie: allCookies.some(c => c.name.includes('supabase')),
      user: user ? {
        id: user.id,
        email: user.email,
      } : null,
      authError: authError?.message || null,
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
