"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { ExperienceLevelToggle, useExperienceLevel } from "@/components/experience-level/ExperienceLevelToggle";
import { getFilteredNavigation, NavigationSection } from "@/config/navigation";
import { UserExperienceLevel } from "@/types/user-experience";

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

  useEffect(() => {
    // Update navigation when experience level changes
    const filteredNav = getFilteredNavigation(experienceLevel);
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
    return pathname === href;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-slate-900">
      {/* Logo/Brand */}
      <div className={`border-b border-slate-200 dark:border-slate-800 py-4 ${isCollapsed ? "px-2" : "px-6"}`}>
        <Link href="/dashboard" className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-2"}`}>
          <div className="h-8 w-8 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center font-bold text-white dark:text-slate-900">
            AI
          </div>
          {!isCollapsed && <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">Perpetual Core</span>}
        </Link>
      </div>

      {/* Organization */}
      {profile?.organization && !isCollapsed && (
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Organization</p>
          <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
            {profile.organization.name}
          </p>
        </div>
      )}

      {/* Experience Level Toggle */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-800">
          <ExperienceLevelToggle />
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 py-4 overflow-y-auto ${isCollapsed ? "px-1" : "px-3"}`}>
        {navigation.map((group, groupIndex) => {
          const isSectionCollapsed = group.collapsible && collapsedSections[group.section];

          return (
            <div key={group.section} className={groupIndex > 0 ? "mt-7 pt-6 border-t border-slate-200/60 dark:border-slate-800/60" : ""}>
              {/* Section Header */}
              {!isCollapsed && (
                <div className="px-3 mb-2">
                  {group.collapsible ? (
                    <button
                      onClick={() => toggleSection(group.section)}
                      className="flex items-center justify-between w-full text-left group hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                        {group.section}
                      </h3>
                      {isSectionCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                      )}
                    </button>
                  ) : (
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                      className={`relative flex items-center ${
                        isCollapsed ? "justify-center px-2" : "justify-between px-3"
                      } rounded-lg py-2.5 text-sm font-medium transition-all group ${
                        active
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
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
