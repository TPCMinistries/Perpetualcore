"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Plus, Trash2, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { TeamPermission, UserPermissionWithDetails } from "@/types/team";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
}

export default function PermissionsManager() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [permissions, setPermissions] = useState<TeamPermission[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberPermissions, setMemberPermissions] = useState<UserPermissionWithDetails[]>([]);
  const [rolePermissions, setRolePermissions] = useState<TeamPermission[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<string>("");
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [membersRes, permissionsRes] = await Promise.all([
        fetch("/api/team/members"),
        fetch("/api/team/permissions")
      ]);

      if (!membersRes.ok || !permissionsRes.ok) {
        throw new Error("Failed to load data");
      }

      const membersData = await membersRes.json();
      const permissionsData = await permissionsRes.json();

      setMembers(membersData.members || []);
      setPermissions(permissionsData.permissions || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load permissions data");
    } finally {
      setLoading(false);
    }
  }

  async function loadMemberPermissions(memberId: string) {
    try {
      const response = await fetch(`/api/team/members/${memberId}/permissions`);
      if (!response.ok) throw new Error("Failed to load member permissions");

      const data = await response.json();
      setRolePermissions(data.role_permissions || []);
      setMemberPermissions(data.user_permissions || []);
    } catch (error) {
      console.error("Error loading member permissions:", error);
      toast.error("Failed to load member permissions");
    }
  }

  async function handleGrantPermission() {
    if (!selectedMember || !selectedPermission) return;

    setGranting(true);
    try {
      const response = await fetch(`/api/team/members/${selectedMember.id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permission_id: selectedPermission,
          granted: true
        })
      });

      if (!response.ok) throw new Error("Failed to grant permission");

      toast.success("Permission granted successfully");
      setGrantDialogOpen(false);
      setSelectedPermission("");
      loadMemberPermissions(selectedMember.id);
    } catch (error) {
      console.error("Error granting permission:", error);
      toast.error("Failed to grant permission");
    } finally {
      setGranting(false);
    }
  }

  async function handleRevokePermission(permissionId: string, resourceId: string | null) {
    if (!selectedMember) return;

    try {
      const response = await fetch(`/api/team/members/${selectedMember.id}/permissions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permission_id: permissionId,
          resource_id: resourceId
        })
      });

      if (!response.ok) throw new Error("Failed to revoke permission");

      toast.success("Permission revoked successfully");
      loadMemberPermissions(selectedMember.id);
    } catch (error) {
      console.error("Error revoking permission:", error);
      toast.error("Failed to revoke permission");
    }
  }

  function openMemberDialog(member: Member) {
    setSelectedMember(member);
    setDialogOpen(true);
    loadMemberPermissions(member.id);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function groupPermissionsByResource(perms: TeamPermission[]) {
    return perms.reduce((acc: Record<string, TeamPermission[]>, perm) => {
      if (!acc[perm.resource_type]) {
        acc[perm.resource_type] = [];
      }
      acc[perm.resource_type].push(perm);
      return acc;
    }, {});
  }

  const groupedPermissions = groupPermissionsByResource(permissions);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Permissions Management</CardTitle>
          <CardDescription>
            Grant or revoke permissions for team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No team members</h3>
              <p className="text-sm text-muted-foreground">
                Invite team members to manage permissions
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => openMemberDialog(member)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                        {getInitials(member.full_name || member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.full_name || member.email}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Permissions Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Permissions for {selectedMember?.full_name || selectedMember?.email}
            </DialogTitle>
            <DialogDescription>
              Manage permissions and access controls
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Role-based Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Role Permissions ({selectedMember?.role})</h4>
                <Badge variant="outline">{rolePermissions.length} permissions</Badge>
              </div>
              <div className="space-y-2">
                {Object.entries(groupPermissionsByResource(rolePermissions)).map(([resource, perms]) => (
                  <div key={resource} className="border rounded-lg p-3">
                    <h5 className="text-sm font-medium mb-2 capitalize">
                      {resource.replace(/_/g, " ")}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((perm) => (
                        <Badge key={perm.id} variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          {perm.action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User-specific Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Custom Permissions</h4>
                <Button
                  size="sm"
                  onClick={() => setGrantDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Grant Permission
                </Button>
              </div>
              {memberPermissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom permissions granted
                </p>
              ) : (
                <div className="space-y-2">
                  {memberPermissions.map((perm) => (
                    <div key={perm.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={perm.granted ? "default" : "destructive"}>
                            {perm.granted ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                            {perm.permission.name}
                          </Badge>
                          {perm.expires_at && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Expires {new Date(perm.expires_at).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {perm.permission.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokePermission(perm.permission_id, perm.resource_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grant Permission Dialog */}
      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Permission</DialogTitle>
            <DialogDescription>
              Grant a custom permission to {selectedMember?.full_name || selectedMember?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Permission</Label>
              <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a permission" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground capitalize">
                        {resource.replace(/_/g, " ")}
                      </div>
                      {perms.map((perm) => (
                        <SelectItem key={perm.id} value={perm.id}>
                          {perm.name} - {perm.description}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantPermission} disabled={!selectedPermission || granting}>
              {granting ? "Granting..." : "Grant Permission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
