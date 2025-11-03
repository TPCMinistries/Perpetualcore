"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Download,
  Upload,
  Sparkles,
  Bell,
  ChevronRight,
  Database,
  Settings as SettingsIcon,
  Palette,
  Building2,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { resetOnboarding } from "@/lib/auth/actions";

export default function SettingsPage() {
  const [isResetting, setIsResetting] = useState(false);

  const handleRestartOnboarding = async () => {
    setIsResetting(true);
    try {
      // Clear localStorage onboarding data
      if (typeof window !== "undefined") {
        localStorage.removeItem("onboarding-completed");
        localStorage.removeItem("onboarding-step");
        localStorage.removeItem("onboarding-skipped");
      }

      // Also update database (may fail if columns don't exist yet)
      const result = await resetOnboarding();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Onboarding reset! Refresh the page to see the tour.");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      toast.error("Failed to reset onboarding");
    } finally {
      setIsResetting(false);
    }
  };

  const settingsSections = [
    {
      title: "Organization Settings",
      description: "Manage your organization and team defaults",
      icon: Building2,
      href: "/dashboard/settings/organization",
      color: "text-violet-500",
    },
    {
      title: "Appearance",
      description: "Customize the look and feel of your interface",
      icon: Palette,
      href: "/dashboard/settings/appearance",
      color: "text-fuchsia-500",
    },
    {
      title: "Notifications",
      description: "Manage how and when you receive notifications",
      icon: Bell,
      href: "/dashboard/settings/notifications",
      color: "text-amber-500",
    },
    {
      title: "Demo Mode",
      description: "Populate your account with sample data",
      icon: Database,
      href: "/dashboard/settings/demo-mode",
      color: "text-cyan-500",
    },
    {
      title: "Integrations",
      description: "Connect and manage third-party services",
      icon: Sparkles,
      href: "/dashboard/settings/integrations",
      color: "text-indigo-500",
    },
    {
      title: "Billing & Subscription",
      description: "Manage your subscription and billing information",
      icon: CreditCard,
      href: "/dashboard/settings/billing",
      color: "text-green-500",
    },
    {
      title: "Data Export",
      description: "Download a copy of your data",
      icon: Download,
      href: "/dashboard/settings/data-export",
      color: "text-orange-500",
    },
    {
      title: "Team Settings",
      description: "Manage team members and permissions",
      icon: Users,
      href: "/dashboard/settings/team",
      color: "text-blue-500",
    },
    {
      title: "Privacy",
      description: "Control your privacy and data preferences",
      icon: Shield,
      href: "/dashboard/settings/privacy",
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
            <SettingsIcon className="h-6 w-6 text-white dark:text-slate-900" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Settings
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Onboarding Section */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1 text-slate-900 dark:text-slate-100">Product Tour</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Restart the interactive onboarding tour to learn about Perpetual Core
                features
              </p>
            </div>
          </div>
          <Button
            onClick={handleRestartOnboarding}
            disabled={isResetting}
            className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Restart Tour
          </Button>
        </div>
      </Card>

      {/* Settings Sections */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Settings Sections</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {settingsSections.map((section) => {
            // Map icon colors to pastel background colors
            const iconBgMap: Record<string, string> = {
              "text-violet-500": "bg-violet-50 dark:bg-violet-950/30",
              "text-fuchsia-500": "bg-fuchsia-50 dark:bg-fuchsia-950/30",
              "text-amber-500": "bg-amber-50 dark:bg-amber-950/30",
              "text-cyan-500": "bg-cyan-50 dark:bg-cyan-950/30",
              "text-indigo-500": "bg-indigo-50 dark:bg-indigo-950/30",
              "text-green-500": "bg-green-50 dark:bg-green-950/30",
              "text-orange-500": "bg-orange-50 dark:bg-orange-950/30",
              "text-blue-500": "bg-blue-50 dark:bg-blue-950/30",
              "text-red-500": "bg-red-50 dark:bg-red-950/30",
            };

            const iconBg = iconBgMap[section.color] || "bg-slate-50 dark:bg-slate-950/30";

            return (
              <Link key={section.href} href={section.href}>
                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${iconBg}`}>
                        <section.icon className={`h-6 w-6 ${section.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 text-slate-900 dark:text-slate-100">{section.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-600" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
