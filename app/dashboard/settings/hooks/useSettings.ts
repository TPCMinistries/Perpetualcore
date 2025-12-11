"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resetOnboarding } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

export interface UserProfile {
  fullName: string;
  email: string;
  avatar: string;
  role: string;
  organization: string;
  memberSince: string;
}

export interface Preferences {
  // Notifications
  emailNotifications: boolean;
  desktopNotifications: boolean;
  pushNotifications: boolean;
  documentUpdates: boolean;
  teamActivity: boolean;
  weeklyDigest: boolean;

  // Editor
  autoSave: boolean;
  autoSaveInterval: number;
  soundEffects: boolean;
  compactMode: boolean;
  syntaxHighlighting: boolean;
  lineNumbers: boolean;
  wordWrap: boolean;

  // AI
  defaultModel: string;
  temperature: number;
  enableRAG: boolean;
  maxTokens: number;
  streamResponses: boolean;
  contextWindow: string;

  // Privacy
  analyticsEnabled: boolean;
  usageTracking: boolean;
  errorReporting: boolean;
  shareAnonymousData: boolean;

  // Accessibility
  fontSize: string;
  reduceAnimations: boolean;
  highContrast: boolean;
  screenReaderOptimized: boolean;

  // Performance
  enableCache: boolean;
  preloadDocuments: boolean;
  lazyLoadImages: boolean;
  maxCacheSize: number;

  // Interface
  sidebarPosition: string;
  defaultView: string;
  itemsPerPage: number;
  showTooltips: boolean;
}

export const defaultPreferences: Preferences = {
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
};

export function useSettings() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    email: "",
    avatar: "",
    role: "",
    organization: "",
    memberSince: "",
  });

  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

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
      // Silent fail for profile fetch
    }
  }

  async function loadPreferences() {
    if (typeof window === "undefined") return;

    try {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" || "system";
      setTheme(savedTheme);

      const savedPreferences = localStorage.getItem("preferences");
      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences);
          setPreferences(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          // Silent fail for parse errors
        }
      }

      const response = await fetch("/api/preferences");
      if (response.ok) {
        const { preferences: dbPreferences } = await response.json();

        if (dbPreferences && Object.keys(dbPreferences).length > 0) {
          const mergedPreferences = { ...defaultPreferences, ...dbPreferences };
          setPreferences(mergedPreferences);
          localStorage.setItem("preferences", JSON.stringify(mergedPreferences));
        }
      }
    } catch (error) {
      // Silent fail for preferences load
    }
  }

  const savePreferencesToLocalStorage = useCallback((prefs: Preferences) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("preferences", JSON.stringify(prefs));
  }, []);

  const savePreferencesToDatabase = useCallback((prefs: Preferences) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: prefs }),
        });

        if (!response.ok) {
          // Silent fail for database save
        }
      } catch (error) {
        // Silent fail for database save
      }
    }, 500);
  }, []);

  const savePreferences = useCallback((prefs: Preferences) => {
    savePreferencesToLocalStorage(prefs);
    savePreferencesToDatabase(prefs);
  }, [savePreferencesToLocalStorage, savePreferencesToDatabase]);

  const updatePreference = useCallback((updates: Partial<Preferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  const handleSaveAllPreferences = async () => {
    setIsSaving(true);
    try {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

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
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleManageTeam = () => {
    router.push("/dashboard/team");
  };

  const handleViewBilling = () => {
    router.push("/dashboard/settings/billing");
  };

  return {
    // State
    profile,
    setProfile,
    preferences,
    setPreferences,
    theme,
    isSaving,
    isResetting,

    // Actions
    updatePreference,
    handleSaveAllPreferences,
    handleRestartOnboarding,
    handleSaveProfile,
    handleThemeChange,
    handleManageTeam,
    handleViewBilling,
  };
}
