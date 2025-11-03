"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, X, Share2, Eye, MessageSquare, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface SharedUser {
  user_id: string;
  user: {
    email: string;
    full_name: string;
  };
  access_level: "view" | "comment" | "edit";
  granted_at: string;
}

interface ShareDocumentModalProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  onShareSuccess?: () => void;
}

const ACCESS_LEVELS = [
  {
    value: "view",
    label: "View",
    icon: Eye,
    description: "Can view the document",
  },
  {
    value: "comment",
    label: "Comment",
    icon: MessageSquare,
    description: "Can view and comment",
  },
  {
    value: "edit",
    label: "Edit",
    icon: Edit3,
    description: "Can view, comment, and edit",
  },
];

export function ShareDocumentModal({
  open,
  onClose,
  documentId,
  documentTitle,
  onShareSuccess,
}: ShareDocumentModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [accessLevel, setAccessLevel] = useState<"view" | "comment" | "edit">("view");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchSharedUsers();
    }
  }, [open, documentId]);

  async function fetchUsers() {
    setIsLoadingUsers(true);
    try {
      const response = await fetch("/api/organization/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  }

  async function fetchSharedUsers() {
    try {
      const response = await fetch(`/api/documents/${documentId}/access`);
      if (response.ok) {
        const data = await response.json();
        setSharedUsers(data.access || []);
      }
    } catch (error) {
      console.error("Error fetching shared users:", error);
    }
  }

  async function handleShare() {
    if (!selectedUserId) {
      toast.error("Please select a user to share with");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          share_with_user_ids: [selectedUserId],
          access_level: accessLevel,
          message: message || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to share document");
      }

      toast.success(`Document shared with ${users.find(u => u.id === selectedUserId)?.full_name || "user"}`);

      // Reset form
      setSelectedUserId("");
      setAccessLevel("view");
      setMessage("");

      // Refresh shared users list
      fetchSharedUsers();
      onShareSuccess?.();
    } catch (error: any) {
      console.error("Error sharing document:", error);
      toast.error(error.message || "Failed to share document");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRevokeAccess(userId: string) {
    try {
      const response = await fetch(`/api/documents/${documentId}/access/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to revoke access");
      }

      toast.success("Access revoked");
      fetchSharedUsers();
      onShareSuccess?.();
    } catch (error) {
      console.error("Error revoking access:", error);
      toast.error("Failed to revoke access");
    }
  }

  const availableUsers = users.filter(
    (user) => !sharedUsers.some((su) => su.user_id === user.id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl backdrop-blur-2xl bg-background/95 border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Document
          </DialogTitle>
          <DialogDescription>{documentTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share with new user */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Share with</Label>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-select">User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="user-select" disabled={isLoadingUsers}>
                    <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.full_name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {availableUsers.length === 0 && !isLoadingUsers && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No users available to share with
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-level">Access Level</Label>
                <Select
                  value={accessLevel}
                  onValueChange={(value: any) => setAccessLevel(value)}
                >
                  <SelectTrigger id="access-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_LEVELS.map((level) => {
                      const Icon = level.icon;
                      return (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-start gap-3 py-1">
                            <Icon className="h-4 w-4 mt-0.5 text-primary" />
                            <div>
                              <div className="font-medium">{level.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {level.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a message for the recipient..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleShare}
                disabled={!selectedUserId || isLoading}
                className="w-full"
              >
                {isLoading ? "Sharing..." : "Share Document"}
              </Button>
            </div>
          </div>

          {/* Currently shared with */}
          {sharedUsers.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Shared with ({sharedUsers.length})</Label>
              </div>

              <div className="space-y-2">
                {sharedUsers.map((sharedUser) => {
                  const accessLevelInfo = ACCESS_LEVELS.find(
                    (l) => l.value === sharedUser.access_level
                  );
                  const Icon = accessLevelInfo?.icon || Eye;

                  return (
                    <div
                      key={sharedUser.user_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {sharedUser.user.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {sharedUser.user.email}
                          </div>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {accessLevelInfo?.label || sharedUser.access_level}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeAccess(sharedUser.user_id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
