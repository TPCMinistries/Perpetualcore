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
 * TODO (Phase 5, ORG-03): replace the org-switcher placeholder with a real
 * dropdown component that lets users switch between their orgs.
 */

import { notFound } from "next/navigation";
import { getOrgForUser } from "@/lib/rfp/orgs";

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
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Organization
            </span>
            <span className="font-semibold">{org.name}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
              {org.type}
            </span>
          </div>

          {/* Org switcher placeholder — full implementation in Phase 5 (ORG-03) */}
          <div
            data-testid="org-switcher-placeholder"
            className="text-sm text-muted-foreground"
          >
            switcher · phase 5
          </div>
        </div>
      </header>

      <main className="container py-8">{children}</main>
    </div>
  );
}
