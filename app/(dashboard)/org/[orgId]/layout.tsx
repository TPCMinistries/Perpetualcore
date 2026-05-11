/**
 * app/(dashboard)/org/[orgId]/layout.tsx
 *
 * Org-scoped layout — ported from the ldc-command-center workspace pattern.
 * Adaptation: [workspaceId] → [orgId], workspaces table → rfp_orgs.
 *
 * Security model:
 *   - getOrgForUser() calls createClient() (anon-keyed), so RLS runs.
 *   - RLS on rfp_orgs SELECT: "org_id = ANY(rfp_my_org_ids())" (Plan 04-01).
 *   - If user is not a member of this org, the query returns null → notFound().
 *   - This means any user who guesses a UUID they're not a member of gets a 404,
 *     which reveals nothing about whether the org exists.
 *
 * Phase 5 (ORG-03): the placeholder switcher is replaced with the real
 * OrgSwitcher dropdown. The `<main>` wrapper drops its container/padding so
 * full-bleed routes like /org/[orgId]/discovery (split-pane viewport-height
 * layout) can render edge-to-edge. Routes that need a constrained reading
 * width can re-apply `container` inside their own page.
 */

import { notFound } from "next/navigation";
import { getOrgForUser } from "@/lib/rfp/orgs";
import { OrgSwitcher } from "@/components/rfp/OrgSwitcher";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgId } = await params;
  const org = await getOrgForUser(orgId);

  // 404 on no-access — same behavior as the salvage source
  if (!org) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-900 bg-zinc-950">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-zinc-500 font-mono">
              Organization
            </span>
            <span className="font-semibold text-zinc-100">{org.name}</span>
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs capitalize text-zinc-300">
              {org.type}
            </span>
          </div>

          {/* Real org switcher (ORG-03) */}
          <OrgSwitcher currentOrgId={orgId} />
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
