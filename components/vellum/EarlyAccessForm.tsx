"use client";

/**
 * EarlyAccessForm — Vellum by Perpetual Core early-access waitlist form.
 *
 * Four-tier capture: Trial / Operator $299/mo / Team $1,500/mo / Institution.
 * - Trial: skips Stripe, persists email-only via /api/early-access.
 * - Operator + Team: creates Stripe setup_intent via /api/vellum/setup-intent,
 *   collects payment method via Stripe Elements (no charge today).
 * - Institution: persists signup, routes to /contact-sales?product=vellum-institution.
 *
 * 3DS REDIRECT RESUME:
 * Stripe's confirmSetup with redirect:'if_required' may redirect the user when the
 * issuing bank requires 3D Secure. On return, ?confirmed=1 is appended to our
 * return_url. Without this resume effect, the form would re-mount in `idle` state
 * and persistSignup would never fire — the row would NEVER land in vellum_early_access.
 * The useEffect on mount reads ?confirmed=1 + sessionStorage PENDING_SIGNUP_KEY and
 * calls persistSignup. Test signup #6 exercises this path.
 *
 * Pricing checkpoint updated with Lorenzo on 2026-05-26.
 * 30% mission-driven discount remains locked per BRAND_ARCHITECTURE.md §8.
 *
 * Plan 12-05 / STUDIO-VW-01.
 */

import { useState, useEffect } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Initialized once at module level (singleton per Stripe docs)
const stripePromise: Promise<Stripe | null> = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// sessionStorage key for 3DS-redirect resume data
const PENDING_SIGNUP_KEY = "vellum-pending-signup-v1";

type Tier = "free" | "operator" | "team" | "institution";

// Tier definitions — pricing checkpoint updated with Lorenzo on 2026-05-26.
const TIERS: Array<{
  id: Tier;
  label: string;
  price: string;
  blurb: string;
  needsPayment: boolean;
}> = [
  {
    id: "free",
    label: "Trial",
    price: "$0",
    blurb: "1 user, 100 sources, basic synthesis.",
    needsPayment: false,
  },
  {
    id: "operator",
    label: "Operator",
    price: "$299/month",
    blurb: "Unlimited sources, voice + channels, 30-day retention.",
    needsPayment: true,
  },
  {
    id: "team",
    label: "Team",
    price: "$1,500/month",
    blurb: "Up to 10 users, core integrations, onboarding, 1-year retention.",
    needsPayment: true,
  },
  {
    id: "institution",
    label: "Institution",
    price: "Contact us",
    blurb: "25+ users, SSO, custom retention, on-prem option.",
    needsPayment: false,
  },
];

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "collecting-payment"; clientSecret: string; setupIntentId: string }
  | { kind: "resuming-after-3ds" }
  | { kind: "success"; tier: Tier }
  | { kind: "error"; message: string };

type PendingSignup = {
  email: string;
  firstName: string;
  tier: Tier;
  is501c3: boolean;
  setupIntentId: string;
};

// ---------------------------------------------------------------------------
// Inner form that uses Stripe Elements hooks (must live inside <Elements>)
// ---------------------------------------------------------------------------
function PaymentStep({
  setupIntentId: _setupIntentId,
  onConfirmed,
  onError,
}: {
  setupIntentId: string;
  onConfirmed: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (!stripe || !elements) return;
    setSubmitting(true);

    // redirect:'if_required' means the bank MAY redirect for 3DS.
    // The 3DS resume logic in EarlyAccessForm handles return via ?confirmed=1.
    // For non-redirecting cards (most test cards), onConfirmed fires below.
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/products/vellum?confirmed=1#early-access`,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Payment method capture failed");
      setSubmitting(false);
      return;
    }

    // Non-redirect path — call onConfirmed directly
    onConfirmed();
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Card details below — Stripe-hosted, never seen by Perpetual Core
        servers. <strong>No charge today.</strong>
      </p>
      <PaymentElement />
      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={submitting || !stripe}
        onClick={handleConfirm}
      >
        {submitting ? "Confirming…" : "Reserve my spot"}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------
export function EarlyAccessForm() {
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [tier, setTier] = useState<Tier>("operator"); // default: Operator per §8 anchor
  const [is501c3, setIs501c3] = useState(false);

  // -------------------------------------------------------------------------
  // 3DS RESUME LOGIC
  // Runs once on mount. Stripe's confirmSetup with redirect:'if_required'
  // redirects the user when the issuing bank requires 3D Secure. On return,
  // ?confirmed=1 is in the URL (per our return_url). We read the pending
  // signup data from sessionStorage and call persistSignup to land the row.
  //
  // Without this effect: the row silently never lands — the user thinks they
  // completed signup, but vellum_early_access is empty. This is non-negotiable.
  // Test signup #6 exercises this path.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("confirmed") !== "1") return;

    const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY);
    if (!raw) return;

    let pending: PendingSignup;
    try {
      pending = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(PENDING_SIGNUP_KEY);
      return;
    }

    setState({ kind: "resuming-after-3ds" });

    persistSignup({
      email: pending.email,
      firstName: pending.firstName,
      tier: pending.tier,
      is501c3: pending.is501c3,
      setupIntentId: pending.setupIntentId,
    })
      .then(() => {
        sessionStorage.removeItem(PENDING_SIGNUP_KEY);
        setState({ kind: "success", tier: pending.tier });
        // Strip ?confirmed=1 so a page refresh doesn't re-trigger the effect
        window.history.replaceState(
          {},
          "",
          window.location.pathname + "#early-access"
        );
      })
      .catch(() => {
        setState({
          kind: "error",
          message:
            "Could not finalize signup after 3D Secure. Please contact us.",
        });
      });
  }, []);

  // -------------------------------------------------------------------------
  // POST to /api/early-access — shared across all tiers
  // -------------------------------------------------------------------------
  async function persistSignup(data: {
    email: string;
    firstName: string;
    tier: Tier;
    is501c3: boolean;
    setupIntentId: string | null;
  }): Promise<void> {
    const res = await fetch("/api/early-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        product: "vellum",
        tier_preference: data.tier,
        organization_type: data.is501c3 ? "501c3" : "other",
        is_501c3: data.is501c3,
        first_name: data.firstName || undefined,
        source: "vellum-waitlist",
        setup_intent_id: data.setupIntentId ?? undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string })?.error ?? "Signup failed"
      );
    }
  }

  // -------------------------------------------------------------------------
  // Step 1: User clicks the main CTA — handle by tier
  // -------------------------------------------------------------------------
  async function handleContinue() {
    if (!email) return;
    setState({ kind: "submitting" });

    try {
      if (tier === "free") {
        await persistSignup({ email, firstName, tier, is501c3, setupIntentId: null });
        setState({ kind: "success", tier });
        return;
      }

      if (tier === "institution") {
        await persistSignup({ email, firstName, tier, is501c3, setupIntentId: null });
        window.location.href = `/contact-sales?product=vellum-institution&email=${encodeURIComponent(email)}`;
        return;
      }

      // operator | team — create setup_intent, then show Stripe Elements
      const res = await fetch("/api/vellum/setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tier_preference: tier,
          is_501c3: is501c3,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string })?.message ?? "Stripe setup failed"
        );
      }

      const { client_secret, setup_intent_id } = (await res.json()) as {
        client_secret: string;
        setup_intent_id: string;
        customer_id: string;
      };

      // Cache pending signup BEFORE rendering Stripe Elements.
      // This is what the 3DS resume useEffect reads on return if the bank redirects.
      sessionStorage.setItem(
        PENDING_SIGNUP_KEY,
        JSON.stringify({
          email,
          firstName,
          tier,
          is501c3,
          setupIntentId: setup_intent_id,
        } satisfies PendingSignup)
      );

      setState({
        kind: "collecting-payment",
        clientSecret: client_secret,
        setupIntentId: setup_intent_id,
      });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Setup failed",
      });
    }
  }

  // -------------------------------------------------------------------------
  // Step 2: Called after Stripe payment step completes without redirect
  // -------------------------------------------------------------------------
  async function handlePaymentConfirmed(setupIntentId: string) {
    try {
      await persistSignup({ email, firstName, tier, is501c3, setupIntentId });
      sessionStorage.removeItem(PENDING_SIGNUP_KEY);
      setState({ kind: "success", tier });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Signup failed",
      });
    }
  }

  // -------------------------------------------------------------------------
  // Render branches
  // -------------------------------------------------------------------------

  if (state.kind === "resuming-after-3ds") {
    return (
      <Card className="border-primary/40">
        <CardContent className="p-8 text-center">
          <p className="text-lg font-semibold mb-2">Finalizing your signup…</p>
          <p className="text-muted-foreground text-sm">
            3D Secure confirmed. Saving your spot.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state.kind === "success") {
    return (
      <Card className="border-primary/40">
        <CardContent className="p-8 text-center">
          <p className="text-2xl font-semibold mb-3">You&apos;re on the list.</p>
          <p className="text-muted-foreground">
            {state.tier === "free" &&
              "We'll email when trial accounts open."}
            {state.tier === "operator" &&
              "We've held a spot at the $299/month Operator tier — no charge until you confirm."}
            {state.tier === "team" &&
              "We've held a spot at the $1,500/month Team tier — no charge until you confirm."}
            {state.tier === "institution" &&
              "We'll reach out within five business days."}
          </p>
          <p className="text-sm text-muted-foreground mt-6">
            Confirmation email sent to <strong>{email}</strong>.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state.kind === "collecting-payment") {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: state.clientSecret,
          appearance: { theme: "stripe" },
        }}
      >
        <PaymentStep
          setupIntentId={state.setupIntentId}
          onConfirmed={() => handlePaymentConfirmed(state.setupIntentId)}
          onError={(msg) => setState({ kind: "error", message: msg })}
        />
      </Elements>
    );
  }

  // idle / submitting / error — main capture form
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="vellum-email">Work email</Label>
        <Input
          id="vellum-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@organization.org"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vellum-firstname">
          First name{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="vellum-firstname"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Alex"
        />
      </div>

      <div className="space-y-3">
        <Label>Tier preference</Label>
        <RadioGroup
          value={tier}
          onValueChange={(v) => setTier(v as Tier)}
          className="space-y-3"
        >
          {TIERS.map((t) => (
            <div
              key={t.id}
              className="flex items-start space-x-3 border border-border/60 rounded-lg p-4 hover:border-primary/40 transition-colors cursor-pointer"
            >
              <RadioGroupItem
                value={t.id}
                id={`tier-${t.id}`}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor={`tier-${t.id}`}
                  className="cursor-pointer"
                >
                  <span className="font-semibold">{t.label}</span>
                  <span className="ml-2 text-muted-foreground text-sm">
                    {t.price}
                  </span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">{t.blurb}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex items-start space-x-3 border-t border-border/40 pt-6">
        <Checkbox
          id="vellum-501c3"
          checked={is501c3}
          onCheckedChange={(checked) => setIs501c3(checked === true)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <Label htmlFor="vellum-501c3" className="cursor-pointer font-medium">
            My organization is a verified 501(c)(3).
          </Label>
          {is501c3 && (tier === "operator" || tier === "team") && (
            <p className="text-sm text-primary mt-2">
              30% mission-driven discount applied to the Operator and Team
              tiers. We verify 501(c)(3) status via the IRS public registry
              before activating the discount.
            </p>
          )}
        </div>
      </div>

      {state.kind === "error" && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {state.message}
          </CardContent>
        </Card>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={state.kind === "submitting" || !email}
        onClick={handleContinue}
      >
        {state.kind === "submitting"
          ? "Working…"
          : tier === "free"
          ? "Join the free list"
          : tier === "institution"
          ? "Talk to us about Institution"
          : `Reserve ${tier === "operator" ? "Operator" : "Team"} — no charge yet`}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        10% of every Vellum subscription funds the{" "}
        <a
          href="https://theiha.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline underline-offset-2"
        >
          Institute for Human Advancement
        </a>
        . For Operator and Team, we collect a payment method via Stripe — your
        card is not charged until you confirm activation.
      </p>
    </div>
  );
}
