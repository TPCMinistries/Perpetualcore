/**
 * /org/[orgId]/settings — Settings hub.
 *
 * Server component. Renders 4 nav cards (alerts / vault / voice / billing)
 * plus an inline Org Details edit panel for owner-editable fields.
 *
 * Before this page existed, typing /settings landed on a 404. Users had
 * to memorize /settings/alerts | /settings/vault | /settings/voice | /
 * settings/billing. This is the index.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OrgDetailsForm } from "@/components/rfp/OrgDetailsForm";
import {
  Bell,
  Database,
  Mic,
  CreditCard,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ orgId: string }>;
}

interface OrgRow {
  id: string;
  name: string;
  type: "nonprofit" | "forprofit" | "dual";
  naics: string[];
  capacity_summary: string | null;
}

const NAV_CARDS = [
  {
    href: "alerts",
    label: "Alerts",
    icon: Bell,
    detail: "Email, Telegram, and Discord destinations for new opportunities.",
  },
  {
    href: "voice",
    label: "Voice fingerprint",
    icon: Mic,
    detail: "Train a stylometric profile from your past proposals.",
  },
  {
    href: "vault",
    label: "Vault",
    icon: Database,
    detail: "Upload past documents that ground drafts in real facts.",
  },
  {
    href: "billing",
    label: "Billing",
    icon: CreditCard,
    detail: "Subscription tier, trial dates, manage via Stripe portal.",
  },
] as const;

export default async function SettingsHubPage({ params }: PageProps) {
  const { orgId } = await params;
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
    .select("id, name, type, naics, capacity_summary")
    .eq("id", orgId)
    .maybeSingle<OrgRow>();
  if (!org) notFound();

  const canEditDetails = role === "owner";

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
          Settings
        </div>
        <h1
          className="mt-3 text-3xl italic text-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {org.name}
        </h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          {org.type} · role: {role}
        </p>

        {/* Nav cards */}
        <section className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {NAV_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={`/org/${orgId}/settings/${card.href}`}
                className="group rounded-lg border border-zinc-900 bg-white/[0.02] p-4 transition hover:border-zinc-800 hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[14px] font-medium text-zinc-100">
                    {card.label}
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 text-zinc-600 transition group-hover:text-zinc-300" />
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">
                  {card.detail}
                </p>
              </Link>
            );
          })}
        </section>

        {/* Org details — owner-editable */}
        <section className="mt-12">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            Org details
          </h2>
          <p className="mt-2 text-[12px] text-zinc-500">
            {canEditDetails
              ? "These appear in every Stripe customer record, every Stripe invoice, and the drafter's system prompt — keep them accurate."
              : "Read-only at your role. Owner can edit."}
          </p>
          <div className="mt-4">
            <OrgDetailsForm
              orgId={orgId}
              canEdit={canEditDetails}
              initialName={org.name}
              initialType={org.type}
              initialNaics={org.naics ?? []}
              initialCapacitySummary={org.capacity_summary ?? ""}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
