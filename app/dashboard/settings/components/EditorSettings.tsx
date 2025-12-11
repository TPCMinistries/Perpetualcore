"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Code2, Save, Braces, AlignLeft } from "lucide-react";
import { Preferences } from "../hooks/useSettings";

interface EditorSettingsProps {
  preferences: Preferences;
  onUpdatePreference: (updates: Partial<Preferences>) => void;
}

export function EditorSettings({ preferences, onUpdatePreference }: EditorSettingsProps) {
  return (
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
            onCheckedChange={(checked) => onUpdatePreference({ autoSave: checked })}
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
            onCheckedChange={(checked) => onUpdatePreference({ syntaxHighlighting: checked })}
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
            onCheckedChange={(checked) => onUpdatePreference({ lineNumbers: checked })}
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
            onCheckedChange={(checked) => onUpdatePreference({ wordWrap: checked })}
          />
        </div>
      </div>
    </Card>
  );
}
