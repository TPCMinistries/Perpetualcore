"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Key,
  ScrollText,
  MonitorSmartphone,
  BarChart3,
  Rocket,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Dashboard",
    items: [
      { label: "Overview", href: "/dashboard/admin/overview", icon: LayoutDashboard },
      { label: "AI Usage", href: "/dashboard/admin/usage", icon: BarChart3 },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Users", href: "/dashboard/admin/users", icon: Users },
      { label: "Organizations", href: "/dashboard/admin/organizations", icon: Building2 },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "OPERATE (GHL)", href: "/dashboard/admin/operate", icon: Rocket },
    ],
  },
  {
    title: "Security",
    items: [
      { label: "Compliance", href: "/dashboard/admin/compliance", icon: Shield },
      { label: "SSO Providers", href: "/dashboard/admin/sso", icon: Key },
      { label: "Sessions", href: "/dashboard/admin/sessions", icon: MonitorSmartphone },
      { label: "Audit Logs", href: "/dashboard/audit-logs", icon: ScrollText },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 flex-shrink-0 border-r bg-gray-50 p-4 space-y-6 min-h-[calc(100vh-4rem)]">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
