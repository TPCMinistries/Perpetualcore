"use client";

/**
 * OrgSwitcher — dropdown in the dashboard header that lists every rfp_org the
 * current user belongs to, lets them switch between orgs (preserving the
 * current sub-route), and links out to /orgs/new.
 *
 * Closes ORG-03 (Phase 5).
 *
 * Data source: GET /api/orgs (built in Plan 04-03 — lists user's orgs via RLS).
 * Response shape: { orgs: Array<{ role, rfp_orgs: { id, name, type, ... } }> }
 *
 * Route preservation: when switching from `/org/<A>/discovery` to org B, we
 * navigate to `/org/<B>/discovery`. The orgId segment is replaced inline;
 * everything after it is preserved verbatim. If the current URL doesn't
 * actually start with `/org/<id>/`, we fall back to `/org/<newId>/discovery`.
 *
 * UX nits:
 *   - Trigger shows current org name + type badge + chevron.
 *   - Loading state shows the current name only (no spinner — feels less
 *     blocking; the menu just opens with one entry until fetch resolves).
 *   - The current org appears in the list with a small "current" indicator
 *     so the user knows where they are.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrgEntry {
  role: "owner" | "writer" | "reviewer" | "viewer";
  rfp_orgs: {
    id: string;
    name: string;
    type: "nonprofit" | "forprofit" | "dual";
  };
}

interface OrgSwitcherProps {
  currentOrgId: string;
}

function rewritePathForOrg(pathname: string, newOrgId: string): string {
  // Pattern: /org/<id>/<rest...>  →  /org/<newOrgId>/<rest...>
  const m = pathname.match(/^\/org\/[^/]+(\/.*)?$/);
  if (m) {
    const rest = m[1] ?? "";
    return `/org/${newOrgId}${rest}`;
  }
  return `/org/${newOrgId}/discovery`;
}

export function OrgSwitcher({ currentOrgId }: OrgSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [orgs, setOrgs] = useState<OrgEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/orgs")
      .then(async (res) => {
        if (!res.ok) throw new Error(`orgs_${res.status}`);
        return (await res.json()) as { orgs: OrgEntry[] };
      })
      .then((data) => {
        if (!cancelled) setOrgs(data.orgs ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = orgs?.find((o) => o.rfp_orgs.id === currentOrgId);
  const others = (orgs ?? []).filter(
    (o) => o.rfp_orgs.id !== currentOrgId
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-800 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
          aria-label="Switch organization"
          data-testid="org-switcher"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-mono">
            Org
          </span>
          <span className="max-w-[180px] truncate font-medium">
            {current ? current.rfp_orgs.name : "Loading…"}
          </span>
          {current && (
            <span
              className={`text-[10px] uppercase tracking-wide font-mono ${
                current.rfp_orgs.type === "dual"
                  ? "text-emerald-600"
                  : "text-zinc-400"
              }`}
            >
              {current.rfp_orgs.type}
            </span>
          )}
          <span aria-hidden="true" className="text-zinc-400">
            ▾
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 bg-white border-zinc-200 text-zinc-700 shadow-lg shadow-zinc-900/[0.06]"
      >
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-mono">
          Your organizations
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-100" />
        {error && (
          <div className="px-2 py-2 text-xs text-amber-600 font-mono">
            Could not load orgs ({error})
          </div>
        )}
        {!orgs && !error && (
          <div className="px-2 py-2 text-xs text-zinc-400 font-mono">
            Loading…
          </div>
        )}
        {current && (
          <DropdownMenuItem
            disabled
            className="opacity-100 cursor-default focus:bg-transparent"
          >
            <div className="flex flex-col w-full min-w-0">
              <div className="flex items-center justify-between w-full min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{current.rfp_orgs.name}</span>
                  {/* Phase 05-06 — dual chip next to dual orgs' names */}
                  {current.rfp_orgs.type === "dual" && (
                    <span
                      className="shrink-0 text-[10px] uppercase tracking-wide font-mono text-emerald-700 border border-emerald-200 bg-emerald-50 rounded px-1 py-0"
                      data-testid="org-dual-chip"
                    >
                      dual
                    </span>
                  )}
                </div>
                <span className="ml-2 shrink-0 text-[10px] uppercase tracking-wide text-emerald-600">
                  Current
                </span>
              </div>
              {current.rfp_orgs.type === "dual" && (
                <span className="text-[10px] text-zinc-500 mt-0.5">
                  Nonprofit + For-profit
                </span>
              )}
            </div>
          </DropdownMenuItem>
        )}
        {others.map((o) => (
          <DropdownMenuItem
            key={o.rfp_orgs.id}
            onSelect={() => {
              router.push(rewritePathForOrg(pathname, o.rfp_orgs.id));
            }}
            className="cursor-pointer focus:bg-zinc-100"
          >
            <div className="flex flex-col w-full min-w-0">
              <div className="flex items-center justify-between w-full min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{o.rfp_orgs.name}</span>
                  {o.rfp_orgs.type === "dual" && (
                    <span
                      className="shrink-0 text-[10px] uppercase tracking-wide font-mono text-emerald-700 border border-emerald-200 bg-emerald-50 rounded px-1 py-0"
                      data-testid="org-dual-chip"
                    >
                      dual
                    </span>
                  )}
                </div>
                <span
                  className={`ml-2 shrink-0 text-[10px] uppercase tracking-wide ${
                    o.rfp_orgs.type === "dual"
                      ? "text-zinc-400"
                      : "text-zinc-500"
                  }`}
                >
                  {o.rfp_orgs.type}
                </span>
              </div>
              {o.rfp_orgs.type === "dual" && (
                <span className="text-[10px] text-zinc-500 mt-0.5">
                  Nonprofit + For-profit
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-zinc-100" />
        <DropdownMenuItem asChild className="cursor-pointer focus:bg-zinc-100 text-emerald-700">
          <Link href="/orgs/new" className="block w-full">
            + New organization
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
