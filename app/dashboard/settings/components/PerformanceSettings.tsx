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
    <Card className="border-border dark:border-border bg-card shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-muted flex items-center justify-center">
          <Gauge className="h-5 w-5 text-white dark:text-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground dark:text-white">Performance</h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Optimize speed and resource usage</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="font-medium text-foreground dark:text-white">Enable Cache</p>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">Cache data locally for faster loading</p>
            </div>
          </div>
          <Switch
            checked={preferences.enableCache}
            onCheckedChange={(checked) => onUpdatePreference({ enableCache: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium text-foreground dark:text-white">Preload Documents</p>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">Load recently used documents in background</p>
            </div>
          </div>
          <Switch
            checked={preferences.preloadDocuments}
            onCheckedChange={(checked) => onUpdatePreference({ preloadDocuments: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium text-foreground dark:text-white">Lazy Load Images</p>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">Load images only when visible</p>
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
