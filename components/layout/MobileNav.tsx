"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Settings, LogOut, Menu, ChevronDown, ChevronRight } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { getFilteredNavigation, NavigationSection } from "@/config/navigation";
import { useExperienceLevel } from "@/components/experience-level/ExperienceLevelToggle";
import { ExperienceLevelToggle } from "@/components/experience-level/ExperienceLevelToggle";

interface MobileNavProps {
  userProfile: {
    full_name: string | null;
    email: string;
    organization?: {
      name: string;
    } | null;
  };
}

export function MobileNav({ userProfile }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const experienceLevel = useExperienceLevel();
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

  const isActive = (href: string) => pathname === href;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2"
              onClick={() => setOpen(false)}
            >
              <div className="h-8 w-8 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center font-bold text-white dark:text-slate-900">
                AI
              </div>
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">Perpetual Core</span>
            </Link>
          </div>

          {/* Organization */}
          {userProfile.organization && (
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Organization
              </p>
              <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                {userProfile.organization.name}
              </p>
            </div>
          )}

          {/* Experience Level Toggle */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <ExperienceLevelToggle />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            {navigation.map((group, groupIndex) => {
              const isSectionCollapsed = group.collapsible && collapsedSections[group.section];

              return (
                <div key={group.section} className={groupIndex > 0 ? "mt-7 pt-6 border-t border-slate-200/60 dark:border-slate-800/60" : ""}>
                  {/* Section Header */}
                  <div className="px-2 mb-2">
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

                  {/* Section Items with smooth collapse animation */}
                  <div
                    className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                      isSectionCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                    }`}
                  >
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            active
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                          )}
                          title={item.adaptiveConfig.helpText}
                        >
                          {/* Active indicator - Linear style left border */}
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-slate-900 dark:bg-slate-100 rounded-r" />
                          )}

                          <div className={`flex items-center space-x-3 ${active ? "ml-2" : ""}`}>
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          {/* Badge */}
                          {item.adaptiveConfig.badge && (
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

          {/* User Profile & Logout */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                  {userProfile.full_name || "User"}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {userProfile.email}
                </p>
              </div>
            </div>
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                className="w-full border-slate-200 dark:border-slate-800"
                size="sm"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
