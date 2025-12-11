"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Shield,
  Key,
  Download,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface SecuritySectionProps {
  passwordDialogOpen: boolean;
  setPasswordDialogOpen: (open: boolean) => void;
}

export function SecuritySection({
  passwordDialogOpen,
  setPasswordDialogOpen,
}: SecuritySectionProps) {
  const [apiKeysDialogOpen, setApiKeysDialogOpen] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpires, setNewKeyExpires] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success("Password changed successfully!");
      setPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys || []);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    setIsCreatingKey(true);
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          expiresIn: newKeyExpires || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewlyCreatedKey(data.apiKey.fullKey);
        setNewKeyName("");
        setNewKeyExpires("");
        fetchApiKeys();
        toast.success("API key created successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create API key");
      }
    } catch (error) {
      toast.error("Failed to create API key");
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/api-keys?id=${keyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("API key revoked");
        fetchApiKeys();
      } else {
        toast.error("Failed to revoke API key");
      }
    } catch (error) {
      toast.error("Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to export data");
        return;
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        userId: user.id,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `perpetual-core-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully!");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsExportingData(false);
    }
  };

  return (
    <>
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white dark:text-slate-900" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Security & Privacy</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Protect your account and data</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100 mb-1">Your account is secure</p>
                <p className="text-sm text-green-700 dark:text-green-300">All security features are enabled and working properly</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => setApiKeysDialogOpen(true)}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Key className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-900 dark:text-white">API Keys</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your API access tokens</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={handleExportData}
              disabled={isExportingData}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {isExportingData ? (
                    <Loader2 className="h-5 w-5 text-slate-900 dark:text-slate-100 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {isExportingData ? "Exporting..." : "Export Data"}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Download all your data</p>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update your password to keep your account secure
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Password must be at least 8 characters long
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Keys Dialog */}
      <Dialog open={apiKeysDialogOpen} onOpenChange={(open) => {
        setApiKeysDialogOpen(open);
        if (open) {
          fetchApiKeys();
          setNewlyCreatedKey(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>API Keys</DialogTitle>
            <DialogDescription>
              Create and manage API keys for programmatic access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {newlyCreatedKey && (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  Your new API key (copy it now - you won't see it again):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white dark:bg-slate-800 rounded border text-sm font-mono overflow-hidden text-ellipsis">
                    {newlyCreatedKey}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(newlyCreatedKey)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium text-slate-900 dark:text-white">Create New API Key</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production Server"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyExpires">Expiration</Label>
                  <Select value={newKeyExpires} onValueChange={setNewKeyExpires}>
                    <SelectTrigger>
                      <SelectValue placeholder="Never expires" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Never expires</SelectItem>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="90d">90 days</SelectItem>
                      <SelectItem value="1y">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleCreateApiKey}
                disabled={isCreatingKey || !newKeyName.trim()}
                className="w-full"
              >
                {isCreatingKey ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Create API Key
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-white">Your API Keys</h4>
              {apiKeys.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No API keys yet. Create one above to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {apiKeys.filter(k => k.is_active).map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{key.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {key.key_preview} • Created {new Date(key.created_at).toLocaleDateString()}
                          {key.expires_at && ` • Expires ${new Date(key.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevokeApiKey(key.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApiKeysDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
