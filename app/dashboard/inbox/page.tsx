"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UnifiedInbox } from "@/components/inbox/UnifiedInbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBadge } from "@/components/ui/notification-badge";
import {
  Inbox,
  Mail,
  Bell,
  MessageSquare,
  AtSign,
  Star,
  Archive,
  Send,
  Filter,
  Settings,
  Sparkles,
} from "lucide-react";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [counts, setCounts] = useState({
    all: 0,
    emails: 0,
    notifications: 0,
    mentions: 0,
    starred: 0,
  });

  useEffect(() => {
    // Fetch counts
    async function fetchCounts() {
      try {
        const [emailsRes, notificationsRes] = await Promise.all([
          fetch("/api/inbox/emails"),
          fetch("/api/notifications"),
        ]);
        const emailsData = await emailsRes.json();
        const notificationsData = await notificationsRes.json();

        const emails = emailsData.emails || [];
        const notifications = notificationsData.notifications || [];

        setCounts({
          all: emails.filter((e: any) => !e.is_read).length + notifications.filter((n: any) => !n.is_read).length,
          emails: emails.filter((e: any) => !e.is_read).length,
          notifications: notifications.filter((n: any) => !n.is_read).length,
          mentions: 0,
          starred: emails.filter((e: any) => e.is_starred).length,
        });
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    }
    fetchCounts();
  }, []);

  const tabItems = [
    { id: "all", label: "All", icon: Inbox, count: counts.all },
    { id: "emails", label: "Emails", icon: Mail, count: counts.emails },
    { id: "notifications", label: "Notifications", icon: Bell, count: counts.notifications },
    { id: "mentions", label: "Mentions", icon: AtSign, count: counts.mentions },
    { id: "starred", label: "Starred", icon: Star, count: counts.starred },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto py-6 px-4 space-y-6"
    >
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl p-8 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center shadow-lg"
            >
              <Inbox className="h-7 w-7 text-white dark:text-slate-900" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-slate-900 dark:text-slate-100"
              >
                Unified Inbox
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-slate-600 dark:text-slate-400 mt-1"
              >
                All your messages and notifications in one place
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Sort
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 grid grid-cols-4 gap-4"
        >
          {[
            { label: "Unread", value: counts.all, icon: Mail, color: "text-blue-500" },
            { label: "Needs Reply", value: 3, icon: Send, color: "text-orange-500" },
            { label: "Starred", value: counts.starred, icon: Star, color: "text-yellow-500" },
            { label: "Archived Today", value: 12, icon: Archive, color: "text-slate-500" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl">
            {tabItems.map((tab, i) => (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                <TabsTrigger
                  value={tab.id}
                  className="relative gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm transition-all"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  <AnimatePresence>
                    {tab.count > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {tab.count}
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TabsTrigger>
              </motion.div>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <UnifiedInbox />
          </TabsContent>

          <TabsContent value="emails" className="mt-6">
            <UnifiedInbox />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationsPanel />
          </TabsContent>

          <TabsContent value="mentions" className="mt-6">
            <MentionsPanel />
          </TabsContent>

          <TabsContent value="starred" className="mt-6">
            <UnifiedInbox />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

// Notifications Panel Component
function NotificationsPanel() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="animate-pulse p-4 rounded-lg bg-slate-100 dark:bg-slate-800"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mt-2" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No notifications</h3>
        <p className="text-muted-foreground">You're all caught up!</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, i) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ x: 4 }}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              notification.is_read
                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                notification.is_read ? "bg-slate-100 dark:bg-slate-800" : "bg-blue-100 dark:bg-blue-900"
              }`}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${!notification.is_read && "font-medium"}`}>
                  {notification.title || notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Mentions Panel Component
function MentionsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <AtSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold">No mentions</h3>
      <p className="text-muted-foreground">When someone mentions you, it will appear here</p>
    </motion.div>
  );
}
