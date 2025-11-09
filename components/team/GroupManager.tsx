"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Users,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  X,
  Crown
} from "lucide-react";
import { toast } from "sonner";
import { TeamGroupWithMembers } from "@/types/team";

interface Member {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"
];

const ICONS = ["Users", "Briefcase", "Code", "Palette", "Rocket", "Shield", "Zap"];

export default function GroupManager() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<TeamGroupWithMembers[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TeamGroupWithMembers | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: COLORS[0],
    icon: ICONS[0]
  });
  const [selectedMember, setSelectedMember] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [groupsRes, membersRes] = await Promise.all([
        fetch("/api/team/groups"),
        fetch("/api/team/members")
      ]);

      if (!groupsRes.ok || !membersRes.ok) {
        throw new Error("Failed to load data");
      }

      const groupsData = await groupsRes.json();
      const membersData = await membersRes.json();

      setGroups(groupsData.groups || []);
      setMembers(membersData.members || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup() {
    if (!formData.name) {
      toast.error("Group name is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/team/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to create group");

      toast.success("Group created successfully");
      setCreateDialogOpen(false);
      setFormData({ name: "", description: "", color: COLORS[0], icon: ICONS[0] });
      loadData();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateGroup() {
    if (!selectedGroup || !formData.name) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/team/groups/${selectedGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to update group");

      toast.success("Group updated successfully");
      setEditDialogOpen(false);
      setSelectedGroup(null);
      loadData();
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update group");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm("Are you sure you want to delete this group?")) return;

    try {
      const response = await fetch(`/api/team/groups/${groupId}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete group");

      toast.success("Group deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
    }
  }

  async function handleAddMember() {
    if (!selectedGroup || !selectedMember) return;

    try {
      const response = await fetch(`/api/team/groups/${selectedGroup.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedMember, role: "member" })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add member");
      }

      toast.success("Member added successfully");
      setSelectedMember("");
      loadData();
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || "Failed to add member");
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!selectedGroup) return;

    try {
      const response = await fetch(`/api/team/groups/${selectedGroup.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) throw new Error("Failed to remove member");

      toast.success("Member removed successfully");
      loadData();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  }

  function openEditDialog(group: TeamGroupWithMembers) {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      color: group.color || COLORS[0],
      icon: group.icon || ICONS[0]
    });
    setEditDialogOpen(true);
  }

  function openMembersDialog(group: TeamGroupWithMembers) {
    setSelectedGroup(group);
    setMembersDialogOpen(true);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Groups</CardTitle>
              <CardDescription>
                Organize your team into groups and departments
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No groups yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create groups to organize your team members
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Group
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  style={{ borderLeftColor: group.color || "#3b82f6", borderLeftWidth: "4px" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(group)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {group.members?.slice(0, 3).map((member) => (
                        <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={member.profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs">
                            {getInitials(member.profile.full_name || member.profile.email)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {(group.member_count || 0) > 3 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                          +{(group.member_count || 0) - 3}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openMembersDialog(group)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {group.member_count || 0}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team Group</DialogTitle>
            <DialogDescription>
              Create a new group to organize team members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="Engineering, Sales, Marketing..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this group do?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={`h-8 w-8 rounded-full border-2 ${
                        formData.color === color ? "border-primary" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={submitting}>
              {submitting ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update group details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`h-8 w-8 rounded-full border-2 ${
                      formData.color === color ? "border-primary" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup} disabled={submitting}>
              {submitting ? "Updating..." : "Update Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedGroup?.name} Members</DialogTitle>
            <DialogDescription>
              Manage group membership
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter(m => !selectedGroup?.members?.some(gm => gm.user_id === m.id))
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name || member.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember} disabled={!selectedMember}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {selectedGroup?.members && selectedGroup.members.length > 0 ? (
                selectedGroup.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                          {getInitials(member.profile.full_name || member.profile.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.profile.full_name || member.profile.email}
                        </p>
                        {member.profile.job_title && (
                          <p className="text-sm text-muted-foreground">
                            {member.profile.job_title}
                          </p>
                        )}
                      </div>
                      {member.role === "leader" && (
                        <Badge variant="outline">
                          <Crown className="h-3 w-3 mr-1" />
                          Leader
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members in this group yet
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
