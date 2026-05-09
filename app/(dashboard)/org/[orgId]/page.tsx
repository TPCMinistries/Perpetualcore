/**
 * app/(dashboard)/org/[orgId]/page.tsx
 *
 * Org workspace landing page — stub for Phase 5 Discovery feed.
 *
 * Phase 5 will replace this placeholder with the Discovery feed
 * (opportunity matches scoped to this org). For now it confirms the
 * org-scoped routing works and gives the user orientation.
 */

interface OrgPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function OrgHomePage({ params }: OrgPageProps) {
  const { orgId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">
        Welcome to your workspace
      </h1>
      <p className="text-muted-foreground mb-4">
        Discovery, Vault, Drafts, and Compliance will live here. Phase 5 lights
        up the Discovery feed — RFP opportunities matched to your org&apos;s
        NAICS profile.
      </p>
      <p className="text-xs text-muted-foreground font-mono">
        org: {orgId}
      </p>
    </div>
  );
}
