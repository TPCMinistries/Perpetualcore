"use client";

import { SidebarProvider, useSidebar } from "./SidebarProvider";
import { AdaptiveSidebar } from "./AdaptiveSidebar";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "../theme-toggle";
import { NotificationBell } from "../notifications/NotificationBell";
import { RoleSwitcher } from "../profile/RoleSwitcher";
import { SkipLink } from "../ui/accessibility";
import Link from "next/link";
import { Button } from "../ui/button";
import { PanelLeft, PanelLeftClose } from "lucide-react";

function DashboardLayoutInner({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: any;
}) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <SkipLink />

      {/* Sidebar */}
      <aside
        className={`hidden md:flex md:flex-col flex-shrink-0 relative z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${
          isCollapsed ? "md:w-16" : "md:w-64"
        }`}
        aria-label="Main navigation"
      >
        <AdaptiveSidebar profile={profile} isCollapsed={isCollapsed} />
      </aside>

      {/* Main Content */}
      <main id="main-content" className="flex-1 overflow-y-auto relative z-10" role="main">
        {/* Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm" role="banner">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden md:flex h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>

            {/* Mobile Menu Button */}
            {profile && <MobileNav userProfile={profile} />}

            {/* Brand on Mobile */}
            <Link href="/dashboard" className="md:hidden flex items-center space-x-2 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm shadow-sm">
                AI
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Perpetual Core</span>
            </Link>

            {/* Quick Search Hint - Desktop Only */}
            <div className="hidden lg:flex items-center gap-2">
              <kbd className="h-6 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 font-mono text-xs font-medium text-slate-600 dark:text-slate-400 hidden sm:inline-flex">
                <span>⌘K</span>
              </kbd>
              <span className="text-sm text-slate-600 dark:text-slate-400">Quick search</span>
            </div>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="User actions">
            <RoleSwitcher currentRole={profile?.user_role} />
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <div className="px-3 py-6 sm:px-4 md:px-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </>
  );
}

export function DashboardLayoutClient({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: any;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutInner profile={profile}>{children}</DashboardLayoutInner>
    </SidebarProvider>
  );
}
