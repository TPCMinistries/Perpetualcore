import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

import {
  PRESS_EDITOR_ROLES,
  PressHttpError,
  canProvisionPressWorkspace,
  requireOrganizationAccess,
} from "@/lib/press/auth";

function membershipQuery(membership: { role: string; status: string | null } | null) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(async () => ({ data: membership })),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

function setNodeEnv(value: string | undefined) {
  Object.defineProperty(process.env, "NODE_ENV", {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

describe("Press organization authorization", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSelfServe = process.env.PRESS_SELF_SERVE_SIGNUP;
  const originalAllowedEmails = process.env.PRESS_BETA_ALLOWED_EMAILS;
  const originalAllowedDomains = process.env.PRESS_BETA_ALLOWED_DOMAINS;
  const originalOwnerEmails = process.env.HQ_OWNER_EMAILS;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "member@example.com" } },
    });
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
    process.env.PRESS_SELF_SERVE_SIGNUP = originalSelfServe;
    process.env.PRESS_BETA_ALLOWED_EMAILS = originalAllowedEmails;
    process.env.PRESS_BETA_ALLOWED_DOMAINS = originalAllowedDomains;
    process.env.HQ_OWNER_EMAILS = originalOwnerEmails;
  });

  it("allows viewers to read", async () => {
    mockSupabase.from.mockReturnValue(membershipQuery({ role: "viewer", status: "active" }));
    await expect(requireOrganizationAccess("org-1")).resolves.toMatchObject({ role: "viewer" });
  });

  it("denies viewers editing actions", async () => {
    mockSupabase.from.mockReturnValue(membershipQuery({ role: "viewer", status: "active" }));
    await expect(requireOrganizationAccess("org-1", PRESS_EDITOR_ROLES)).rejects.toMatchObject({
      status: 403,
    } satisfies Partial<PressHttpError>);
  });

  it("allows active members to edit", async () => {
    mockSupabase.from.mockReturnValue(membershipQuery({ role: "member", status: "active" }));
    await expect(requireOrganizationAccess("org-1", PRESS_EDITOR_ROLES)).resolves.toMatchObject({ role: "member" });
  });

  it("fails closed for unknown or inactive roles", async () => {
    mockSupabase.from.mockReturnValue(membershipQuery({ role: "lead", status: "active" }));
    await expect(requireOrganizationAccess("org-1")).rejects.toMatchObject({ status: 403 });

    mockSupabase.from.mockReturnValue(membershipQuery({ role: "owner", status: "inactive" }));
    await expect(requireOrganizationAccess("org-1")).rejects.toMatchObject({ status: 403 });
  });

  it("keeps production provisioning invite-only unless explicitly enabled", () => {
    setNodeEnv("production");
    delete process.env.PRESS_SELF_SERVE_SIGNUP;
    process.env.PRESS_BETA_ALLOWED_EMAILS = "invited@example.com";
    process.env.PRESS_BETA_ALLOWED_DOMAINS = "partner.org";

    expect(canProvisionPressWorkspace("unknown@example.com")).toBe(false);
    expect(canProvisionPressWorkspace("INVITED@example.com")).toBe(true);
    expect(canProvisionPressWorkspace("person@partner.org")).toBe(true);

    process.env.PRESS_SELF_SERVE_SIGNUP = "true";
    expect(canProvisionPressWorkspace("anyone@example.com")).toBe(true);
  });

  it("permits configured owners without opening access to every organization member", () => {
    setNodeEnv("production");
    delete process.env.PRESS_SELF_SERVE_SIGNUP;
    delete process.env.PRESS_BETA_ALLOWED_EMAILS;
    delete process.env.PRESS_BETA_ALLOWED_DOMAINS;
    process.env.HQ_OWNER_EMAILS = "owner@example.com";

    expect(canProvisionPressWorkspace("owner@example.com")).toBe(true);
    expect(canProvisionPressWorkspace("member@example.com")).toBe(false);
  });
});
