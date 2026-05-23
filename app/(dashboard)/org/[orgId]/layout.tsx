/**
 * app/(dashboard)/org/[orgId]/layout.tsx — Org-scoped chrome.
 *
 * Auth: getOrgForUser() runs under RLS (org_id = ANY(rfp_my_org_ids())).
 * Non-members see notFound() so the page can't be probed by UUID guessing.
 *
 * Visual system: the parent (dashboard) layout already locks bg-zinc-950
 * and renders RfpAtmosphere. This file is just the chrome (header bar +
 * <main> wrapper). The header is sticky + backdrop-blur to match the
 * marketing layout's pattern so transitioning between rfp.perpetualcore.com
 * and /org/[id]/discovery doesn't look like leaving the product.
 *
 * Full-bleed children: <main> has no padding/container — routes that need
 * a constrained reading width re-apply it themselves (discovery is a
 * split-pane viewport-height layout that needs edge-to-edge).
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { getOrgForUser } from "@/lib/rfp/orgs";
import { OrgSwitcher } from "@/components/rfp/OrgSwitcher";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgId } = await params;
  const org = await getOrgForUser(orgId);

  if (!org) {
    notFound();
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Brand mark + org identity */}
          <div className="flex items-center gap-6">
            <Link
              href={`/org/${orgId}/discovery`}
              className="group flex items-center gap-2.5"
              aria-label="RFP Engine home"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 shadow-[0_0_30px_-5px_rgba(16,185,129,0.6)]">
                <FileText className="h-4 w-4" />
              </div>
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-[14px] font-semibold tracking-tight text-white">
                  RFP Engine
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
                  by Perpetual Core
                </span>
              </div>
            </Link>

            {/* Org identity pill — name + type */}
            <div className="hidden h-9 items-center gap-2.5 rounded-md border border-white/5 bg-white/[0.02] px-3 md:flex">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
                Org
              </span>
              <span className="max-w-[280px] truncate text-[13px] font-medium text-zinc-100">
                {org.name}
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium capitalize text-emerald-300">
                {org.type}
              </span>
            </div>
          </div>

          {/* Nav + org switcher */}
          <nav aria-label="Workspace" className="flex items-center gap-1">
            <Link
              href={`/org/${orgId}/discovery`}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Discovery
            </Link>
            <Link
              href={`/org/${orgId}/proposals`}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Proposals
            </Link>
            <Link
              href={`/org/${orgId}/settings`}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Settings
            </Link>
            <div className="ml-3 border-l border-white/5 pl-3">
              <OrgSwitcher currentOrgId={orgId} />
            </div>
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </>
  );
}
