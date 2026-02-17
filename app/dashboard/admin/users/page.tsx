"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users as UsersIcon, Shield, Eye, User, Search, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  organization_id: string | null;
  mfa_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load users");
      }

      setUsers(data.users || []);
    } catch (err: any) {
      console.error("Error loading users:", err);
      setError(err.message);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    try {
      setUpdatingUserId(userId);

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, role: newRole })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user role");
      }

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast.success(`User role updated to ${newRole}`);
    } catch (err: any) {
      console.error("Error updating user role:", err);
      toast.error(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case "admin":
        return "destructive";
      case "member":
        return "default";
      case "viewer":
        return "secondary";
      default:
        return "outline";
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "member":
        return <User className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <button
              onClick={() => loadUsers()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage user roles and permissions
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UsersIcon className="h-4 w-4" />
          <span>{users.length} users</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Role Descriptions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-sm">Admin</p>
              <p className="text-xs text-muted-foreground">
                Full access to all features including user management and analytics
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Member</p>
              <p className="text-xs text-muted-foreground">
                Standard access to documents, chat, and collaboration features
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Viewer</p>
              <p className="text-xs text-muted-foreground">
                Read-only access to shared content
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Click a role to change it (admins cannot remove their own admin role)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">MFA</div>
              <div className="col-span-4">Joined</div>
            </div>
            {users
              .filter((u) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (
                  u.email.toLowerCase().includes(q) ||
                  (u.full_name?.toLowerCase().includes(q) ?? false)
                );
              })
              .map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-12 gap-4 text-sm py-3 border-b last:border-b-0 items-center"
              >
                <div className="col-span-4">
                  <div className="font-medium">{user.full_name || "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <div className="col-span-2">
                  <select
                    value={user.role || "member"}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    disabled={updatingUserId === user.id}
                    className="px-2 py-1 border border-input bg-background rounded-md text-sm disabled:opacity-50"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="col-span-2">
                  {user.mfa_enabled ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" /> Enabled
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400">
                      <XCircle className="h-3.5 w-3.5" /> Off
                    </span>
                  )}
                </div>
                <div className="col-span-4 text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
