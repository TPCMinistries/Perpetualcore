"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  Upload,
  Globe,
  Shield,
  Users,
  Settings,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

interface OrganizationSettings {
  // Organization Details
  name: string;
  slug: string;
  description: string;
  website: string;
  logo_url: string | null;
  industry: string;
  company_size: string;

  // Domain Settings
  domain: string;
  domain_verified: boolean;

  // Team Defaults
  default_role: "member" | "admin" | "viewer";
  allow_member_invites: boolean;
  require_2fa: boolean;
  session_timeout: number; // in minutes

  // Features
  enable_api_access: boolean;
  enable_webhooks: boolean;
  enable_sso: boolean;

  // Branding
  primary_color: string;
  secondary_color: string;
}

export default function OrganizationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [settings, setSettings] = useState<OrganizationSettings>({
    name: "",
    slug: "",
    description: "",
    website: "",
    logo_url: null,
    industry: "technology",
    company_size: "1-10",
    domain: "",
    domain_verified: false,
    default_role: "member",
    allow_member_invites: true,
    require_2fa: false,
    session_timeout: 480, // 8 hours
    enable_api_access: true,
    enable_webhooks: true,
    enable_sso: false,
    primary_color: "#6366f1",
    secondary_color: "#8b5cf6",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", user.user_metadata.organization_id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings({
          name: data.name || "",
          slug: data.slug || "",
          description: data.description || "",
          website: data.website || "",
          logo_url: data.logo_url || null,
          industry: data.industry || "technology",
          company_size: data.company_size || "1-10",
          domain: data.domain || "",
          domain_verified: data.domain_verified || false,
          default_role: data.default_role || "member",
          allow_member_invites: data.allow_member_invites ?? true,
          require_2fa: data.require_2fa || false,
          session_timeout: data.session_timeout || 480,
          enable_api_access: data.enable_api_access ?? true,
          enable_webhooks: data.enable_webhooks ?? true,
          enable_sso: data.enable_sso || false,
          primary_color: data.primary_color || "#6366f1",
          secondary_color: data.secondary_color || "#8b5cf6",
        });
      }
    } catch (error) {
      console.error("Error loading organization settings:", error);
      toast.error("Failed to load organization settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("organizations")
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.user_metadata.organization_id);

      if (error) throw error;

      toast.success("Organization settings saved successfully");
    } catch (error: any) {
      console.error("Error saving organization settings:", error);
      toast.error(error.message || "Failed to save organization settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyDomain() {
    setVerifyingDomain(true);
    try {
      const response = await fetch("/api/organization/verify-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: settings.domain }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to verify domain");
      }

      const data = await response.json();

      if (data.verified) {
        setSettings({ ...settings, domain_verified: true });
        toast.success("Domain verified successfully!");
      } else {
        toast.error("Domain verification failed. Please check your DNS records.");
      }
    } catch (error: any) {
      console.error("Error verifying domain:", error);
      toast.error(error.message || "Failed to verify domain");
    } finally {
      setVerifyingDomain(false);
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file size must be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingLogo(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.user_metadata.organization_id}/logo.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("organization-assets")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("organization-assets")
        .getPublicUrl(fileName);

      setSettings({ ...settings, logo_url: publicUrl });
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  function updateSetting<K extends keyof OrganizationSettings>(
    key: K,
    value: OrganizationSettings[K]
  ) {
    setSettings({ ...settings, [key]: value });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-indigo-950/20 border border-violet-100 dark:border-violet-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-900 via-purple-800 to-indigo-900 dark:from-violet-100 dark:via-purple-100 dark:to-indigo-100 bg-clip-text text-transparent">
              Organization Settings
            </h1>
            <p className="text-violet-700 dark:text-violet-300 mt-1">
              Manage your organization profile and team defaults
            </p>
          </div>
        </div>
      </div>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">Organization Logo</Label>
            <div className="flex items-center gap-4">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Organization logo"
                  className="h-16 w-16 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: Square image, max 2MB
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => updateSetting("name", e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Organization Slug *</Label>
              <Input
                id="slug"
                value={settings.slug}
                onChange={(e) => updateSetting("slug", e.target.value)}
                placeholder="acme-corp"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs: ai-os.com/acme-corp
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) => updateSetting("description", e.target.value)}
              placeholder="Tell us about your organization..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={settings.website}
                onChange={(e) => updateSetting("website", e.target.value)}
                placeholder="https://acme.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={settings.industry}
                onValueChange={(value) => updateSetting("industry", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-size">Company Size</Label>
            <Select
              value={settings.company_size}
              onValueChange={(value) => updateSetting("company_size", value)}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-500">201-500 employees</SelectItem>
                <SelectItem value="501-1000">501-1,000 employees</SelectItem>
                <SelectItem value="1000+">1,000+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Domain Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Verification
          </CardTitle>
          <CardDescription>
            Verify your domain for enhanced security and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <div className="flex gap-2">
              <Input
                id="domain"
                value={settings.domain}
                onChange={(e) => updateSetting("domain", e.target.value)}
                placeholder="acme.com"
                className="flex-1"
              />
              <Button
                onClick={handleVerifyDomain}
                disabled={verifyingDomain || !settings.domain}
                variant="outline"
              >
                {verifyingDomain ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify
                  </>
                )}
              </Button>
            </div>
          </div>

          {settings.domain && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-start gap-3">
                {settings.domain_verified ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium">
                      {settings.domain_verified ? "Domain Verified" : "Verification Pending"}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        settings.domain_verified
                          ? "bg-green-50 border-green-300 text-green-700"
                          : "bg-amber-50 border-amber-300 text-amber-700"
                      }
                    >
                      {settings.domain_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                  {!settings.domain_verified && (
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>Add this TXT record to your DNS settings:</p>
                      <code className="block p-2 bg-background rounded border text-xs">
                        ai-os-verification={`${settings.slug}-${Math.random().toString(36).substring(7)}`}
                      </code>
                      <p>DNS changes can take up to 48 hours to propagate.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Defaults
          </CardTitle>
          <CardDescription>
            Default settings for new team members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="default-role">Default Role for New Members</Label>
            <Select
              value={settings.default_role}
              onValueChange={(value: "member" | "admin" | "viewer") =>
                updateSetting("default_role", value)
              }
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                <SelectItem value="member">Member - Standard access</SelectItem>
                <SelectItem value="admin">Admin - Full access</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-invites">Allow Members to Send Invites</Label>
              <p className="text-sm text-muted-foreground">
                Let team members invite others to the organization
              </p>
            </div>
            <Switch
              id="allow-invites"
              checked={settings.allow_member_invites}
              onCheckedChange={(checked) => updateSetting("allow_member_invites", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Access
          </CardTitle>
          <CardDescription>
            Organization-wide security policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="require-2fa">Require Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Enforce 2FA for all team members
              </p>
            </div>
            <Switch
              id="require-2fa"
              checked={settings.require_2fa}
              onCheckedChange={(checked) => updateSetting("require_2fa", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout</Label>
            <Select
              value={settings.session_timeout.toString()}
              onValueChange={(value) => updateSetting("session_timeout", parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="480">8 hours (recommended)</SelectItem>
                <SelectItem value="1440">24 hours</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Users will be logged out after this period of inactivity
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Access
          </CardTitle>
          <CardDescription>
            Control which features are enabled for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-api">API Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow programmatic access via API keys
              </p>
            </div>
            <Switch
              id="enable-api"
              checked={settings.enable_api_access}
              onCheckedChange={(checked) => updateSetting("enable_api_access", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-webhooks">Webhooks</Label>
              <p className="text-sm text-muted-foreground">
                Enable webhook notifications for events
              </p>
            </div>
            <Switch
              id="enable-webhooks"
              checked={settings.enable_webhooks}
              onCheckedChange={(checked) => updateSetting("enable_webhooks", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-sso">Single Sign-On (SSO)</Label>
              <p className="text-sm text-muted-foreground">
                Enable SAML/OAuth SSO for enterprise authentication
              </p>
            </div>
            <Switch
              id="enable-sso"
              checked={settings.enable_sso}
              onCheckedChange={(checked) => updateSetting("enable_sso", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={loadSettings}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Building2 className="mr-2 h-4 w-4" />
              Save Organization Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
