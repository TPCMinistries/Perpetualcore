import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export class PressHttpError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export async function requirePressUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new PressHttpError(401, "Unauthorized");
  return { user, supabase };
}

export async function requireOrganizationAccess(organizationId: string) {
  const context = await requirePressUser();
  const { data: membership } = await context.supabase
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (membership && (membership.status === null || membership.status === "active")) {
    return { ...context, role: membership.role };
  }
  throw new PressHttpError(403, "No active organization membership. Complete organization setup first.");
}

export function requireWorkerAuthorization(header: string | null): void {
  const expected = process.env.PRESS_WORKER_SECRET;
  const supplied = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!expected || !supplied) throw new PressHttpError(401, "Unauthorized");
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new PressHttpError(401, "Unauthorized");
  }
}
