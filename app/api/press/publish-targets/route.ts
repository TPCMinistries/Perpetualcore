import { NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { requirePressUser } from "@/lib/press/auth";
import { asPublishTarget, getPublishCapabilities } from "@/lib/press/service";

export async function GET() {
  try {
    const { user, supabase } = await requirePressUser();
    const { data: memberships, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .or("status.is.null,status.eq.active");
    if (membershipError) throw membershipError;
    const roleByOrganization = new Map(
      (memberships ?? []).map((membership) => [membership.organization_id, membership.role]),
    );
    const organizationIds = [...roleByOrganization.keys()];
    if (organizationIds.length === 0) return NextResponse.json({ targets: [] });
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_publish_targets")
      .select("id, organization_id, provider, account_label, external_account_id, status, adapter_configured, non_secret_config, created_at, updated_at")
      .in("organization_id", organizationIds).eq("status", "active").order("provider");
    if (error) throw error;
    const targets = (data ?? []).map((value) => {
      const target = asPublishTarget(value);
      const capabilities = getPublishCapabilities(target);
      const canSchedule = ["owner", "admin"].includes(roleByOrganization.get(target.organization_id) ?? "");
      return {
        id: target.id,
        provider: target.provider,
        accountLabel: target.account_label,
        status: target.status,
        capabilities: { ...capabilities, scheduling: capabilities.scheduling && canSchedule },
      };
    });
    return NextResponse.json({ targets });
  } catch (error) { return pressErrorResponse(error); }
}
