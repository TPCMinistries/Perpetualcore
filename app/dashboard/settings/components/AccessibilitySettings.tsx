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
import { Accessibility } from "lucide-react";
import { Preferences } from "../hooks/useSettings";

interface AccessibilitySettingsProps {
  preferences: Preferences;
  onUpdatePreference: (updates: Partial<Preferences>) => void;
}

export function AccessibilitySettings({ preferences, onUpdatePreference }: AccessibilitySettingsProps) {
  return (
    <Card className="border-border dark:border-border bg-card shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-muted flex items-center justify-center">
          <Accessibility className="h-5 w-5 text-white dark:text-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground dark:text-white">Accessibility</h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Make the interface work better for you</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-foreground dark:text-muted-foreground font-medium">Font Size</Label>
          <Select value={preferences.fontSize} onValueChange={(value) => onUpdatePreference({ fontSize: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium (Default)</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="xl">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted/50 transition-colors">
          <div>
            <p className="font-medium text-foreground dark:text-white">Reduce Animations</p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Minimize motion effects</p>
          </div>
          <Switch
            checked={preferences.reduceAnimations}
            onCheckedChange={(checked) => onUpdatePreference({ reduceAnimations: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted/50 transition-colors">
          <div>
            <p className="font-medium text-foreground dark:text-white">High Contrast</p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Increase contrast for better visibility</p>
          </div>
          <Switch
            checked={preferences.highContrast}
            onCheckedChange={(checked) => onUpdatePreference({ highContrast: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted/50 transition-colors">
          <div>
            <p className="font-medium text-foreground dark:text-white">Screen Reader Optimized</p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Enhanced ARIA labels and navigation</p>
          </div>
          <Switch
            checked={preferences.screenReaderOptimized}
            onCheckedChange={(checked) => onUpdatePreference({ screenReaderOptimized: checked })}
          />
        </div>
      </div>
    </Card>
  );
}
