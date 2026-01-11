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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ban,
  Mail,
  Globe,
  Trash2,
  Plus,
  Loader2,
  Settings,
  Shield,
  AlertCircle,
  CheckCircle2,
  ShoppingBag,
  Bell,
  Share2,
  Newspaper,
  Calendar,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BlockedSender {
  id: string;
  block_type: "email" | "domain";
  value: string;
  reason: string | null;
  blocked_count: number;
  created_at: string;
}

interface FilterPreferences {
  skip_promotions: boolean;
  skip_social: boolean;
  skip_updates: boolean;
  skip_forums: boolean;
  trusted_only: boolean;
}

interface InboxSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InboxSettingsDialog({
  open,
  onOpenChange,
}: InboxSettingsDialogProps) {
  const [blockedSenders, setBlockedSenders] = useState<BlockedSender[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newBlockValue, setNewBlockValue] = useState("");
  const [newBlockType, setNewBlockType] = useState<"email" | "domain">("email");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Filter preferences (would be stored in user profile or settings table)
  const [filterPrefs, setFilterPrefs] = useState<FilterPreferences>({
    skip_promotions: false,
    skip_social: false,
    skip_updates: false,
    skip_forums: false,
    trusted_only: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (open) {
      fetchBlockedSenders();
      fetchFilterPreferences();
    }
  }, [open]);

  async function fetchBlockedSenders() {
    setLoading(true);
    try {
      const response = await fetch("/api/inbox/blocked-senders");
      if (response.ok) {
        const data = await response.json();
        setBlockedSenders(data.blocked_senders || []);
      }
    } catch (error) {
      console.error("Error fetching blocked senders:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFilterPreferences() {
    try {
      const response = await fetch("/api/inbox/filter-preferences");
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setFilterPrefs(data.preferences);
        }
      }
    } catch (error) {
      console.error("Error fetching filter preferences:", error);
    }
  }

  async function addBlockedSender() {
    if (!newBlockValue.trim()) return;

    setAdding(true);
    setResult(null);
    try {
      const response = await fetch("/api/inbox/blocked-senders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockType: newBlockType,
          value: newBlockValue.trim().toLowerCase(),
          reason: newBlockReason || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          success: true,
          message: `Blocked ${newBlockType}. ${data.marked_spam_count || 0} emails marked as spam.`,
        });
        setNewBlockValue("");
        setNewBlockReason("");
        fetchBlockedSenders();
      } else {
        const error = await response.json();
        setResult({
          success: false,
          message: error.error || "Failed to add blocked sender",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to add blocked sender",
      });
    } finally {
      setAdding(false);
    }
  }

  async function removeBlockedSender(id: string) {
    setDeleting(id);
    try {
      const response = await fetch(`/api/inbox/blocked-senders?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBlockedSenders((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error("Error removing blocked sender:", error);
    } finally {
      setDeleting(null);
    }
  }

  async function saveFilterPreferences(newPrefs: FilterPreferences) {
    setFilterPrefs(newPrefs);
    setSavingPrefs(true);
    try {
      await fetch("/api/inbox/filter-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: newPrefs }),
      });
    } catch (error) {
      console.error("Error saving filter preferences:", error);
    } finally {
      setSavingPrefs(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Inbox Settings
          </DialogTitle>
          <DialogDescription>
            Control what emails appear in your inbox
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="blocked" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blocked" className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Blocked Senders
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Auto-Filters
            </TabsTrigger>
          </TabsList>

          {/* Blocked Senders Tab */}
          <TabsContent value="blocked" className="flex-1 mt-4 space-y-4">
            {/* Add New Block Form */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
              <Label className="text-sm font-medium">Block a sender</Label>
              <div className="flex gap-2">
                <select
                  value={newBlockType}
                  onChange={(e) => setNewBlockType(e.target.value as "email" | "domain")}
                  className="w-32 px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="domain">Domain</option>
                </select>
                <Input
                  value={newBlockValue}
                  onChange={(e) => setNewBlockValue(e.target.value)}
                  placeholder={newBlockType === "email" ? "spam@example.com" : "example.com"}
                  className="flex-1"
                />
                <Button onClick={addBlockedSender} disabled={!newBlockValue.trim() || adding}>
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Input
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
                placeholder="Reason (optional)"
                className="text-sm"
              />
            </div>

            {/* Result Banner */}
            {result && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  result.success
                    ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{result.message}</span>
              </div>
            )}

            {/* Blocked List */}
            <div className="border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b text-sm font-medium text-slate-600 dark:text-slate-400">
                {blockedSenders.length} blocked sender{blockedSenders.length !== 1 ? "s" : ""}
              </div>

              <ScrollArea className="h-[280px]">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : blockedSenders.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Ban className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No blocked senders yet</p>
                  </div>
                ) : (
                  <div className="divide-y dark:divide-slate-700">
                    {blockedSenders.map((sender) => (
                      <div
                        key={sender.id}
                        className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          {sender.block_type === "domain" ? (
                            <Globe className="h-4 w-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <Mail className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {sender.value}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {sender.block_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {sender.reason && <span>{sender.reason}</span>}
                            <span>
                              {sender.blocked_count} blocked
                            </span>
                            <span>
                              Added {formatDistanceToNow(new Date(sender.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBlockedSender(sender.id)}
                          disabled={deleting === sender.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {deleting === sender.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Auto-Filters Tab */}
          <TabsContent value="filters" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Automatically skip certain types of emails during sync. Skipped emails won&apos;t appear in your inbox.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium">Promotions</p>
                    <p className="text-sm text-muted-foreground">Marketing, deals, and promotional emails</p>
                  </div>
                </div>
                <Switch
                  checked={filterPrefs.skip_promotions}
                  onCheckedChange={(checked) =>
                    saveFilterPreferences({ ...filterPrefs, skip_promotions: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Social</p>
                    <p className="text-sm text-muted-foreground">Social network notifications</p>
                  </div>
                </div>
                <Switch
                  checked={filterPrefs.skip_social}
                  onCheckedChange={(checked) =>
                    saveFilterPreferences({ ...filterPrefs, skip_social: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Updates</p>
                    <p className="text-sm text-muted-foreground">Automated updates, confirmations, receipts</p>
                  </div>
                </div>
                <Switch
                  checked={filterPrefs.skip_updates}
                  onCheckedChange={(checked) =>
                    saveFilterPreferences({ ...filterPrefs, skip_updates: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Newspaper className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium">Forums</p>
                    <p className="text-sm text-muted-foreground">Newsletters and forum notifications</p>
                  </div>
                </div>
                <Switch
                  checked={filterPrefs.skip_forums}
                  onCheckedChange={(checked) =>
                    saveFilterPreferences({ ...filterPrefs, skip_forums: checked })
                  }
                />
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />

              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium">Trusted Senders Only</p>
                    <p className="text-sm text-muted-foreground">Only sync emails from existing contacts</p>
                  </div>
                </div>
                <Switch
                  checked={filterPrefs.trusted_only}
                  onCheckedChange={(checked) =>
                    saveFilterPreferences({ ...filterPrefs, trusted_only: checked })
                  }
                />
              </div>
            </div>

            {savingPrefs && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
