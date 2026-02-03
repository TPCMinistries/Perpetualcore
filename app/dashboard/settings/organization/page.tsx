"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
  Globe,
  Shield,
  Users,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Key,
  Webhook,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface OrganizationSettings {
  name: string;
  slug: string;
  description: string;
  website: string;
  logo_url: string | null;
  industry: string;
  company_size: string;
  domain: string;
  domain_verified: boolean;
  default_role: "member" | "admin" | "viewer";
  allow_member_invites: boolean;
  require_2fa: boolean;
  session_timeout: number;
  enable_api_access: boolean;
  enable_webhooks: boolean;
  enable_sso: boolean;
  primary_color: string;
  secondary_color: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

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
    session_timeout: 480,
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

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file size must be less than 2MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingLogo(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.user_metadata.organization_id}/logo.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("organization-assets")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

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
      <DashboardPageWrapper maxWidth="5xl">
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper maxWidth="5xl">
      <DashboardHeader
        title="Organization"
        subtitle="Manage your organization profile, team defaults, and security policies"
        icon={Building2}
        iconColor="violet"
        actions={[
          {
            label: saving ? "Saving..." : "Save Changes",
            icon: saving ? Loader2 : Save,
            onClick: handleSave,
            variant: "primary",
          },
        ]}
      />

      {/* Organization Details */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="mb-6"
      >
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-base">Organization Details</CardTitle>
                <CardDescription>Basic information about your organization</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Organization Logo</Label>
              <div className="flex items-center gap-4">
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt="Organization logo"
                    className="h-16 w-16 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 flex items-center justify-center border-2 border-dashed border-violet-300 dark:border-violet-700">
                    <Building2 className="h-8 w-8 text-violet-500 dark:text-violet-400" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="cursor-pointer h-11"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Recommended: Square image, max 2MB
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                  Organization Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => updateSetting("name", e.target.value)}
                  placeholder="Acme Corporation"
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-slate-700 dark:text-slate-300">
                  Organization Slug <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="slug"
                  value={settings.slug}
                  onChange={(e) => updateSetting("slug", e.target.value)}
                  placeholder="acme-corp"
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Used in URLs: perpetualcore.com/{settings.slug || "your-org"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">
                Description
              </Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => updateSetting("description", e.target.value)}
                placeholder="Tell us about your organization..."
                rows={3}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website" className="text-slate-700 dark:text-slate-300">
                  Website
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="website"
                    type="url"
                    value={settings.website}
                    onChange={(e) => updateSetting("website", e.target.value)}
                    placeholder="https://acme.com"
                    className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="text-slate-700 dark:text-slate-300">
                  Industry
                </Label>
                <Select
                  value={settings.industry}
                  onValueChange={(value) => updateSetting("industry", value)}
                >
                  <SelectTrigger className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="nonprofit">Nonprofit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-size" className="text-slate-700 dark:text-slate-300">
                Company Size
              </Label>
              <Select
                value={settings.company_size}
                onValueChange={(value) => updateSetting("company_size", value)}
              >
                <SelectTrigger className="w-full sm:w-64 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
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
      </motion.div>

      {/* Domain Verification */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="mb-6"
      >
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">Domain Verification</CardTitle>
                <CardDescription>Verify your domain for enhanced security and branding</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-slate-700 dark:text-slate-300">
                Domain
              </Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  value={settings.domain}
                  onChange={(e) => updateSetting("domain", e.target.value)}
                  placeholder="acme.com"
                  className="flex-1 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
                <Button
                  onClick={handleVerifyDomain}
                  disabled={verifyingDomain || !settings.domain}
                  variant="outline"
                  className="h-11"
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
              <div className={cn(
                "p-4 rounded-xl border",
                settings.domain_verified
                  ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                  : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
              )}>
                <div className="flex items-start gap-3">
                  {settings.domain_verified ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className={cn(
                        "font-medium",
                        settings.domain_verified
                          ? "text-emerald-900 dark:text-emerald-100"
                          : "text-amber-900 dark:text-amber-100"
                      )}>
                        {settings.domain_verified ? "Domain Verified" : "Verification Pending"}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          settings.domain_verified
                            ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400"
                            : "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400"
                        )}
                      >
                        {settings.domain_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    {!settings.domain_verified && (
                      <div className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                        <p>Add this TXT record to your DNS settings:</p>
                        <code className="block p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 text-xs font-mono">
                          perpetualcore-verification={settings.slug}-{Math.random().toString(36).substring(7)}
                        </code>
                        <p className="text-xs">DNS changes can take up to 48 hours to propagate.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Defaults */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="mb-6"
      >
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">Team Defaults</CardTitle>
                <CardDescription>Default settings for new team members</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="default-role" className="text-slate-700 dark:text-slate-300">
                Default Role for New Members
              </Label>
              <Select
                value={settings.default_role}
                onValueChange={(value: "member" | "admin" | "viewer") =>
                  updateSetting("default_role", value)
                }
              >
                <SelectTrigger className="w-full sm:w-64 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                  <SelectItem value="member">Member - Standard access</SelectItem>
                  <SelectItem value="admin">Admin - Full access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="space-y-0.5">
                <Label className="text-slate-900 dark:text-white">Allow Members to Send Invites</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Let team members invite others to the organization
                </p>
              </div>
              <Switch
                checked={settings.allow_member_invites}
                onCheckedChange={(checked) => updateSetting("allow_member_invites", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Settings */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="mb-6"
      >
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                <Shield className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <CardTitle className="text-base">Security & Access</CardTitle>
                <CardDescription>Organization-wide security policies</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                  <Lock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <Label className="text-slate-900 dark:text-white">Require Two-Factor Authentication</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Enforce 2FA for all team members
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.require_2fa}
                onCheckedChange={(checked) => updateSetting("require_2fa", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Session Timeout</Label>
              <Select
                value={settings.session_timeout.toString()}
                onValueChange={(value) => updateSetting("session_timeout", parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-64 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Users will be logged out after this period of inactivity
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Feature Access */}
      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="mb-6"
      >
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Settings className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Feature Access</CardTitle>
                <CardDescription>Control which features are enabled for your organization</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <Key className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <Label className="text-slate-900 dark:text-white">API Access</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Allow programmatic access via API keys
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.enable_api_access}
                onCheckedChange={(checked) => updateSetting("enable_api_access", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Webhook className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <Label className="text-slate-900 dark:text-white">Webhooks</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Enable webhook notifications for events
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.enable_webhooks}
                onCheckedChange={(checked) => updateSetting("enable_webhooks", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <Label className="text-slate-900 dark:text-white">Single Sign-On (SSO)</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Enable SAML/OAuth SSO for enterprise authentication
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.enable_sso}
                onCheckedChange={(checked) => updateSetting("enable_sso", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile Save Button */}
      <div className="flex justify-end gap-3 lg:hidden">
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
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </DashboardPageWrapper>
  );
}
