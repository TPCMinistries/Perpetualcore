"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
    const filteredNav = getFilteredNavigation(experienceLevel);
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

  const isActive = (href: string) => pathname === href;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 rounded-xl bg-muted/60 hover:bg-muted text-foreground backdrop-blur-sm active:scale-95 transition-all"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-80 p-0 border-r-0"
        style={{
          background: "linear-gradient(to bottom, #1e1535, #1a1040, #150e2e)",
        }}
      >
        <div className="flex h-full flex-col text-white">
          {/* Logo/Brand */}
          <div className="px-6 py-5">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 group"
              onClick={() => setOpen(false)}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-glow-sm">
                AI
              </div>
              <span className="text-lg font-semibold text-gradient">Perpetual Core</span>
            </Link>
          </div>

          {/* Organization */}
          {userProfile.organization && (
            <div className="px-6 py-3 bg-white/[0.03]">
              <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
                Organization
              </p>
              <p className="text-sm font-medium truncate text-white/80">
                {userProfile.organization.name}
              </p>
            </div>
          )}

          {/* Experience Level Toggle */}
          <div className="px-4 py-3">
            <ExperienceLevelToggle />
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-white/[0.06]" />

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {navigation.map((group, groupIndex) => {
              const isSectionCollapsed = group.collapsible && collapsedSections[group.section];

              return (
                <div key={group.section} className={groupIndex > 0 ? "mt-5 pt-3" : ""}>
                  {/* Section Header */}
                  <div className="px-3 mb-1.5">
                    {group.collapsible ? (
                      <button
                        onClick={() => toggleSection(group.section)}
                        className="flex items-center justify-between w-full text-left group"
                      >
                        <h3 className="text-[11px] font-medium uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors">
                          {group.section}
                        </h3>
                        {isSectionCollapsed ? (
                          <ChevronRight className="h-3 w-3 text-white/20 group-hover:text-white/40 transition-colors" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-white/20 group-hover:text-white/40 transition-colors" />
                        )}
                      </button>
                    ) : (
                      <h3 className="text-[11px] font-medium uppercase tracking-widest text-white/30">
                        {group.section}
                      </h3>
                    )}
                  </div>

                  {/* Section Items */}
                  <div
                    className={`space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${
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
                            "relative flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all active:scale-[0.98]",
                            active
                              ? "bg-gradient-to-r from-violet-600/90 to-violet-500/80 text-white shadow-glow-sm"
                              : "text-white/50 hover:text-white/90 hover:bg-white/[0.06]"
                          )}
                          title={item.adaptiveConfig.helpText}
                        >
                          <div className="flex items-center space-x-2.5">
                            <item.icon className={cn(
                              "h-[17px] w-[17px] flex-shrink-0",
                              active ? "text-white" : "text-white/40"
                            )} />
                            <span>{item.name}</span>
                          </div>
                          {/* Badge */}
                          {item.adaptiveConfig.badge && (
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

          {/* User Profile & Logout */}
          <div className="p-4">
            <div className="mx-1 h-px bg-white/[0.06] mb-3" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white/80">
                  {userProfile.full_name || "User"}
                </p>
                <p className="text-xs text-white/30 truncate">
                  {userProfile.email}
                </p>
              </div>
            </div>
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                className="w-full rounded-xl border-white/10 text-white/60 hover:text-white hover:bg-white/[0.06] hover:border-white/20"
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
