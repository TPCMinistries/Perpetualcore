import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export const PRESS_READ_ROLES = ["owner", "admin", "member", "viewer"] as const;
export const PRESS_EDITOR_ROLES = ["owner", "admin", "member"] as const;
export const PRESS_ADMIN_ROLES = ["owner", "admin"] as const;
export type PressOrganizationRole = (typeof PRESS_READ_ROLES)[number];

export class PressHttpError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export async function requirePressUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new PressHttpError(401, "Unauthorized");
  if (!canProvisionPressWorkspace(user.email)) {
    throw new PressHttpError(403, "Press is currently invite-only. Ask the workspace owner to add your email.");
  }
  return { user, supabase };
}

function isPressOrganizationRole(role: unknown): role is PressOrganizationRole {
  return typeof role === "string" && (PRESS_READ_ROLES as readonly string[]).includes(role);
}

function configuredValues(name: string): Set<string> {
  return new Set(
    (process.env[name] ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function canProvisionPressWorkspace(email: string | null | undefined): boolean {
  if (process.env.NODE_ENV !== "production" || process.env.PRESS_SELF_SERVE_SIGNUP === "true") return true;
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return false;
  if (configuredValues("PRESS_BETA_ALLOWED_EMAILS").has(normalizedEmail)) return true;
  if (configuredValues("HQ_OWNER_EMAILS").has(normalizedEmail)) return true;
  const domain = normalizedEmail.split("@")[1];
  return Boolean(domain && configuredValues("PRESS_BETA_ALLOWED_DOMAINS").has(domain));
}

export async function requireOrganizationAccess(
  organizationId: string,
  allowedRoles: readonly PressOrganizationRole[] = PRESS_READ_ROLES,
) {
  const context = await requirePressUser();
  const { data: membership } = await context.supabase
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (membership && (membership.status === null || membership.status === "active")) {
    if (!isPressOrganizationRole(membership.role) || !allowedRoles.includes(membership.role)) {
      throw new PressHttpError(403, "Your organization role does not allow this Press action.");
    }
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
