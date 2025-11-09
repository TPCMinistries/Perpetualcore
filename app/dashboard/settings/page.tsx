"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  CreditCard,
  Download,
  Sparkles,
  Bell,
  Settings as SettingsIcon,
  Palette,
  Building2,
  Shield,
  Users,
  Key,
  Mail,
  User,
  Crown,
  Zap,
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  Camera,
  Lock,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { resetOnboarding } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  // User profile state
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    avatar: "",
    role: "",
    organization: "",
    memberSince: "",
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    desktopNotifications: false,
    autoSave: true,
    soundEffects: false,
    compactMode: false,
  });

  useEffect(() => {
    fetchUserProfile();
    loadPreferences();
  }, []);

  async function fetchUserProfile() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, role, created_at, organization_id")
          .eq("id", user.id)
          .single();

        setProfile({
          fullName: profileData?.full_name || "",
          email: user.email || "",
          avatar: "",
          role: profileData?.role || "member",
          organization: "",
          memberSince: profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }

  function loadPreferences() {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" || "system";
      setTheme(savedTheme);
    }
  }

  const handleRestartOnboarding = async () => {
    setIsResetting(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("onboarding-completed");
        localStorage.removeItem("onboarding-step");
        localStorage.removeItem("onboarding-skipped");
        localStorage.removeItem("onboarding-completed-v2");
        localStorage.removeItem("onboarding-step-v2");
        localStorage.removeItem("onboarding-completed-v3");
        localStorage.removeItem("onboarding-step-v3");
      }

      const result = await resetOnboarding();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Onboarding reset! Redirecting to dashboard...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      }
    } catch (error) {
      toast.error("Failed to reset onboarding");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .update({ full_name: profile.fullName })
          .eq("id", user.id);

        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);

      // Apply theme
      const root = window.document.documentElement;
      if (newTheme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.toggle("dark", systemTheme === "dark");
      } else {
        root.classList.toggle("dark", newTheme === "dark");
      }
    }
    toast.success(`Theme changed to ${newTheme}`);
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { label: "Admin", color: "bg-purple-500", icon: Crown },
      member: { label: "Member", color: "bg-blue-500", icon: User },
      owner: { label: "Owner", color: "bg-amber-500", icon: Zap },
    };
    return badges[role as keyof typeof badges] || badges.member;
  };

  const badge = getRoleBadge(profile.role);
  const BadgeIcon = badge.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto p-8 space-y-8">

        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 dark:from-violet-500/20 dark:via-purple-500/10 dark:to-fuchsia-500/20" />

          <div className="relative p-8">
            <div className="flex items-start justify-between">
              {/* User Profile */}
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="relative group">
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                    {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <button className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-green-500 border-4 border-white dark:border-slate-900 shadow-lg" />
                </div>

                {/* Profile Info */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                      {profile.fullName || "User"}
                    </h1>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${badge.color} text-white text-sm font-medium shadow-lg`}>
                      <BadgeIcon className="h-3.5 w-3.5" />
                      {badge.label}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    Member since {profile.memberSince}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleRestartOnboarding}
                  disabled={isResetting}
                  variant="outline"
                  className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                >
                  {isResetting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Restart Tour
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Settings Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Premium Tabs */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-2 shadow-lg">
            <TabsList className="grid grid-cols-4 gap-2 bg-transparent h-auto p-0">
              <TabsTrigger
                value="account"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-6 py-3 rounded-lg transition-all"
              >
                <User className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-6 py-3 rounded-lg transition-all"
              >
                <Palette className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
              <TabsTrigger
                value="organization"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-6 py-3 rounded-lg transition-all"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Organization
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-6 py-3 rounded-lg transition-all"
              >
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="border-violet-200 dark:border-violet-800/50 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Profile Information</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Update your personal details</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300 font-medium">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      className="border-slate-300 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg px-6"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Password & Authentication</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your password and security settings</p>
                </div>
              </div>

              <Button variant="outline" className="border-slate-300 dark:border-slate-700">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Theme Selection */}
            <Card className="border-blue-200 dark:border-blue-800/50 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Appearance</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Customize how Perpetual Core looks</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange("light")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === "light"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <Sun className={`h-8 w-8 mx-auto mb-3 ${theme === "light" ? "text-blue-500" : "text-slate-400"}`} />
                    <p className={`font-medium text-center ${theme === "light" ? "text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>
                      Light
                    </p>
                  </button>
                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === "dark"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <Moon className={`h-8 w-8 mx-auto mb-3 ${theme === "dark" ? "text-blue-500" : "text-slate-400"}`} />
                    <p className={`font-medium text-center ${theme === "dark" ? "text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>
                      Dark
                    </p>
                  </button>
                  <button
                    onClick={() => handleThemeChange("system")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === "system"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <Monitor className={`h-8 w-8 mx-auto mb-3 ${theme === "system" ? "text-blue-500" : "text-slate-400"}`} />
                    <p className={`font-medium text-center ${theme === "system" ? "text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>
                      System
                    </p>
                  </button>
                </div>
              </div>
            </Card>

            {/* Notification Settings */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Notifications</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your notification preferences</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Desktop Notifications</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Show browser notifications</p>
                  </div>
                  <Switch
                    checked={preferences.desktopNotifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, desktopNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Auto-save</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Automatically save your work</p>
                  </div>
                  <Switch
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, autoSave: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Sound Effects</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Play sounds for actions</p>
                  </div>
                  <Switch
                    checked={preferences.soundEffects}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, soundEffects: checked })}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-6">
            <Card className="border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Organization Settings</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage your organization and team</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6">
                    <Users className="h-8 w-8 text-amber-500 mb-3" />
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">5</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Team Members</p>
                  </Card>
                  <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6">
                    <Globe className="h-8 w-8 text-blue-500 mb-3" />
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">3</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Active Spaces</p>
                  </Card>
                  <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6">
                    <CreditCard className="h-8 w-8 text-green-500 mb-3" />
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">Pro</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Current Plan</p>
                  </Card>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Team
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <CreditCard className="h-4 w-4 mr-2" />
                    View Billing
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-red-200 dark:border-red-800/50 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
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
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="flex items-center gap-4 w-full">
                      <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                        <Key className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-900 dark:text-white">API Keys</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Manage your API access tokens</p>
                      </div>
                    </div>
                  </Button>

                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="flex items-center gap-4 w-full">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                        <Download className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-900 dark:text-white">Export Data</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Download all your data</p>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
