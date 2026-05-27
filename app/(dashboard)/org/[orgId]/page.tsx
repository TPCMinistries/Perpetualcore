/**
 * app/(dashboard)/org/[orgId]/page.tsx
 *
 * Canonical org landing route. Users should never land on a placeholder
 * workspace now that Discovery is the working RFP console.
 */

import { redirect } from "next/navigation";

export default async function OrgHomePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  redirect(`/org/${orgId}/discovery`);
}
