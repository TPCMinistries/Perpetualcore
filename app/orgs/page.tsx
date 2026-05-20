/**
 * /orgs — Post-auth router for the RFP product.
 *
 * Resolves the caller's RFP org memberships and redirects:
 *   - 0 orgs → /orgs/new (create-org wizard)
 *   - 1+ orgs → /org/[mostRecent]/discovery
 *
 * This is the canonical post-login landing on rfp.perpetualcore.com. The
 * LoginForm and /auth/callback now point here when the request is on the
 * RFP host, so users never land in the legacy /dashboard surface.
 *
 * Server component. No body rendered — always redirects.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listUserOrgs } from "@/lib/rfp/orgs";

export const dynamic = "force-dynamic";

export default async function OrgsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/orgs");
  }

  const memberships = await listUserOrgs();
  if (memberships.length === 0) {
    redirect("/orgs/new");
  }

  const first = memberships[0]?.rfp_orgs;
  if (!first?.id) {
    redirect("/orgs/new");
  }
  redirect(`/org/${first.id}/discovery`);
}
