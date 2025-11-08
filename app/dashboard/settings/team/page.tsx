"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  MoreVertical,
  Trash2,
  Crown,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "pending" | "suspended";
  joined_at: string;
  last_active: string;
  avatar?: string;
}

interface GuestUser {
  id: string;
  email: string;
  expires_at: string | null;
  invited_by: string;
  invited_at: string;
  permissions: {
    can_view_documents: boolean;
    can_download_documents: boolean;
    can_create_conversations: boolean;
    can_invite_others: boolean;
    can_use_ai: boolean;
  };
}

export default function TeamSettingsPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [guestInviteDialogOpen, setGuestInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteGuestDialogOpen, setDeleteGuestDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<GuestUser | null>(null);
  const [inviting, setInviting] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member",
  });

  const [guestForm, setGuestForm] = useState({
    email: "",
    expires_in_days: "30",
    permissions: {
      can_view_documents: true,
      can_download_documents: false,
      can_create_conversations: false,
      can_invite_others: false,
      can_use_ai: true,
    },
  });

  const [guests, setGuests] = useState<GuestUser[]>([
    {
      id: "g1",
      email: "external@partner.com",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invited_by: "John Doe",
      invited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      permissions: {
        can_view_documents: true,
        can_download_documents: false,
        can_create_conversations: false,
        can_invite_others: false,
        can_use_ai: true,
      },
    },
  ]);

  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "owner",
      status: "active",
      joined_at: "2024-01-01T00:00:00Z",
      last_active: "2024-01-15T14:30:00Z",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "admin",
      status: "active",
      joined_at: "2024-01-05T00:00:00Z",
      last_active: "2024-01-15T10:15:00Z",
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "member",
      status: "active",
      joined_at: "2024-01-10T00:00:00Z",
      last_active: "2024-01-14T16:45:00Z",
    },
    {
      id: "4",
      name: "Alice Williams",
      email: "alice@example.com",
      role: "member",
      status: "pending",
      joined_at: "2024-01-15T00:00:00Z",
      last_active: "2024-01-15T00:00:00Z",
    },
  ]);

  async function handleInvite() {
    if (!inviteForm.email) {
      toast.error("Please enter an email address");
      return;
    }

    setInviting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newMember: TeamMember = {
        id: String(members.length + 1),
        name: inviteForm.email.split("@")[0],
        email: inviteForm.email,
        role: inviteForm.role as any,
        status: "pending",
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      };

      setMembers([...members, newMember]);
      toast.success(`Invitation sent to ${inviteForm.email}`);
      setInviteDialogOpen(false);
      setInviteForm({ email: "", role: "member" });
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleUpdateRole(memberId: string, newRole: string) {
    try {
      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, role: newRole as any } : m
        )
      );
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error("Failed to update role");
    }
  }

  async function handleRemoveMember() {
    if (!selectedMember) return;

    try {
      setMembers(members.filter((m) => m.id !== selectedMember.id));
      toast.success(`${selectedMember.name} removed from team`);
      setDeleteDialogOpen(false);
      setSelectedMember(null);
    } catch (error) {
      toast.error("Failed to remove member");
    }
  }

  async function handleInviteGuest() {
    if (!guestForm.email) {
      toast.error("Please enter an email address");
      return;
    }

    setInviting(true);
    try {
      const expiresAt = guestForm.expires_in_days
        ? new Date(Date.now() + parseInt(guestForm.expires_in_days) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const newGuest: GuestUser = {
        id: `g${guests.length + 1}`,
        email: guestForm.email,
        expires_at: expiresAt,
        invited_by: "Current User",
        invited_at: new Date().toISOString(),
        permissions: guestForm.permissions,
      };

      setGuests([...guests, newGuest]);
      toast.success(`Guest invitation sent to ${guestForm.email}`);
      setGuestInviteDialogOpen(false);
      setGuestForm({
        email: "",
        expires_in_days: "30",
        permissions: {
          can_view_documents: true,
          can_download_documents: false,
          can_create_conversations: false,
          can_invite_others: false,
          can_use_ai: true,
        },
      });
    } catch (error) {
      toast.error("Failed to send guest invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveGuest() {
    if (!selectedGuest) return;

    try {
      setGuests(guests.filter((g) => g.id !== selectedGuest.id));
      toast.success(`Guest ${selectedGuest.email} removed`);
      setDeleteGuestDialogOpen(false);
      setSelectedGuest(null);
    } catch (error) {
      toast.error("Failed to remove guest");
    }
  }

  function getRoleBadge(role: string) {
    const variants = {
      owner: { icon: Crown, className: "bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-400" },
      admin: { icon: Shield, className: "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400" },
      member: { icon: Users, className: "bg-green-50 border-green-300 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400" },
      viewer: { icon: Activity, className: "bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-950/30 dark:border-gray-800 dark:text-gray-400" },
    };
    const config = variants[role as keyof typeof variants] || variants.member;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  }

  function getStatusBadge(status: string) {
    const variants = {
      active: { icon: CheckCircle2, className: "bg-green-50 border-green-300 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400" },
      pending: { icon: Clock, className: "bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-400" },
      suspended: { icon: XCircle, className: "bg-red-50 border-red-300 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400" },
    };
    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  const activeMembers = members.filter((m) => m.status === "active").length;
  const pendingInvites = members.filter((m) => m.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-950/20 dark:via-sky-950/20 dark:to-cyan-950/20 p-8 border border-blue-100 dark:border-blue-900/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-600 dark:to-cyan-700 flex items-center justify-center shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 via-sky-800 to-cyan-900 dark:from-blue-100 dark:via-sky-100 dark:to-cyan-100 bg-clip-text text-transparent">
                Team Settings
              </h1>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Manage team members and permissions
              </p>
            </div>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value) =>
                      setInviteForm({ ...inviteForm, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Admins can manage team members and settings
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={inviting}>
                  {inviting ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvites}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team members and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{member.name}</p>
                      {getRoleBadge(member.role)}
                      {getStatusBadge(member.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Last active{" "}
                        {formatDistanceToNow(new Date(member.last_active), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Role Selector */}
                  {member.role !== "owner" && (
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleUpdateRole(member.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Remove Button */}
                  {member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Understanding team member roles and their capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Owner</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Full access to all features, billing, and team management. Can delete the organization.
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Admin</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Can manage team members, create and edit resources, and configure settings.
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Member</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Can create and edit their own resources, collaborate with team members.
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold">Viewer</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Read-only access to resources. Cannot create or modify anything.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guest Users Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Guest Users</CardTitle>
              <CardDescription>
                Invite external collaborators with limited access and expiration
              </CardDescription>
            </div>
            <Dialog open={guestInviteDialogOpen} onOpenChange={setGuestInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Invite Guest
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Invite Guest User</DialogTitle>
                  <DialogDescription>
                    Send a time-limited invitation with custom permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="guest-email">Email Address</Label>
                    <Input
                      id="guest-email"
                      type="email"
                      placeholder="external@partner.com"
                      value={guestForm.email}
                      onChange={(e) =>
                        setGuestForm({ ...guestForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires">Access Duration</Label>
                    <Select
                      value={guestForm.expires_in_days}
                      onValueChange={(value) =>
                        setGuestForm({ ...guestForm, expires_in_days: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="">No expiration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="space-y-3 border rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="can_view"
                          checked={guestForm.permissions.can_view_documents}
                          onCheckedChange={(checked) =>
                            setGuestForm({
                              ...guestForm,
                              permissions: {
                                ...guestForm.permissions,
                                can_view_documents: checked === true,
                              },
                            })
                          }
                        />
                        <Label htmlFor="can_view" className="font-normal cursor-pointer">
                          Can view documents
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="can_download"
                          checked={guestForm.permissions.can_download_documents}
                          onCheckedChange={(checked) =>
                            setGuestForm({
                              ...guestForm,
                              permissions: {
                                ...guestForm.permissions,
                                can_download_documents: checked === true,
                              },
                            })
                          }
                        />
                        <Label htmlFor="can_download" className="font-normal cursor-pointer">
                          Can download documents
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="can_converse"
                          checked={guestForm.permissions.can_create_conversations}
                          onCheckedChange={(checked) =>
                            setGuestForm({
                              ...guestForm,
                              permissions: {
                                ...guestForm.permissions,
                                can_create_conversations: checked === true,
                              },
                            })
                          }
                        />
                        <Label htmlFor="can_converse" className="font-normal cursor-pointer">
                          Can create conversations
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="can_ai"
                          checked={guestForm.permissions.can_use_ai}
                          onCheckedChange={(checked) =>
                            setGuestForm({
                              ...guestForm,
                              permissions: {
                                ...guestForm.permissions,
                                can_use_ai: checked === true,
                              },
                            })
                          }
                        />
                        <Label htmlFor="can_ai" className="font-normal cursor-pointer">
                          Can use AI features
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setGuestInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteGuest} disabled={inviting}>
                    {inviting ? "Sending..." : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {guests.length > 0 ? (
            <div className="space-y-3">
              {guests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{guest.email}</p>
                      <Badge variant="outline" className="bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/30">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Guest
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Invited by {guest.invited_by}</span>
                      <span>•</span>
                      {guest.expires_at ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires {formatDistanceToNow(new Date(guest.expires_at), { addSuffix: true })}
                        </span>
                      ) : (
                        <span>No expiration</span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {guest.permissions.can_view_documents && (
                        <Badge variant="secondary" className="text-xs">View Docs</Badge>
                      )}
                      {guest.permissions.can_download_documents && (
                        <Badge variant="secondary" className="text-xs">Download</Badge>
                      )}
                      {guest.permissions.can_use_ai && (
                        <Badge variant="secondary" className="text-xs">AI</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedGuest(guest);
                      setDeleteGuestDialogOpen(true);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No guest users invited yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Member Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMember?.name} from the team?
              They will lose access to all resources and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMember(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Guest Dialog */}
      <AlertDialog open={deleteGuestDialogOpen} onOpenChange={setDeleteGuestDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Guest User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke access for {selectedGuest?.email}?
              They will immediately lose access to all resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedGuest(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveGuest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Guest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
