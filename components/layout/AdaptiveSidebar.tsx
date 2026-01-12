"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { ExperienceLevelToggle, useExperienceLevel } from "@/components/experience-level/ExperienceLevelToggle";
import { DashboardModeToggle } from "@/components/dashboard/DashboardModeToggle";
import { getFilteredNavigationV2, NavigationSection } from "@/config/navigation";
import { UserExperienceLevel } from "@/types/user-experience";
import { useWorkspace } from "@/components/workspaces/WorkspaceProvider";
import { WorkspaceSwitcher } from "@/components/workspaces/WorkspaceSwitcher";
import { cn } from "@/lib/utils";

interface AdaptiveSidebarProps {
  profile: {
    organization?: {
      name: string;
    };
    is_super_admin?: boolean;
  } | null;
  isCollapsed: boolean;
}

export function AdaptiveSidebar({ profile, isCollapsed }: AdaptiveSidebarProps) {
  const experienceLevel = useExperienceLevel();
  const pathname = usePathname();
  const [navigation, setNavigation] = useState<NavigationSection[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { currentWorkspace, isItemVisible, isSectionVisible, isSectionPrioritized } = useWorkspace();

  useEffect(() => {
    // Update navigation when experience level changes
    // Use the new V2 navigation config
    const filteredNav = getFilteredNavigationV2(experienceLevel);
    setNavigation(filteredNav);

    // Initialize collapsed sections based on defaultCollapsed
    const initialCollapsed: Record<string, boolean> = {};
    filteredNav.forEach(section => {
      if (section.collapsible) {
        initialCollapsed[section.section] = section.defaultCollapsed ?? false;
      }
    });
    setCollapsedSections(initialCollapsed);
  }, [experienceLevel]);

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const isActive = (href: string) => {
    if (href === "/dashboard/home" && pathname === "/dashboard") {
      return true;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Filter navigation based on workspace
  const filteredNavigation = navigation
    .filter(section => isSectionVisible(section.section))
    .map(section => ({
      ...section,
      items: section.items.filter(item => isItemVisible(item.name)),
      isPrioritized: isSectionPrioritized(section.section),
    }))
    .filter(section => section.items.length > 0);

  // Sort to show prioritized sections first
  const sortedNavigation = [...filteredNavigation].sort((a, b) => {
    if (a.isPrioritized && !b.isPrioritized) return -1;
    if (!a.isPrioritized && b.isPrioritized) return 1;
    return 0;
  });

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-slate-900">
      {/* Logo/Brand */}
      <div className={`border-b border-slate-200 dark:border-slate-800 py-4 ${isCollapsed ? "px-2" : "px-6"}`}>
        <Link href="/dashboard/home" className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-2"}`}>
          <div className="h-8 w-8 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center font-bold text-white dark:text-slate-900">
            AI
          </div>
          {!isCollapsed && <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">Perpetual Core</span>}
        </Link>
      </div>

      {/* Workspace Switcher */}
      <div className={cn(
        "border-b border-slate-200 dark:border-slate-800",
        isCollapsed ? "px-2 py-2" : "px-3 py-3"
      )}>
        <WorkspaceSwitcher collapsed={isCollapsed} />
      </div>

      {/* Experience Level & Dashboard Mode Toggle (only when expanded) */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <DashboardModeToggle className="w-full justify-between" />
          <ExperienceLevelToggle />
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 py-4 overflow-y-auto ${isCollapsed ? "px-1" : "px-3"}`}>
        {sortedNavigation.map((group, groupIndex) => {
          const isSectionCollapsed = group.collapsible && collapsedSections[group.section];

          return (
            <div
              key={group.section || `section-${groupIndex}`}
              className={cn(
                groupIndex > 0 ? "mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/60" : "",
                group.isPrioritized && "relative"
              )}
            >
              {/* Prioritized indicator */}
              {group.isPrioritized && !isCollapsed && (
                <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full" />
              )}

              {/* Section Header */}
              {!isCollapsed && group.section && (
                <div className="px-3 mb-2">
                  {group.collapsible ? (
                    <button
                      onClick={() => toggleSection(group.section)}
                      className="flex items-center justify-between w-full text-left group hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                      <h3 className={cn(
                        "text-xs font-semibold uppercase tracking-wider transition-colors",
                        group.isPrioritized
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                      )}>
                        {group.section}
                      </h3>
                      {isSectionCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                      )}
                    </button>
                  ) : (
                    <h3 className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      group.isPrioritized
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-slate-500 dark:text-slate-400"
                    )}>
                      {group.section}
                    </h3>
                  )}
                </div>
              )}

              {/* Section Items with smooth collapse animation */}
              <div
                className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                  isSectionCollapsed && !isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                }`}
              >
                {group.items.map((item) => {
                  const active = isActive(item.href);

                  // Hide Admin Panel for non-super-admins
                  if (item.name === "Admin Panel" && !profile?.is_super_admin) {
                    return null;
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-all group",
                        isCollapsed ? "justify-center px-2" : "justify-between px-3",
                        active
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                      title={item.adaptiveConfig.helpText}
                    >
                      {/* Active indicator - Linear style left border */}
                      {active && !isCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-slate-900 dark:bg-slate-100 rounded-r" />
                      )}

                      <div className={`flex items-center ${isCollapsed ? "" : "space-x-3 ml-2"}`}>
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.name}</span>}
                      </div>

                      {/* Badge */}
                      {!isCollapsed && item.adaptiveConfig.badge && (
                        <Badge
                          variant={
                            item.adaptiveConfig.badge === "beta"
                              ? "secondary"
                              : item.adaptiveConfig.badge === "new"
                              ? "default"
                              : "outline"
                          }
                          className="text-xs border-slate-200 dark:border-slate-700"
                        >
                          {item.adaptiveConfig.badge === "coming-soon"
                            ? "Soon"
                            : item.adaptiveConfig.badge === "beta"
                            ? "Beta"
                            : item.adaptiveConfig.badge === "new"
                            ? "New"
                            : "Pro"}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Current Workspace Quick Info (when expanded) */}
      {!isCollapsed && currentWorkspace.id !== "default" && (
        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-xs text-muted-foreground">
              {currentWorkspace.name} active
            </span>
          </div>
        </div>
      )}

      {/* Sign Out */}
      <div className={`border-t border-slate-200 dark:border-slate-800 ${isCollapsed ? "p-2" : "p-4"}`}>
        <form action="/api/auth/sign-out" method="POST">
          <Button
            variant="ghost"
            className={`w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
              isCollapsed ? "justify-center px-2" : "justify-start"
            }`}
            type="submit"
            title="Sign Out"
          >
            <LogOut className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
            {!isCollapsed && "Sign Out"}
          </Button>
        </form>
      </div>
    </div>
  );
}
