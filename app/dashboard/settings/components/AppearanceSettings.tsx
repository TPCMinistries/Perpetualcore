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
              onClick={() => onThemeChange("light")}
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
              onClick={() => onThemeChange("dark")}
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
              onClick={() => onThemeChange("system")}
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
            onCheckedChange={(checked) => onUpdatePreference({ compactMode: checked })}
          />
        </div>
      </div>
    </Card>
  );
}
