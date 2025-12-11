"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Database, Wifi } from "lucide-react";
import { Preferences } from "../hooks/useSettings";

interface AISettingsProps {
  preferences: Preferences;
  onUpdatePreference: (updates: Partial<Preferences>) => void;
}

export function AISettings({ preferences, onUpdatePreference }: AISettingsProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white dark:text-slate-900" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">AI Settings</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Configure AI behavior and defaults</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">Default Model</Label>
            <Select value={preferences.defaultModel} onValueChange={(value) => onUpdatePreference({ defaultModel: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">Context Window</Label>
            <Select value={preferences.contextWindow} onValueChange={(value) => onUpdatePreference({ contextWindow: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (Recommended)</SelectItem>
                <SelectItem value="short">Short (4K tokens)</SelectItem>
                <SelectItem value="medium">Medium (8K tokens)</SelectItem>
                <SelectItem value="long">Long (16K tokens)</SelectItem>
                <SelectItem value="xl">Extra Long (32K tokens)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">Temperature: {preferences.temperature.toFixed(1)}</Label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {preferences.temperature < 0.3 ? "Focused" : preferences.temperature < 0.7 ? "Balanced" : "Creative"}
            </span>
          </div>
          <Slider
            value={[preferences.temperature]}
            onValueChange={([value]) => onUpdatePreference({ temperature: value })}
            min={0}
            max={1}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Lower values make output more focused and deterministic</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Enable RAG (Retrieval)</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Search uploaded documents for relevant context</p>
            </div>
          </div>
          <Switch
            checked={preferences.enableRAG}
            onCheckedChange={(checked) => onUpdatePreference({ enableRAG: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <Wifi className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Stream Responses</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Show AI responses as they're generated</p>
            </div>
          </div>
          <Switch
            checked={preferences.streamResponses}
            onCheckedChange={(checked) => onUpdatePreference({ streamResponses: checked })}
          />
        </div>
      </div>
    </Card>
  );
}
