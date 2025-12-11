"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Mail,
  Laptop,
  FileText,
  Users,
  BarChart3,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Preferences } from "../hooks/useSettings";

interface NotificationSettingsProps {
  preferences: Preferences;
  onUpdatePreference: (updates: Partial<Preferences>) => void;
}

export function NotificationSettings({ preferences, onUpdatePreference }: NotificationSettingsProps) {
  return (
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
            onCheckedChange={(checked) => onUpdatePreference({ emailNotifications: checked })}
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
            onCheckedChange={(checked) => onUpdatePreference({ desktopNotifications: checked })}
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
            onCheckedChange={(checked) => onUpdatePreference({ documentUpdates: checked })}
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
            onCheckedChange={(checked) => onUpdatePreference({ teamActivity: checked })}
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
            onCheckedChange={(checked) => onUpdatePreference({ weeklyDigest: checked })}
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
            onCheckedChange={(checked) => onUpdatePreference({ soundEffects: checked })}
          />
        </div>
      </div>
    </Card>
  );
}
