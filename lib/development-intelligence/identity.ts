import { createClient } from "@/lib/supabase/server";
import type { RequestIdentity } from "./store";

export async function getDevelopmentIdentity(): Promise<RequestIdentity | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile?.organization_id ||
    (profile.role !== "owner" && profile.role !== "admin")
  ) {
    return null;
  }

  return {
    userId: user.id,
    organizationId: profile.organization_id,
    role: profile.role,
  };
}
