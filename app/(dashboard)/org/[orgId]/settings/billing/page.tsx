/**
 * /org/[orgId]/settings/billing — Subscription self-serve for the RFP product.
 *
 * Server component. Renders current subscription state and the right CTAs
 * for the caller's role. Owners see Subscribe buttons (Pro / Agency) or
 * Manage Subscription (if active). Writers/reviewers/viewers see the
 * state but can't transact.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionForOrg } from "@/lib/rfp/billing";
import { BillingActions } from "@/components/rfp/BillingActions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ status?: string }>;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string | null }) {
  const tone =
    status === "active" || status === "trialing"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      : status === "past_due" || status === "unpaid"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
        : status === "canceled"
          ? "border-zinc-700 bg-zinc-900 text-zinc-400"
          : "border-zinc-700 bg-zinc-900 text-zinc-400";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone}`}
    >
      {status ?? "no subscription"}
    </span>
  );
}

export default async function BillingPage({ params, searchParams }: PageProps) {
  const { orgId } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (membership as { role: string } | null)?.role ?? null;
  if (!role) notFound();

  const { data: org } = await supabase
    .from("rfp_orgs")
    .select("id, name")
    .eq("id", orgId)
    .maybeSingle<{ id: string; name: string }>();
  if (!org) notFound();

  const sub = await getSubscriptionForOrg(orgId);
  const canBill = role === "owner";
  const isActive = sub?.status === "active" || sub?.status === "trialing";

  return (
    <div className="relative">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href={`/org/${orgId}/discovery`}
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-300"
        >
          ← Discovery
        </Link>

        <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Settings · Billing
        </div>
        <h1
          className="mt-3 text-3xl text-white italic"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {org.name}
        </h1>

        {sp.status === "success" ? (
          <div className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4 text-[13px] text-emerald-200">
            Subscription is being activated. Stripe pings our webhook within a
            few seconds — refresh the page if the status below hasn't updated.
          </div>
        ) : null}
        {sp.status === "cancel" ? (
          <div className="mt-6 rounded-md border border-zinc-700 bg-zinc-900/60 p-4 text-[13px] text-zinc-400">
            Checkout cancelled. No charges were made.
          </div>
        ) : null}

        <section className="mt-10 rounded-lg border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-400">
              Current subscription
            </h2>
            <StatusBadge status={sub?.status ?? null} />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Tier
              </dt>
              <dd className="mt-1 text-zinc-100">
                {sub?.tier === "pro"
                  ? "Pro · $799/mo"
                  : sub?.tier === "agency"
                    ? "Agency · $2,499/mo"
                    : "Not subscribed"}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Trial ends
              </dt>
              <dd className="mt-1 text-zinc-100">
                {formatDate(sub?.trial_ends_at ?? null)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Renews
              </dt>
              <dd className="mt-1 text-zinc-100">
                {sub?.cancel_at_period_end
                  ? "Will not renew"
                  : formatDate(sub?.current_period_end ?? null)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Customer
              </dt>
              <dd className="mt-1 font-mono text-[12px] text-zinc-400">
                {sub?.stripe_customer_id ?? "—"}
              </dd>
            </div>
          </dl>

          {canBill ? (
            <div className="mt-6 border-t border-white/5 pt-6">
              <BillingActions orgId={orgId} isActive={!!isActive} />
            </div>
          ) : (
            <p className="mt-6 border-t border-white/5 pt-4 text-[12px] text-zinc-500">
              Only the org owner can change billing. Your role: {role}.
            </p>
          )}
        </section>

        <p className="mt-10 text-[12px] leading-relaxed text-zinc-500">
          Both tiers include a {""}
          <span className="text-zinc-300">14-day free trial</span>. Cancel any
          time from this page. Billing is processed by Stripe through
          Perpetual Core LLC. See{" "}
          <Link href="/rfp/pricing" className="underline">
            full pricing detail
          </Link>{" "}
          for what each tier includes.
        </p>
      </div>
    </div>
  );
}
