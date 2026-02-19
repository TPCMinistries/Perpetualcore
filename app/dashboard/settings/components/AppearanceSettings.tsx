"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Palette, Sun, Moon, Monitor } from "lucide-react";
import { Preferences } from "../hooks/useSettings";

interface AppearanceSettingsProps {
  theme: "light" | "dark" | "system";
  preferences: Preferences;
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  onUpdatePreference: (updates: Partial<Preferences>) => void;
}

export function AppearanceSettings({
  theme,
  preferences,
  onThemeChange,
  onUpdatePreference,
}: AppearanceSettingsProps) {
  return (
    <Card className="border-border dark:border-border bg-card shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-muted flex items-center justify-center">
          <Palette className="h-5 w-5 text-white dark:text-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground dark:text-white">Appearance</h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Customize how Perpetual Core looks</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-foreground dark:text-muted-foreground font-medium mb-3 block">Theme</Label>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => onThemeChange("light")}
              className={`p-6 rounded-xl border-2 transition-all ${
                theme === "light"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg"
                  : "border-border dark:border-border hover:border-border dark:hover:border-border"
              }`}
            >
              <Sun className={`h-8 w-8 mx-auto mb-3 ${theme === "light" ? "text-blue-500" : "text-muted-foreground"}`} />
              <p className={`font-medium text-center ${theme === "light" ? "text-blue-700 dark:text-blue-400" : "text-muted-foreground dark:text-muted-foreground"}`}>
                Light
              </p>
            </button>
            <button
              onClick={() => onThemeChange("dark")}
              className={`p-6 rounded-xl border-2 transition-all ${
                theme === "dark"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg"
                  : "border-border dark:border-border hover:border-border dark:hover:border-border"
              }`}
            >
              <Moon className={`h-8 w-8 mx-auto mb-3 ${theme === "dark" ? "text-blue-500" : "text-muted-foreground"}`} />
              <p className={`font-medium text-center ${theme === "dark" ? "text-blue-700 dark:text-blue-400" : "text-muted-foreground dark:text-muted-foreground"}`}>
                Dark
              </p>
            </button>
            <button
              onClick={() => onThemeChange("system")}
              className={`p-6 rounded-xl border-2 transition-all ${
                theme === "system"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg"
                  : "border-border dark:border-border hover:border-border dark:hover:border-border"
              }`}
            >
              <Monitor className={`h-8 w-8 mx-auto mb-3 ${theme === "system" ? "text-blue-500" : "text-muted-foreground"}`} />
              <p className={`font-medium text-center ${theme === "system" ? "text-blue-700 dark:text-blue-400" : "text-muted-foreground dark:text-muted-foreground"}`}>
                System
              </p>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted/50 transition-colors">
          <div>
            <p className="font-medium text-foreground dark:text-white">Compact Mode</p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Reduce spacing for denser interface</p>
          </div>
          <Switch
            checked={preferences.compactMode}
            onCheckedChange={(checked) => onUpdatePreference({ compactMode: checked })}
          />
        </div>
      </div>
    </Card>
  );
}
