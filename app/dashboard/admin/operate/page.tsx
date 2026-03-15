"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Link2,
  Unlink,
  Loader2,
  ExternalLink,
  Plus,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface OperateUser {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string | null;
  ghl_location_id: string | null;
  ghl_provisioned: boolean;
  ghl_snapshot_applied: boolean;
  plan: string;
  operate_eligible: boolean;
}

export default function AdminOperatePage() {
  const [users, setUsers] = useState<OperateUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [linkLocationId, setLinkLocationId] = useState<Record<string, string>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/operate");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setUsers(data.users || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleProvision(userId: string, locationId?: string) {
    setActionLoading(userId);
    try {
      const body: Record<string, string> = { userId };
      if (locationId?.trim()) body.locationId = locationId.trim();

      const res = await fetch("/api/admin/operate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to provision");

      toast.success(
        locationId
          ? "GHL location linked successfully"
          : "GHL sub-account provisioned"
      );
      loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnlink(userId: string) {
    if (!confirm("Unlink this user's GHL location? This only removes the link — their GHL data remains intact.")) {
      return;
    }
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/operate", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, deleteFromGhl: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unlink");
      toast.success("GHL location unlinked");
      loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name?.toLowerCase().includes(q) ?? false) ||
      (u.ghl_location_id?.toLowerCase().includes(q) ?? false)
    );
  });

  const provisionedCount = users.filter((u) => u.ghl_provisioned).length;
  const eligibleCount = users.filter((u) => u.operate_eligible).length;
  const domain = "operate.perpetualcore.com";

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
              onClick={loadUsers}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OPERATE Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage GoHighLevel sub-accounts for users
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            {provisionedCount} provisioned
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-violet-500" />
            {eligibleCount} eligible
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-violet-600">
              {eligibleCount}
            </div>
            <p className="text-xs text-muted-foreground">
              OPERATE Eligible (Pro+)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {provisionedCount}
            </div>
            <p className="text-xs text-muted-foreground">GHL Provisioned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">
              {eligibleCount - provisionedCount}
            </div>
            <p className="text-xs text-muted-foreground">Eligible, Not Set Up</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or location ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users & GHL Status</CardTitle>
          <CardDescription>
            Link existing GHL locations or provision new sub-accounts for eligible
            users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
              <div className="col-span-3">User</div>
              <div className="col-span-1">Plan</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">GHL Location</div>
              <div className="col-span-3">Actions</div>
            </div>

            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-12 gap-4 text-sm py-3 border-b last:border-b-0 items-center"
              >
                {/* User */}
                <div className="col-span-3">
                  <div className="font-medium">
                    {user.full_name || "Unknown"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </div>

                {/* Plan */}
                <div className="col-span-1">
                  <Badge
                    variant={user.operate_eligible ? "default" : "secondary"}
                    className="text-xs capitalize"
                  >
                    {user.plan}
                  </Badge>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  {user.ghl_provisioned ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Provisioned
                    </span>
                  ) : user.operate_eligible ? (
                    <span className="flex items-center gap-1 text-amber-600 text-xs">
                      <XCircle className="h-3.5 w-3.5" />
                      Not set up
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Not eligible
                    </span>
                  )}
                </div>

                {/* GHL Location */}
                <div className="col-span-3">
                  {user.ghl_location_id ? (
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {user.ghl_location_id}
                      </code>
                      <a
                        href={`https://${domain}/location/${user.ghl_location_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <Input
                      placeholder="Paste location ID..."
                      className="h-7 text-xs"
                      value={linkLocationId[user.id] || ""}
                      onChange={(e) =>
                        setLinkLocationId((prev) => ({
                          ...prev,
                          [user.id]: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-3 flex items-center gap-2">
                  {user.ghl_provisioned ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={actionLoading === user.id}
                      onClick={() => handleUnlink(user.id)}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Unlink className="h-3 w-3 mr-1" />
                          Unlink
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      {linkLocationId[user.id]?.trim() ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={actionLoading === user.id}
                          onClick={() =>
                            handleProvision(user.id, linkLocationId[user.id])
                          }
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Link2 className="h-3 w-3 mr-1" />
                              Link
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={
                            actionLoading === user.id || !user.operate_eligible
                          }
                          onClick={() => handleProvision(user.id)}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Provision New
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provisioning Log */}
      <ProvisioningLog />
    </div>
  );
}

function ProvisioningLog() {
  const [logs, setLogs] = useState<
    {
      id: string;
      user_id: string;
      ghl_location_id: string;
      action: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/operate/logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (logs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Provisioning Audit Log</CardTitle>
        <CardDescription>Recent GHL provisioning events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs.slice(0, 20).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between text-xs py-2 border-b last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    log.action.includes("delete") || log.action.includes("unlink")
                      ? "destructive"
                      : "default"
                  }
                  className="text-[10px]"
                >
                  {log.action}
                </Badge>
                <code className="text-muted-foreground font-mono">
                  {log.ghl_location_id}
                </code>
              </div>
              <span className="text-muted-foreground">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
