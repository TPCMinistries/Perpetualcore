"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff } from "lucide-react";
import { Preferences } from "../hooks/useSettings";

interface PrivacySettingsProps {
  preferences: Preferences;
  onUpdatePreference: (updates: Partial<Preferences>) => void;
}

export function PrivacySettings({ preferences, onUpdatePreference }: PrivacySettingsProps) {
  return (
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
            onCheckedChange={(checked) => onUpdatePreference({ analyticsEnabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Usage Tracking</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Track feature usage and interactions</p>
          </div>
          <Switch
            checked={preferences.usageTracking}
            onCheckedChange={(checked) => onUpdatePreference({ usageTracking: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Error Reporting</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Automatically report errors to help fix bugs</p>
          </div>
          <Switch
            checked={preferences.errorReporting}
            onCheckedChange={(checked) => onUpdatePreference({ errorReporting: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Share Anonymous Data</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Share aggregated insights for research</p>
          </div>
          <Switch
            checked={preferences.shareAnonymousData}
            onCheckedChange={(checked) => onUpdatePreference({ shareAnonymousData: checked })}
          />
        </div>
      </div>
    </Card>
  );
}
