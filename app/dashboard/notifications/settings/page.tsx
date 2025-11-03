"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

interface NotificationPreferences {
  notify_task_due: boolean;
  notify_task_assigned: boolean;
  notify_email_important: boolean;
  notify_email_mention: boolean;
  notify_calendar_event: boolean;
  notify_calendar_reminder: boolean;
  notify_document_shared: boolean;
  notify_document_comment: boolean;
  notify_whatsapp_message: boolean;
  notify_system_alert: boolean;
  notify_ai_insight: boolean;
  notify_usage_limit: boolean;
  channel_in_app: boolean;
  channel_email: boolean;
  channel_whatsapp: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  digest_enabled: boolean;
  digest_frequency: "daily" | "weekly";
  digest_time: string;
}

const NOTIFICATION_TYPES = [
  { key: "notify_task_due", label: "Task Due", description: "When a task deadline is approaching" },
  { key: "notify_task_assigned", label: "Task Assigned", description: "When you're assigned a new task" },
  { key: "notify_email_important", label: "Important Emails", description: "When you receive an important email" },
  { key: "notify_email_mention", label: "Email Mentions", description: "When you're mentioned in an email" },
  { key: "notify_calendar_event", label: "Calendar Events", description: "When a calendar event is created or updated" },
  { key: "notify_calendar_reminder", label: "Calendar Reminders", description: "Reminders before calendar events" },
  { key: "notify_document_shared", label: "Document Shared", description: "When a document is shared with you" },
  { key: "notify_document_comment", label: "Document Comments", description: "When someone comments on your document" },
  { key: "notify_whatsapp_message", label: "WhatsApp Messages", description: "When you receive a WhatsApp message" },
  { key: "notify_system_alert", label: "System Alerts", description: "Important system notifications" },
  { key: "notify_ai_insight", label: "AI Insights", description: "When AI generates an insight for you" },
  { key: "notify_usage_limit", label: "Usage Limits", description: "When approaching usage limits" },
] as const;

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notify_task_due: true,
    notify_task_assigned: true,
    notify_email_important: true,
    notify_email_mention: true,
    notify_calendar_event: true,
    notify_calendar_reminder: true,
    notify_document_shared: true,
    notify_document_comment: true,
    notify_whatsapp_message: true,
    notify_system_alert: true,
    notify_ai_insight: true,
    notify_usage_limit: true,
    channel_in_app: true,
    channel_email: true,
    channel_whatsapp: false,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    digest_enabled: false,
    digest_frequency: "daily",
    digest_time: "08:00",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences({ ...preferences, ...data.preferences });
        }
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/notifications">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notifications
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-gray-600 mt-2">
          Customize how and when you receive notifications
        </p>
      </div>

      {/* Notification Types */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Notification Types</h2>
        <p className="text-sm text-gray-600 mb-6">
          Choose which types of notifications you want to receive
        </p>

        <div className="space-y-4">
          {NOTIFICATION_TYPES.map((type) => (
            <div key={type.key} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <div>
                <p className="font-medium">{type.label}</p>
                <p className="text-sm text-gray-600">{type.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences[type.key as keyof NotificationPreferences] as boolean}
                  onChange={() => togglePreference(type.key as keyof NotificationPreferences)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Delivery Channels */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Channels</h2>
        <p className="text-sm text-gray-600 mb-6">
          Choose how you want to receive notifications
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">In-App Notifications</p>
              <p className="text-sm text-gray-600">Receive notifications in the application</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.channel_in_app}
                onChange={() => togglePreference("channel_in_app")}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.channel_email}
                onChange={() => togglePreference("channel_email")}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">WhatsApp Notifications</p>
              <p className="text-sm text-gray-600">Receive urgent notifications via WhatsApp</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.channel_whatsapp}
                onChange={() => togglePreference("channel_whatsapp")}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quiet Hours</h2>
        <p className="text-sm text-gray-600 mb-6">
          Mute non-urgent notifications during specific hours
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Enable Quiet Hours</p>
              <p className="text-sm text-gray-600">Automatically snooze non-urgent notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.quiet_hours_enabled}
                onChange={() => togglePreference("quiet_hours_enabled")}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => updatePreference("quiet_hours_start", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => updatePreference("quiet_hours_end", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Digest Settings */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Notification Digest</h2>
        <p className="text-sm text-gray-600 mb-6">
          Receive a summary of notifications instead of individual alerts
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Enable Digest</p>
              <p className="text-sm text-gray-600">Group notifications into a daily or weekly summary</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.digest_enabled}
                onChange={() => togglePreference("digest_enabled")}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.digest_enabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium mb-2">Frequency</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={preferences.digest_frequency}
                  onChange={(e) => updatePreference("digest_frequency", e.target.value as "daily" | "weekly")}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={preferences.digest_time}
                  onChange={(e) => updatePreference("digest_time", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={savePreferences}
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
