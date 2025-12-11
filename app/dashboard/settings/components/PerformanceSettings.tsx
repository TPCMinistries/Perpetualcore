"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Gauge, HardDrive, FileText, Camera } from "lucide-react";
import { Preferences } from "../hooks/useSettings";

interface PerformanceSettingsProps {
  preferences: Preferences;
  onUpdatePreference: (updates: Partial<Preferences>) => void;
}

export function PerformanceSettings({ preferences, onUpdatePreference }: PerformanceSettingsProps) {
  return (
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
            onCheckedChange={(checked) => onUpdatePreference({ enableCache: checked })}
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
            onCheckedChange={(checked) => onUpdatePreference({ preloadDocuments: checked })}
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
            onCheckedChange={(checked) => onUpdatePreference({ lazyLoadImages: checked })}
          />
        </div>
      </div>
    </Card>
  );
}
