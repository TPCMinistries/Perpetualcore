"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CreditCard,
  FileText,
  FolderSearch,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrgWorkspaceNavProps {
  orgId: string;
}

const PRIMARY_LINKS = [
  {
    href: "discovery",
    label: "Discovery",
    icon: FolderSearch,
    match: (pathname: string, orgId: string) =>
      pathname === `/org/${orgId}` || pathname.startsWith(`/org/${orgId}/discovery`),
  },
  {
    href: "pursuits",
    label: "Pursuits",
    icon: BriefcaseBusiness,
    match: (pathname: string, orgId: string) =>
      pathname.startsWith(`/org/${orgId}/pursuits`),
  },
  {
    href: "proposals",
    label: "Proposals",
    icon: FileText,
    match: (pathname: string, orgId: string) =>
      pathname.startsWith(`/org/${orgId}/proposals`),
  },
] as const;

const SETTINGS_LINKS = [
  {
    href: "settings",
    label: "Workspace",
    icon: Settings,
  },
  {
    href: "settings/vault",
    label: "Vault",
    icon: ShieldCheck,
  },
  {
    href: "settings/alerts",
    label: "Alerts",
    icon: Bell,
  },
  {
    href: "settings/billing",
    label: "Billing",
    icon: CreditCard,
  },
] as const;

function linkFor(orgId: string, href: string): string {
  return `/org/${orgId}/${href}`;
}

export function OrgWorkspaceNav({ orgId }: OrgWorkspaceNavProps) {
  const pathname = usePathname() ?? "";
  const settingsActive = pathname.startsWith(`/org/${orgId}/settings`);

  return (
    <nav
      aria-label="RFP workspace"
      className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {PRIMARY_LINKS.map((item) => {
        const active = item.match(pathname, orgId);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={linkFor(orgId, item.href)}
            aria-current={active ? "page" : undefined}
            className={[
              "inline-flex h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2",
              active
                ? "border-cyan-200 bg-cyan-50 text-cyan-800 shadow-sm"
                : "border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-900/[0.04] hover:text-zinc-900",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Workspace settings"
            aria-current={settingsActive ? "page" : undefined}
            className={[
              "inline-flex h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2",
              settingsActive
                ? "border-cyan-200 bg-cyan-50 text-cyan-800 shadow-sm"
                : "border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-900/[0.04] hover:text-zinc-900",
            ].join(" ")}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>Settings</span>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-52 border-zinc-200 bg-white text-zinc-700 shadow-lg shadow-zinc-900/[0.06]"
        >
          <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            Configure
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-100" />
          {SETTINGS_LINKS.map((item) => {
            const Icon = item.icon;
            const href = linkFor(orgId, item.href);
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <DropdownMenuItem
                key={item.href}
                asChild
                className={[
                  "cursor-pointer focus:bg-zinc-100",
                  active ? "bg-cyan-50 text-cyan-800 focus:bg-cyan-50" : "",
                ].join(" ")}
              >
                <Link href={href} className="flex w-full items-center gap-2">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
