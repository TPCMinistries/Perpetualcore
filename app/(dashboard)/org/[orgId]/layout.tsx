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
import { OrgWorkspaceNav } from "@/components/rfp/OrgWorkspaceNav";

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
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-[#f7f7f4]/85 backdrop-blur-xl">
        <div className="container mx-auto flex min-h-16 flex-col gap-2 px-4 py-2 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0">
          <div className="flex w-full min-w-0 items-center justify-between gap-3 lg:w-auto lg:shrink-0">
            {/* Brand mark — org identity lives in the switcher (single source) */}
            <Link
              href={`/org/${orgId}/discovery`}
              className="group flex shrink-0 items-center gap-2.5"
              aria-label="RFP Engine home"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-[0_2px_12px_-2px_rgba(16,185,129,0.55)]">
                <FileText className="h-4 w-4" />
              </div>
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-[14px] font-semibold tracking-tight text-zinc-900">
                  RFP Engine
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                  by Perpetual Core
                </span>
              </div>
            </Link>

            <div className="min-w-0 shrink lg:hidden">
              <OrgSwitcher currentOrgId={orgId} />
            </div>
          </div>

          {/* Nav + desktop org switcher */}
          <div className="flex w-full min-w-0 flex-1 items-center justify-between gap-3">
            <OrgWorkspaceNav orgId={orgId} />
            <div className="hidden shrink-0 border-l border-zinc-200 pl-3 lg:block">
              <OrgSwitcher currentOrgId={orgId} />
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </>
  );
}
