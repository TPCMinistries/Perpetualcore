import { redirect } from "next/navigation";
import { getUser, getUserProfile } from "@/lib/auth/actions";
import { createAdminClient } from "@/lib/supabase/server";
import { planIncludesOperate, getSubAccountUrl } from "@/lib/ghl/client";
import { OperateClient } from "./OperateClient";

export const metadata = {
  title: "Operate — Business OS | Perpetual Core",
  description:
    "Your full business operations suite — CRM, pipelines, funnels, automations, and more.",
};

async function getSubscriptionPlan(organizationId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", organizationId)
    .in("status", ["active", "trialing"])
    .single();

  return data?.plan || "free";
}

export default async function OperatePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile();
  if (!profile) redirect("/login");

  const plan = await getSubscriptionPlan(profile.organization_id);
  const hasAccess = planIncludesOperate(plan);

  // If provisioned, get the embed URL
  let embedUrl: string | null = null;
  if (hasAccess && profile.ghl_provisioned && profile.ghl_location_id) {
    embedUrl = getSubAccountUrl(profile.ghl_location_id);
  }

  return (
    <OperateClient
      hasAccess={hasAccess}
      isProvisioned={!!profile.ghl_provisioned}
      embedUrl={embedUrl}
      userId={user.id}
      currentPlan={plan}
    />
  );
}
