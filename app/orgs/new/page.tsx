/**
 * /orgs/new — Create a new organization.
 *
 * Server component shell: verifies auth, then delegates to the
 * CreateOrgForm client component. Logged-out users are redirected
 * to /login with a `next` param so they bounce back after sign-in.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateOrgForm } from "@/components/rfp/CreateOrgForm";

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
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-semibold mb-2">Create an Organization</h1>
      <p className="text-muted-foreground mb-8">
        Set up your tenant — this scopes Discovery, Vault, Drafts, and
        Compliance to your team.
      </p>
      <CreateOrgForm />
    </div>
  );
}
