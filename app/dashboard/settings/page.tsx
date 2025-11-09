"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
  Bot,
  Code2,
  Database,
  Eye,
  EyeOff,
  Gauge,
  Languages,
  Layout,
  Maximize2,
  Minimize2,
  Sliders,
  Volume2,
  VolumeX,
  Wifi,
  HardDrive,
  Thermometer,
  FileText,
  MessageSquare,
  Braces,
  AlignLeft,
  Type,
  Accessibility,
  Laptop,
  Grid,
  List,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { resetOnboarding } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

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
    // Notifications
    emailNotifications: true,
    desktopNotifications: false,
    pushNotifications: true,
    documentUpdates: true,
    teamActivity: true,
    weeklyDigest: false,

    // Editor
    autoSave: true,
    autoSaveInterval: 30,
    soundEffects: false,
    compactMode: false,
    syntaxHighlighting: true,
    lineNumbers: true,
    wordWrap: true,

    // AI
    defaultModel: "gpt-4o-mini",
    temperature: 0.7,
    enableRAG: true,
    maxTokens: 4000,
    streamResponses: true,
    contextWindow: "auto",

    // Privacy
    analyticsEnabled: true,
    usageTracking: true,
    errorReporting: true,
    shareAnonymousData: false,

    // Accessibility
    fontSize: "medium",
    reduceAnimations: false,
    highContrast: false,
    screenReaderOptimized: false,

    // Performance
    enableCache: true,
    preloadDocuments: true,
    lazyLoadImages: true,
    maxCacheSize: 500,

    // Interface
    sidebarPosition: "left",
    defaultView: "grid",
    itemsPerPage: 20,
    showTooltips: true,
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

  async function loadPreferences() {
    if (typeof window === "undefined") return;

    try {
      // First, load from localStorage for immediate UI update
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" || "system";
      setTheme(savedTheme);

      const savedPreferences = localStorage.getItem("preferences");
      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences);
          setPreferences(parsed);
        } catch (e) {
          console.error("Error parsing saved preferences:", e);
        }
      }

      // Then, load from database to sync across devices
      const response = await fetch("/api/preferences");
      if (response.ok) {
        const { preferences: dbPreferences } = await response.json();

        if (dbPreferences && Object.keys(dbPreferences).length > 0) {
          // Merge with defaults to ensure all fields exist
          const mergedPreferences = { ...preferences, ...dbPreferences };
          setPreferences(mergedPreferences);

          // Update localStorage with database preferences
          localStorage.setItem("preferences", JSON.stringify(mergedPreferences));
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  }

  // Save to localStorage immediately for instant feedback
  const savePreferencesToLocalStorage = useCallback((prefs: typeof preferences) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("preferences", JSON.stringify(prefs));
  }, []);

  // Save to database with debouncing (500ms)
  const savePreferencesToDatabase = useCallback((prefs: typeof preferences) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 500ms of inactivity
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: prefs }),
        });

        if (!response.ok) {
          console.error("Failed to save preferences to database");
        }
      } catch (error) {
        console.error("Error saving preferences to database:", error);
      }
    }, 500);
  }, []);

  // Combined save function - saves to both localStorage and database
  const savePreferences = useCallback((prefs: typeof preferences) => {
    savePreferencesToLocalStorage(prefs);
    savePreferencesToDatabase(prefs);
  }, [savePreferencesToLocalStorage, savePreferencesToDatabase]);

  // Manual save all preferences function
  const handleSaveAllPreferences = async () => {
    setIsSaving(true);
    try {
      // Clear any pending debounced saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Save immediately to both localStorage and database
      savePreferencesToLocalStorage(preferences);

      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      toast.success("All preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to update preferences and trigger auto-save
  const updatePreference = useCallback((updates: Partial<typeof preferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

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
            {/* Appearance Section */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-white dark:text-slate-900" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Appearance</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Customize how Perpetual Core looks</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium mb-3 block">Theme</Label>
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

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Compact Mode</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Reduce spacing for denser interface</p>
                  </div>
                  <Switch
                    checked={preferences.compactMode}
                    onCheckedChange={(checked) => {
                      updatePreference({ compactMode: checked });
                      toast.success(checked ? "Compact mode enabled" : "Compact mode disabled");
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* AI Settings */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white dark:text-slate-900" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">AI Settings</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Configure AI behavior and defaults</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Default Model</Label>
                    <Select value={preferences.defaultModel} onValueChange={(value) => updatePreference({ defaultModel: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Context Window</Label>
                    <Select value={preferences.contextWindow} onValueChange={(value) => updatePreference({ contextWindow: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (Recommended)</SelectItem>
                        <SelectItem value="short">Short (4K tokens)</SelectItem>
                        <SelectItem value="medium">Medium (8K tokens)</SelectItem>
                        <SelectItem value="long">Long (16K tokens)</SelectItem>
                        <SelectItem value="xl">Extra Long (32K tokens)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Temperature: {preferences.temperature.toFixed(1)}</Label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {preferences.temperature < 0.3 ? "Focused" : preferences.temperature < 0.7 ? "Balanced" : "Creative"}
                    </span>
                  </div>
                  <Slider
                    value={[preferences.temperature]}
                    onValueChange={([value]) => updatePreference({ temperature: value })}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Lower values make output more focused and deterministic</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Enable RAG (Retrieval)</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Search uploaded documents for relevant context</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.enableRAG}
                    onCheckedChange={(checked) => updatePreference({ enableRAG: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Stream Responses</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Show AI responses as they're generated</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.streamResponses}
                    onCheckedChange={(checked) => updatePreference({ streamResponses: checked })}
                  />
                </div>
              </div>
            </Card>

            {/* Notifications Section */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white dark:text-slate-900" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Notifications</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Control how you receive updates</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Receive important updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => updatePreference({ emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Laptop className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Desktop Notifications</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Show browser push notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.desktopNotifications}
                    onCheckedChange={(checked) => updatePreference({ desktopNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Document Updates</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Notify when documents are shared or edited</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.documentUpdates}
                    onCheckedChange={(checked) => updatePreference({ documentUpdates: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Team Activity</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Get notified of team member actions</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.teamActivity}
                    onCheckedChange={(checked) => updatePreference({ teamActivity: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Weekly Digest</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Summary email every Monday morning</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.weeklyDigest}
                    onCheckedChange={(checked) => updatePreference({ weeklyDigest: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {preferences.soundEffects ? <Volume2 className="h-5 w-5 text-pink-500" /> : <VolumeX className="h-5 w-5 text-slate-400" />}
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Sound Effects</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Play audio feedback for actions</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.soundEffects}
                    onCheckedChange={(checked) => updatePreference({ soundEffects: checked })}
                  />
                </div>
              </div>
            </Card>

            {/* Editor Preferences */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <Code2 className="h-5 w-5 text-white dark:text-slate-900" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Editor Preferences</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Customize your editing experience</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Save className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Auto-save</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Automatically save changes every {preferences.autoSaveInterval} seconds</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => updatePreference({ autoSave: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Braces className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Syntax Highlighting</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Colorize code blocks and markdown</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.syntaxHighlighting}
                    onCheckedChange={(checked) => updatePreference({ syntaxHighlighting: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <AlignLeft className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Line Numbers</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Show line numbers in code editor</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.lineNumbers}
                    onCheckedChange={(checked) => updatePreference({ lineNumbers: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <AlignLeft className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Word Wrap</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Wrap long lines instead of scrolling</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.wordWrap}
                    onCheckedChange={(checked) => updatePreference({ wordWrap: checked })}
                  />
                </div>
              </div>
            </Card>

            {/* Privacy & Data */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  {preferences.analyticsEnabled ? <Eye className="h-5 w-5 text-white dark:text-slate-900" /> : <EyeOff className="h-5 w-5 text-white dark:text-slate-900" />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Privacy & Data</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Control your data and privacy settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Analytics</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Help improve the platform with usage data</p>
                  </div>
                  <Switch
                    checked={preferences.analyticsEnabled}
                    onCheckedChange={(checked) => updatePreference({ analyticsEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Usage Tracking</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Track feature usage and interactions</p>
                  </div>
                  <Switch
                    checked={preferences.usageTracking}
                    onCheckedChange={(checked) => updatePreference({ usageTracking: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Error Reporting</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Automatically report errors to help fix bugs</p>
                  </div>
                  <Switch
                    checked={preferences.errorReporting}
                    onCheckedChange={(checked) => updatePreference({ errorReporting: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Share Anonymous Data</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Share aggregated insights for research</p>
                  </div>
                  <Switch
                    checked={preferences.shareAnonymousData}
                    onCheckedChange={(checked) => updatePreference({ shareAnonymousData: checked })}
                  />
                </div>
              </div>
            </Card>

            {/* Accessibility */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <Accessibility className="h-5 w-5 text-white dark:text-slate-900" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Accessibility</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Make the interface work better for you</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Font Size</Label>
                  <Select value={preferences.fontSize} onValueChange={(value) => updatePreference({ fontSize: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium (Default)</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Reduce Animations</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Minimize motion effects</p>
                  </div>
                  <Switch
                    checked={preferences.reduceAnimations}
                    onCheckedChange={(checked) => updatePreference({ reduceAnimations: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">High Contrast</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Increase contrast for better visibility</p>
                  </div>
                  <Switch
                    checked={preferences.highContrast}
                    onCheckedChange={(checked) => updatePreference({ highContrast: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Screen Reader Optimized</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Enhanced ARIA labels and navigation</p>
                  </div>
                  <Switch
                    checked={preferences.screenReaderOptimized}
                    onCheckedChange={(checked) => updatePreference({ screenReaderOptimized: checked })}
                  />
                </div>
              </div>
            </Card>

            {/* Performance */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <Gauge className="h-5 w-5 text-white dark:text-slate-900" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Performance</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Optimize speed and resource usage</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5 text-cyan-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Enable Cache</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Cache data locally for faster loading</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.enableCache}
                    onCheckedChange={(checked) => updatePreference({ enableCache: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Preload Documents</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Load recently used documents in background</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.preloadDocuments}
                    onCheckedChange={(checked) => updatePreference({ preloadDocuments: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Camera className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Lazy Load Images</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Load images only when visible</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.lazyLoadImages}
                    onCheckedChange={(checked) => updatePreference({ lazyLoadImages: checked })}
                  />
                </div>
              </div>
            </Card>

            {/* Interface */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <Layout className="h-5 w-5 text-white dark:text-slate-900" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Interface</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Customize layout and navigation</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Default View</Label>
                    <Select value={preferences.defaultView} onValueChange={(value) => updatePreference({ defaultView: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">
                          <div className="flex items-center gap-2">
                            <Grid className="h-4 w-4" />
                            Grid View
                          </div>
                        </SelectItem>
                        <SelectItem value="list">
                          <div className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            List View
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Sidebar Position</Label>
                    <Select value={preferences.sidebarPosition} onValueChange={(value) => updatePreference({ sidebarPosition: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Show Tooltips</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Display helpful hints on hover</p>
                  </div>
                  <Switch
                    checked={preferences.showTooltips}
                    onCheckedChange={(checked) => updatePreference({ showTooltips: checked })}
                  />
                </div>
              </div>
            </Card>

            {/* Save All Preferences Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveAllPreferences}
                disabled={isSaving}
                className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg px-8"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Preferences
                  </>
                )}
              </Button>
            </div>
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
