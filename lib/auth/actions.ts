"use server";

import { createClient } from "@/lib/supabase/server";
import { SignUpInput, SignInInput } from "@/lib/validations/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export async function signUp(data: SignUpInput) {
  const supabase = createClient();

  // Validate beta code if provided
  let betaTier: string | null = null;
  let betaCodeData: any = null;
  if (data.betaCode) {
    const { data: inviteCode, error: codeError } = await supabase
      .from("beta_invite_codes")
      .select("*")
      .eq("code", data.betaCode.toUpperCase())
      .single();

    if (codeError || !inviteCode) {
      return { error: "Invalid invite code" };
    }

    // Check if code is expired
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return { error: "This invite code has expired" };
    }

    // Check if code has reached max uses
    if (inviteCode.uses_count >= inviteCode.max_uses) {
      return { error: "This invite code has been fully redeemed" };
    }

    betaTier = inviteCode.beta_tier;
    betaCodeData = inviteCode;
  }

  // Create user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user" };
  }

  // Check if email confirmation is required
  if (authData.session === null) {
    return {
      success: true,
      requiresConfirmation: true,
      message: "Please check your email to confirm your account before signing in."
    };
  }

  let organizationId: string | null = null;

  // If beta code provided, find admin organization or use environment variable
  if (betaTier) {
    // Try to find admin organization by environment variable or by looking for first organization
    const adminOrgId = process.env.ADMIN_ORGANIZATION_ID;

    if (adminOrgId) {
      organizationId = adminOrgId;
    } else {
      // Fallback: find the first organization (assumes admin created first org)
      const { data: firstOrg } = await supabase
        .from("organizations")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (firstOrg) {
        organizationId = firstOrg.id;
      }
    }
  }

  // Create organization and profile
  if (betaTier) {
    // Beta tester: create profile linked to admin organization (or without org if none exists)
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        organization_id: organizationId, // Can be null if no org found
        beta_tester: true,
        beta_tier: betaTier,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return { error: "Failed to create profile" };
    }

    // Record beta code redemption
    if (betaCodeData) {
      await supabase.from("code_redemptions").insert({
        code_id: betaCodeData.id,
        user_id: authData.user.id,
      });

      // Increment uses count
      await supabase
        .from("beta_invite_codes")
        .update({ uses_count: betaCodeData.uses_count + 1 })
        .eq("id", betaCodeData.id);
    }
  } else if (data.organizationName) {
    // Regular user: create their own organization
    const orgSlug = `${slugify(data.organizationName)}-${Date.now()}`;

    const { data: orgId, error: orgError } = await supabase.rpc(
      "create_organization_and_profile",
      {
        user_id: authData.user.id,
        user_email: data.email,
        org_name: data.organizationName,
        org_slug: orgSlug,
      }
    );

    if (orgError) {
      console.error("Organization creation error:", orgError);
      return { error: "Failed to create organization" };
    }

    // Update the profile with full name
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: data.fullName })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }
  } else {
    return { error: "Organization name or beta code is required" };
  }

  return { success: true };
}

export async function signIn(data: SignInInput) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = createClient();
  const user = await getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", user.id)
    .single();

  // Also fetch admin status from user_profiles
  const { data: adminProfile, error: adminError } = await supabase
    .from("user_profiles")
    .select("is_super_admin, is_admin")
    .eq("id", user.id)
    .single();

  if (adminError) {
    console.error("[getUserProfile] Error fetching admin status:", adminError);
  }

  console.log("[getUserProfile] Admin profile data:", adminProfile);

  return {
    ...profile,
    is_super_admin: adminProfile?.is_super_admin || false,
    is_admin: adminProfile?.is_admin || false,
  };
}

export async function resetOnboarding() {
  const supabase = createClient();
  const user = await getUser();

  if (!user) return { error: "Not authenticated" };

  // Try to update database, but don't fail if columns don't exist yet
  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: false,
      onboarding_step: 0,
      onboarding_skipped: false,
    })
    .eq("id", user.id);

  // If database update fails, still return success
  // The localStorage clearing on client side will handle the reset
  if (error) {
    console.warn("Database onboarding reset failed (expected if columns don't exist yet):", error);
  }

  // Always return success so the client-side reset can work
  return { success: true };
}
