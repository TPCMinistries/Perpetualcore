"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Trash2,
  Settings,
  AlertCircle,
  Calendar,
  Mail,
  FileText,
  MessageCircle,
  Zap,
  Loader2,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  priority: string;
  status: string;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  ai_priority_score: number | null;
  ai_urgency_reason: string | null;
  created_at: string;
  read_at: string | null;
}

const NOTIFICATION_ICONS: Record<string, any> = {
  task_due: Clock,
  task_assigned: CheckCheck,
  email_important: Mail,
  email_mention: Mail,
  calendar_event: Calendar,
  calendar_reminder: Calendar,
  document_shared: FileText,
  document_comment: FileText,
  whatsapp_message: MessageCircle,
  system_alert: AlertCircle,
  ai_insight: Zap,
  usage_limit: AlertCircle,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400",
  medium: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
  high: "text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400",
  urgent: "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("unread");

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?status=${filter}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", notificationId }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const snoozeNotification = async (notificationId: string, duration: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "snooze", notificationId, duration }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to snooze:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center relative">
              <Bell className="h-6 w-6 text-white dark:text-slate-900" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up!"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="border-slate-200 dark:border-slate-800"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
            <Link href="/dashboard/notifications/settings">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 dark:border-slate-800"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{notifications.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
              <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Unread</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{unreadCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">AI Prioritized</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {notifications.filter((n) => n.ai_priority_score && n.ai_priority_score > 7).length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Read</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {notifications.filter((n) => n.status === "read").length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
        >
          All
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
          className={filter === "unread" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filter === "read" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("read")}
          className={filter === "read" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
        >
          Read
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No notifications</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filter === "unread"
                ? "You're all caught up! No unread notifications."
                : "No notifications to show."}
            </p>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
            const priorityClass = PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.medium;
            const isUnread = notification.status === "unread";

            return (
              <Card
                key={notification.id}
                className={`relative p-5 transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg ${
                  isUnread
                    ? "border-l-4 border-l-slate-900 dark:border-l-slate-100"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon with gradient background */}
                  <div className={`p-3 rounded-xl shadow-sm ${priorityClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={`font-semibold text-base ${
                        isUnread
                          ? "text-slate-900 dark:text-slate-100"
                          : "text-slate-600 dark:text-slate-400"
                      }`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {notification.ai_priority_score && notification.ai_priority_score > 7 && (
                          <div className="h-6 w-6 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center" title={`AI Priority: ${notification.ai_priority_score}/10`}>
                            <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                    </div>

                    <p className={`text-sm mb-3 ${
                      isUnread
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-500 dark:text-slate-400"
                    }`}>
                      {notification.message}
                    </p>

                    {/* AI Urgency Reason */}
                    {notification.ai_urgency_reason && (
                      <div className="flex items-start gap-2 text-xs bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-3">
                        <div className="h-5 w-5 rounded-md bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                          <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-purple-900 dark:text-purple-100 mb-1">AI Insight</p>
                          <p className="text-purple-700 dark:text-purple-300">{notification.ai_urgency_reason}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {notification.action_url && (
                        <Link href={notification.action_url}>
                          <Button
                            size="sm"
                            className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                            onClick={() => isUnread && markAsRead(notification.id)}
                          >
                            {notification.action_label || "View"}
                          </Button>
                        </Link>
                      )}

                      {isUnread && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/20"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark read
                          </Button>

                          <div className="relative group">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Snooze
                            </Button>
                            <div className="hidden group-hover:block absolute left-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-10 min-w-[140px]">
                              <button
                                onClick={() => snoozeNotification(notification.id, "1h")}
                                className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                1 hour
                              </button>
                              <button
                                onClick={() => snoozeNotification(notification.id, "3h")}
                                className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                3 hours
                              </button>
                              <button
                                onClick={() => snoozeNotification(notification.id, "1d")}
                                className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                1 day
                              </button>
                              <button
                                onClick={() => snoozeNotification(notification.id, "1w")}
                                className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                1 week
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
