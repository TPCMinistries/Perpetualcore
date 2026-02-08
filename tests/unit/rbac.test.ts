import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { checkPermission, requirePermission, getUserPermissions } from "@/lib/auth/rbac";

describe("RBAC Permission System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chained mocks
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
  });

  describe("checkPermission", () => {
    it("returns not allowed when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await checkPermission("documents.create");
      expect(result.allowed).toBe(false);
      expect(result.user).toBeNull();
      expect(result.error).toBe("Not authenticated");
    });

    it("allows owner role for any permission", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1", email: "owner@test.com" } },
      });
      mockSupabase.single.mockResolvedValue({
        data: { role: "owner" },
      });

      const result = await checkPermission("anything.dangerous");
      expect(result.allowed).toBe(true);
      expect(result.role).toBe("owner");
    });

    it("allows admin role for any permission", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-2", email: "admin@test.com" } },
      });
      mockSupabase.single.mockResolvedValue({
        data: { role: "admin" },
      });

      const result = await checkPermission("users.manage_roles");
      expect(result.allowed).toBe(true);
      expect(result.role).toBe("admin");
    });

    it("checks database permission for non-admin roles", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-3", email: "member@test.com" } },
      });
      mockSupabase.single.mockResolvedValue({
        data: { role: "member" },
      });
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });

      const result = await checkPermission("documents.create");
      expect(result.allowed).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("user_has_permission", {
        p_user_id: "user-3",
        p_permission_name: "documents.create",
        p_resource_id: null,
      });
    });

    it("denies when database returns false", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-4", email: "viewer@test.com" } },
      });
      mockSupabase.single.mockResolvedValue({
        data: { role: "viewer" },
      });
      mockSupabase.rpc.mockResolvedValue({ data: false, error: null });

      const result = await checkPermission("documents.delete");
      expect(result.allowed).toBe(false);
    });

    it("falls back to allow read when RPC errors", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-5" } },
      });
      mockSupabase.single.mockResolvedValue({
        data: { role: "member" },
      });
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Function not found" },
      });

      const result = await checkPermission("documents.read");
      expect(result.allowed).toBe(true);
    });

    it("falls back to deny write when RPC errors", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-6" } },
      });
      mockSupabase.single.mockResolvedValue({
        data: { role: "member" },
      });
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Function not found" },
      });

      const result = await checkPermission("documents.delete");
      expect(result.allowed).toBe(false);
    });
  });

  describe("requirePermission", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await requirePermission("documents.read");
      expect(result.response).toBeDefined();
      expect(result.response!.status).toBe(401);
      expect(result.user).toBeNull();
    });

    it("returns 403 when permission is denied", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-7", email: "viewer@test.com" } },
      });
      mockSupabase.single.mockResolvedValue({
        data: { role: "viewer" },
      });
      mockSupabase.rpc.mockResolvedValue({ data: false, error: null });

      const result = await requirePermission("users.manage_roles");
      expect(result.response).toBeDefined();
      expect(result.response!.status).toBe(403);
    });

    it("returns user when permission is granted", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-8", email: "admin@test.com" } },
      });
      mockSupabase.single.mockResolvedValue({
        data: { role: "admin" },
      });

      const result = await requirePermission("users.read");
      expect(result.response).toBeUndefined();
      expect(result.user).toEqual({ id: "user-8", email: "admin@test.com" });
      expect(result.role).toBe("admin");
    });
  });

  describe("getUserPermissions", () => {
    it("returns empty permissions when not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await getUserPermissions();
      expect(result.permissions).toEqual([]);
      expect(result.user).toBeNull();
    });

    it("returns permissions from database", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-9" } },
      });
      mockSupabase.single.mockResolvedValue({
        data: { role: "member" },
      });
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { permission_name: "documents.read" },
          { permission_name: "documents.create" },
        ],
        error: null,
      });

      const result = await getUserPermissions();
      expect(result.permissions).toEqual(["documents.read", "documents.create"]);
      expect(result.role).toBe("member");
    });
  });
});
