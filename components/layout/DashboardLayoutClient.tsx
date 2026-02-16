"use client";

import { SidebarProvider, useSidebar } from "./SidebarProvider";
import { AdaptiveSidebar } from "./AdaptiveSidebar";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "../theme-toggle";
import { NotificationBell } from "../notifications/NotificationBell";
import { RoleSwitcher } from "../profile/RoleSwitcher";
import { SkipLink } from "../ui/accessibility";
import { WorkspaceProvider, useWorkspace } from "../workspaces/WorkspaceProvider";
import { AIAssistantProvider, FloatingAIAssistant, AIAssistantTrigger } from "../ai-assistant";
import { AIContextButton } from "../ai/AIContextButton";
import { EntityProvider } from "../entities/EntityProvider";
import { EntitySwitcherCompact } from "../entities/EntitySwitcher";
import { KeyboardShortcuts } from "../ui/keyboard-shortcuts";
import Link from "next/link";
import { Button } from "../ui/button";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { Breadcrumb } from "../ui/breadcrumb";

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
        className={`hidden md:flex md:flex-col flex-shrink-0 relative z-10 transition-all duration-300 ${
          isCollapsed ? "md:w-16" : "md:w-64"
        }`}
        style={{
          boxShadow: "2px 0 20px -2px rgba(0, 0, 0, 0.15), 4px 0 40px -4px rgba(139, 92, 246, 0.06)",
        }}
        aria-label="Main navigation"
      >
        <AdaptiveSidebar profile={profile} isCollapsed={isCollapsed} />
      </aside>

      {/* Main Content */}
      <main id="main-content" className="flex-1 overflow-y-auto relative z-10" role="main">
        {/* Header Bar - Glass effect */}
        <header className="sticky top-0 z-20 bg-white/60 dark:bg-[#150e2e]/70 backdrop-blur-2xl px-4 sm:px-6 py-3 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06]" role="banner">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-foreground"
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

            {/* Brand on Mobile - Gradient logo */}
            <Link href="/dashboard" className="md:hidden flex items-center space-x-2 group">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
                AI
              </div>
              <span className="font-semibold text-gradient text-sm">Perpetual Core</span>
            </Link>

            {/* Quick Search Hint - Spotlight style */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-muted/60 backdrop-blur-sm px-3 py-1.5">
                <kbd className="select-none font-mono text-xs font-medium text-muted-foreground">
                  <span>⌘K</span>
                </kbd>
                <span className="text-sm text-muted-foreground">Search</span>
              </div>
            </div>

            {/* Entity Switcher */}
            <div className="hidden md:block border-l border-border/40 pl-3 ml-2">
              <EntitySwitcherCompact />
            </div>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="User actions">
            <RoleSwitcher currentRole={profile?.user_role} />
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <Breadcrumb />
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
    <EntityProvider>
      <WorkspaceProvider>
        <AIAssistantProvider>
          <SidebarProvider>
            <DashboardLayoutInner profile={profile}>{children}</DashboardLayoutInner>
            {/* Floating AI Assistant */}
            <FloatingAIAssistant />
            <AIAssistantTrigger />
            {/* Contextual AI Button - ⌘K */}
            <AIContextButton floating position="bottom-right" />
            {/* Keyboard Shortcuts Overlay - ? */}
            <KeyboardShortcuts />
          </SidebarProvider>
        </AIAssistantProvider>
      </WorkspaceProvider>
    </EntityProvider>
  );
}
