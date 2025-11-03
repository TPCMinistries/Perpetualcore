"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Type,
  Loader2,
  Eye,
  Zap,
  Layout,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";

interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  fontFamily: "default" | "sans" | "serif" | "mono";
  accentColor: "blue" | "purple" | "green" | "orange" | "pink";
  reducedMotion: boolean;
  compactMode: boolean;
  showAvatars: boolean;
  sidebarCollapsed: boolean;
}

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: "system",
    fontSize: "medium",
    fontFamily: "default",
    accentColor: "blue",
    reducedMotion: false,
    compactMode: false,
    showAvatars: true,
    sidebarCollapsed: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const saved = localStorage.getItem("appearance_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);

        // Apply theme
        if (parsed.theme) {
          setTheme(parsed.theme);
        }

        // Apply font size
        document.documentElement.setAttribute("data-font-size", parsed.fontSize || "medium");

        // Apply accent color
        document.documentElement.setAttribute("data-accent", parsed.accentColor || "blue");
      }
    } catch (error) {
      console.error("Error loading appearance settings:", error);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem("appearance_settings", JSON.stringify(settings));

      // Apply theme
      setTheme(settings.theme);

      // Apply font size
      document.documentElement.setAttribute("data-font-size", settings.fontSize);

      // Apply font family
      document.documentElement.setAttribute("data-font-family", settings.fontFamily);

      // Apply accent color
      document.documentElement.setAttribute("data-accent", settings.accentColor);

      // Apply reduced motion
      if (settings.reducedMotion) {
        document.documentElement.classList.add("reduce-motion");
      } else {
        document.documentElement.classList.remove("reduce-motion");
      }

      toast.success("Appearance settings saved successfully");
    } catch (error) {
      console.error("Error saving appearance settings:", error);
      toast.error("Failed to save appearance settings");
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: keyof AppearanceSettings, value: any) {
    setSettings({ ...settings, [key]: value });
  }

  const accentColors = [
    { value: "blue", label: "Blue", color: "bg-blue-500" },
    { value: "purple", label: "Purple", color: "bg-purple-500" },
    { value: "green", label: "Green", color: "bg-green-500" },
    { value: "orange", label: "Orange", color: "bg-orange-500" },
    { value: "pink", label: "Pink", color: "bg-pink-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950/20 dark:via-fuchsia-950/20 dark:to-pink-950/20 border border-purple-100 dark:border-purple-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Palette className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-900 via-fuchsia-800 to-pink-900 dark:from-purple-100 dark:via-fuchsia-100 dark:to-pink-100 bg-clip-text text-transparent">
              Appearance Settings
            </h1>
            <p className="text-purple-700 dark:text-purple-300 mt-1">
              Customize how Perpetual Core looks and feels
            </p>
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.theme}
            onValueChange={(value: any) => updateSetting("theme", value)}
            className="grid grid-cols-3 gap-4"
          >
            <Label
              htmlFor="theme-light"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="light" id="theme-light" className="sr-only" />
              <Sun className="mb-3 h-6 w-6" />
              <span className="font-medium">Light</span>
            </Label>

            <Label
              htmlFor="theme-dark"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
              <Moon className="mb-3 h-6 w-6" />
              <span className="font-medium">Dark</span>
            </Label>

            <Label
              htmlFor="theme-system"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="system" id="theme-system" className="sr-only" />
              <Monitor className="mb-3 h-6 w-6" />
              <span className="font-medium">System</span>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Accent Color
          </CardTitle>
          <CardDescription>
            Choose your primary accent color
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.accentColor}
            onValueChange={(value: any) => updateSetting("accentColor", value)}
            className="grid grid-cols-5 gap-4"
          >
            {accentColors.map((color) => (
              <Label
                key={color.value}
                htmlFor={`accent-${color.value}`}
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value={color.value} id={`accent-${color.value}`} className="sr-only" />
                <div className={`h-8 w-8 rounded-full ${color.color} mb-2`} />
                <span className="text-sm font-medium">{color.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography
          </CardTitle>
          <CardDescription>
            Adjust text size and font family
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <Select
              value={settings.fontSize}
              onValueChange={(value: any) => updateSetting("fontSize", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium (Default)</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Select
              value={settings.fontFamily}
              onValueChange={(value: any) => updateSetting("fontFamily", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Inter)</SelectItem>
                <SelectItem value="sans">Sans Serif</SelectItem>
                <SelectItem value="serif">Serif</SelectItem>
                <SelectItem value="mono">Monospace</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Display Options
          </CardTitle>
          <CardDescription>
            Customize the layout and interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing for more content density
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={settings.compactMode}
              onCheckedChange={(checked) => updateSetting("compactMode", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-avatars">Show Avatars</Label>
              <p className="text-sm text-muted-foreground">
                Display user profile pictures
              </p>
            </div>
            <Switch
              id="show-avatars"
              checked={settings.showAvatars}
              onCheckedChange={(checked) => updateSetting("showAvatars", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sidebar-collapsed">Collapsed Sidebar</Label>
              <p className="text-sm text-muted-foreground">
                Start with sidebar collapsed by default
              </p>
            </div>
            <Switch
              id="sidebar-collapsed"
              checked={settings.sidebarCollapsed}
              onCheckedChange={(checked) => updateSetting("sidebarCollapsed", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibility
          </CardTitle>
          <CardDescription>
            Options to improve accessibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduced-motion">Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              id="reduced-motion"
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => updateSetting("reducedMotion", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your changes will look
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                AI
              </div>
              <div>
                <p className="font-medium">Welcome to Perpetual Core Platform</p>
                <p className="text-sm text-muted-foreground">This is how your interface will appear</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm">Sample paragraph text to preview typography settings.</p>
              <Button size="sm" className="mt-2">Sample Button</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Palette className="mr-2 h-4 w-4" />
              Save Appearance
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
