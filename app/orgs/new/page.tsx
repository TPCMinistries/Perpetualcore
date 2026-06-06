/**
 * /orgs/new — Create a new organization.
 *
 * Server component shell: verifies auth, then delegates to the
 * CreateOrgForm client component. Logged-out users are redirected
 * to /login with a `next` param so they bounce back after sign-in.
 *
 * Wrapped in <AuthShell productCopyKey="createOrg"> so the page
 * picks up the host-aware product chrome — dark+emerald on
 * rfp.perpetualcore.com, default elsewhere — matching the rest of
 * the auth/onboarding flow.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateOrgForm } from "@/components/rfp/CreateOrgForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = {
  title: "Create an Organization — Perpetual Core",
};

export default async function NewOrgPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/orgs/new");
  }

  return (
    <AuthShell
      title=""
      productCopyKey="createOrg"
      maxWidth="lg"
      footer={
        <Link href="/" className="hover:underline">
          ← Back to site
        </Link>
      }
    >
      <CreateOrgForm />
    </AuthShell>
  );
}
