"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    const filteredNav = getFilteredNavigationV2(experienceLevel);
    setNavigation(filteredNav);

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

  const filteredNavigation = navigation
    .filter(section => isSectionVisible(section.section))
    .map(section => ({
      ...section,
      items: section.items.filter(item => isItemVisible(item.name)),
      isPrioritized: isSectionPrioritized(section.section),
    }))
    .filter(section => section.items.length > 0);

  const sortedNavigation = [...filteredNavigation].sort((a, b) => {
    if (a.isPrioritized && !b.isPrioritized) return -1;
    if (!a.isPrioritized && b.isPrioritized) return 1;
    return 0;
  });

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#1e1535] via-[#1a1040] to-[#150e2e] text-white">
      {/* Logo/Brand */}
      <div className={`py-5 ${isCollapsed ? "px-2" : "px-5"}`}>
        <Link href="/dashboard/home" className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"}`}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-glow-sm flex-shrink-0">
            AI
          </div>
          {!isCollapsed && (
            <span className="text-[15px] font-semibold text-gradient">
              Perpetual Core
            </span>
          )}
        </Link>
      </div>

      {/* Workspace Switcher */}
      <div className={cn(
        isCollapsed ? "px-2 py-2" : "px-3 py-2"
      )}>
        <WorkspaceSwitcher collapsed={isCollapsed} />
      </div>

      {/* Experience Level & Dashboard Mode Toggle */}
      {!isCollapsed && (
        <div className="px-3 py-2 space-y-2">
          <DashboardModeToggle className="w-full justify-between" />
          <ExperienceLevelToggle />
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Navigation */}
      <nav className={`flex-1 py-3 overflow-y-auto scrollbar-thin ${isCollapsed ? "px-1.5" : "px-2.5"}`}>
        {sortedNavigation.map((group, groupIndex) => {
          const isSectionCollapsed = group.collapsible && collapsedSections[group.section];

          return (
            <div
              key={group.section || `section-${groupIndex}`}
              className={cn(
                groupIndex > 0 ? "mt-5 pt-3" : "",
                group.isPrioritized && "relative"
              )}
            >
              {/* Prioritized indicator */}
              {group.isPrioritized && !isCollapsed && (
                <div className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-400 to-violet-400/30 rounded-full" />
              )}

              {/* Section Header */}
              {!isCollapsed && group.section && (
                <div className="px-3 mb-1.5">
                  {group.collapsible ? (
                    <button
                      onClick={() => toggleSection(group.section)}
                      className="flex items-center justify-between w-full text-left group"
                    >
                      <h3 className={cn(
                        "text-[11px] font-medium uppercase tracking-widest transition-colors",
                        group.isPrioritized
                          ? "text-violet-400"
                          : "text-white/30 group-hover:text-white/50"
                      )}>
                        {group.section}
                      </h3>
                      {isSectionCollapsed ? (
                        <ChevronRight className="h-3 w-3 text-white/20 group-hover:text-white/40 transition-colors" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-white/20 group-hover:text-white/40 transition-colors" />
                      )}
                    </button>
                  ) : (
                    <h3 className={cn(
                      "text-[11px] font-medium uppercase tracking-widest",
                      group.isPrioritized
                        ? "text-violet-400"
                        : "text-white/30"
                    )}>
                      {group.section}
                    </h3>
                  )}
                </div>
              )}

              {/* Section Items */}
              <div
                className={`space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${
                  isSectionCollapsed && !isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                }`}
              >
                {group.items.map((item) => {
                  const active = isActive(item.href);

                  if (item.name === "Admin Panel" && !profile?.is_super_admin) {
                    return null;
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "relative flex items-center rounded-xl py-2 text-[13px] font-medium transition-all duration-200 group",
                        isCollapsed ? "justify-center px-2" : "justify-between px-3",
                        active
                          ? "bg-gradient-to-r from-violet-600/90 to-violet-500/80 text-white shadow-glow-sm"
                          : "text-white/50 hover:text-white/90 hover:bg-white/[0.06]"
                      )}
                      title={item.adaptiveConfig.helpText}
                    >
                      <div className={`flex items-center ${isCollapsed ? "" : "space-x-2.5"}`}>
                        <item.icon className={cn(
                          "h-[17px] w-[17px] flex-shrink-0 transition-colors",
                          active ? "text-white" : "text-white/40 group-hover:text-white/70"
                        )} />
                        {!isCollapsed && <span>{item.name}</span>}
                      </div>

                      {/* Badge */}
                      {!isCollapsed && item.adaptiveConfig.badge && (
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                            active
                              ? "bg-white/20 text-white"
                              : "bg-violet-500/20 text-violet-300"
                          )}
                        >
                          {item.adaptiveConfig.badge === "coming-soon"
                            ? "Soon"
                            : item.adaptiveConfig.badge === "beta"
                            ? "Beta"
                            : item.adaptiveConfig.badge === "new"
                            ? "New"
                            : "Pro"}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Current Workspace Quick Info */}
      {!isCollapsed && currentWorkspace.id !== "default" && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04]">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-white/40">
              {currentWorkspace.name} active
            </span>
          </div>
        </div>
      )}

      {/* Sign Out */}
      <div className={`${isCollapsed ? "p-2" : "p-3"}`}>
        <div className="mx-2 h-px bg-white/[0.06] mb-3" />
        <form action="/api/auth/sign-out" method="POST">
          <Button
            variant="ghost"
            className={`w-full rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.06] ${
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
