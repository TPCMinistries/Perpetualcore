"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  FileSearch,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

const destinations = [
  { href: "/dashboard/development", label: "Workspace", icon: LayoutDashboard },
  { href: "/dashboard/development/agent", label: "Agent", icon: Sparkles },
  { href: "/dashboard/development/playbooks", label: "Playbooks", icon: BookOpenCheck },
  { href: "/dashboard/development/intelligence", label: "Intelligence", icon: BrainCircuit },
  { href: "/dashboard/development/profiles", label: "People", icon: Users },
  { href: "/dashboard/development/review", label: "Review", icon: FileSearch },
  { href: "/dashboard/development/trajectory", label: "Trajectory", icon: TrendingUp },
  { href: "/dashboard/development/evaluation", label: "Quality", icon: BarChart3 },
];

export function DevelopmentNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Development Intelligence"
      className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
    >
      {destinations.map((item) => {
        const isWorkspace = item.href === "/dashboard/development";
        const active = isWorkspace
          ? pathname === item.href || pathname.startsWith("/dashboard/development/analyses/")
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${active ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-800"}`}
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
