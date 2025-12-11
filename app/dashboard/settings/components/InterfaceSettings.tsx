"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layout, Grid, List } from "lucide-react";
import { Preferences } from "../hooks/useSettings";

interface InterfaceSettingsProps {
  preferences: Preferences;
  onUpdatePreference: (updates: Partial<Preferences>) => void;
}

export function InterfaceSettings({ preferences, onUpdatePreference }: InterfaceSettingsProps) {
  return (
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
            <Select value={preferences.defaultView} onValueChange={(value) => onUpdatePreference({ defaultView: value })}>
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
            <Select value={preferences.sidebarPosition} onValueChange={(value) => onUpdatePreference({ sidebarPosition: value })}>
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
            onCheckedChange={(checked) => onUpdatePreference({ showTooltips: checked })}
          />
        </div>
      </div>
    </Card>
  );
}
