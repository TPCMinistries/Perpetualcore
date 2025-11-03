"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  Volume2,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NotificationSettings {
  // Email Notifications
  email_enabled: boolean;
  email_frequency: "realtime" | "hourly" | "daily" | "weekly";
  email_marketing: boolean;

  // Push Notifications
  push_enabled: boolean;
  push_mentions: boolean;
  push_comments: boolean;
  push_updates: boolean;

  // Activity Notifications
  notify_task_assigned: boolean;
  notify_task_completed: boolean;
  notify_meeting_reminder: boolean;
  notify_workflow_complete: boolean;
  notify_agent_response: boolean;

  // Team Notifications
  notify_team_invite: boolean;
  notify_team_mention: boolean;
  notify_team_message: boolean;

  // System Notifications
  notify_security_alerts: boolean;
  notify_system_updates: boolean;
  notify_billing_updates: boolean;

  // Preferences
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export default function NotificationsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    email_frequency: "realtime",
    email_marketing: false,
    push_enabled: true,
    push_mentions: true,
    push_comments: true,
    push_updates: false,
    notify_task_assigned: true,
    notify_task_completed: true,
    notify_meeting_reminder: true,
    notify_workflow_complete: true,
    notify_agent_response: true,
    notify_team_invite: true,
    notify_team_mention: true,
    notify_team_message: true,
    notify_security_alerts: true,
    notify_system_updates: true,
    notify_billing_updates: true,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
      toast.error("Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("notification_settings")
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Notification settings saved successfully");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: keyof NotificationSettings, value: any) {
    setSettings({ ...settings, [key]: value });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/20 dark:via-amber-950/20 dark:to-orange-950/20 border border-yellow-100 dark:border-yellow-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Bell className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-900 via-amber-800 to-orange-900 dark:from-yellow-100 dark:via-amber-100 dark:to-orange-100 bg-clip-text text-transparent">
              Notification Settings
            </h1>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              Manage how and when you receive notifications
            </p>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure email notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={settings.email_enabled}
              onCheckedChange={(checked) => updateSetting("email_enabled", checked)}
            />
          </div>

          {settings.email_enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email-frequency">Email Frequency</Label>
                <Select
                  value={settings.email_frequency}
                  onValueChange={(value) => updateSetting("email_frequency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time (immediate)</SelectItem>
                    <SelectItem value="hourly">Hourly digest</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="email-marketing">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive product updates and newsletters
                  </p>
                </div>
                <Switch
                  id="email-marketing"
                  checked={settings.email_marketing}
                  onCheckedChange={(checked) => updateSetting("email_marketing", checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Browser and mobile push notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-enabled">Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show browser notifications
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={settings.push_enabled}
              onCheckedChange={(checked) => updateSetting("push_enabled", checked)}
            />
          </div>

          {settings.push_enabled && (
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-mentions">Mentions</Label>
                <Switch
                  id="push-mentions"
                  checked={settings.push_mentions}
                  onCheckedChange={(checked) => updateSetting("push_mentions", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-comments">Comments</Label>
                <Switch
                  id="push-comments"
                  checked={settings.push_comments}
                  onCheckedChange={(checked) => updateSetting("push_comments", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-updates">Product Updates</Label>
                <Switch
                  id="push-updates"
                  checked={settings.push_updates}
                  onCheckedChange={(checked) => updateSetting("push_updates", checked)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Activity Notifications
          </CardTitle>
          <CardDescription>
            Notifications for tasks, meetings, and workflows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-task-assigned">Task Assigned to Me</Label>
            <Switch
              id="notify-task-assigned"
              checked={settings.notify_task_assigned}
              onCheckedChange={(checked) => updateSetting("notify_task_assigned", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-task-completed">Task Completed</Label>
            <Switch
              id="notify-task-completed"
              checked={settings.notify_task_completed}
              onCheckedChange={(checked) => updateSetting("notify_task_completed", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-meeting-reminder">Meeting Reminders</Label>
            <Switch
              id="notify-meeting-reminder"
              checked={settings.notify_meeting_reminder}
              onCheckedChange={(checked) => updateSetting("notify_meeting_reminder", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-workflow-complete">Workflow Completed</Label>
            <Switch
              id="notify-workflow-complete"
              checked={settings.notify_workflow_complete}
              onCheckedChange={(checked) => updateSetting("notify_workflow_complete", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-agent-response">AI Agent Responses</Label>
            <Switch
              id="notify-agent-response"
              checked={settings.notify_agent_response}
              onCheckedChange={(checked) => updateSetting("notify_agent_response", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Team Notifications
          </CardTitle>
          <CardDescription>
            Notifications from team members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-team-invite">Team Invitations</Label>
            <Switch
              id="notify-team-invite"
              checked={settings.notify_team_invite}
              onCheckedChange={(checked) => updateSetting("notify_team_invite", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-team-mention">@Mentions</Label>
            <Switch
              id="notify-team-mention"
              checked={settings.notify_team_mention}
              onCheckedChange={(checked) => updateSetting("notify_team_mention", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-team-message">Direct Messages</Label>
            <Switch
              id="notify-team-message"
              checked={settings.notify_team_message}
              onCheckedChange={(checked) => updateSetting("notify_team_message", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            System Notifications
          </CardTitle>
          <CardDescription>
            Important system and account updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-security-alerts">Security Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Important security notifications (recommended)
              </p>
            </div>
            <Switch
              id="notify-security-alerts"
              checked={settings.notify_security_alerts}
              onCheckedChange={(checked) => updateSetting("notify_security_alerts", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-system-updates">System Updates</Label>
            <Switch
              id="notify-system-updates"
              checked={settings.notify_system_updates}
              onCheckedChange={(checked) => updateSetting("notify_system_updates", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-billing-updates">Billing & Payment Updates</Label>
            <Switch
              id="notify-billing-updates"
              checked={settings.notify_billing_updates}
              onCheckedChange={(checked) => updateSetting("notify_billing_updates", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Pause non-urgent notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours-enabled">Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Mute notifications during your quiet hours
              </p>
            </div>
            <Switch
              id="quiet-hours-enabled"
              checked={settings.quiet_hours_enabled}
              onCheckedChange={(checked) => updateSetting("quiet_hours_enabled", checked)}
            />
          </div>

          {settings.quiet_hours_enabled && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="quiet-hours-start">Start Time</Label>
                <input
                  id="quiet-hours-start"
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) => updateSetting("quiet_hours_start", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-hours-end">End Time</Label>
                <input
                  id="quiet-hours-end"
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => updateSetting("quiet_hours_end", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
