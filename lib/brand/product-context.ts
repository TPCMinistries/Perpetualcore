/**
 * lib/brand/product-context.ts — host-based product detection for shared
 * auth + contact-sales pages.
 *
 * Single Supabase auth pool (LDC Brain AI) backs every Perpetual Core
 * product (RFP Engine, Sentinel, Atlas, Sage, parent). Each product is
 * served from its own subdomain via middleware. The login / signup /
 * reset-password / accept-invite / contact-sales routes are SHARED
 * across all products — we don't want N copies of the same form.
 *
 * This helper detects which product surface the user arrived from and
 * returns a brand context the page can apply for chrome + copy. Auth
 * flow underneath is identical regardless of product.
 *
 * Extensible: add a new subdomain → add a `ProductId` case + descriptor.
 * Today we only ship the rfp variant + a default; the others map to
 * default until their respective product surfaces ship branded chrome.
 */

export type ProductId =
  | "rfp"
  | "sentinel"
  | "atlas"
  | "sage"
  | "perpetual-core";

export interface ProductBrand {
  id: ProductId;
  /** Product wordmark text used in eyebrows / headers. */
  wordmark: string;
  /** Sign-in headline. */
  signInTitle: string;
  /** Sign-in subhead. */
  signInSubtitle: string;
  /** Sign-up headline. */
  signUpTitle: string;
  /** Sign-up subhead. */
  signUpSubtitle: string;
  /** Contact-sales headline. */
  contactTitle: string;
  /** Contact-sales subhead. */
  contactSubtitle: string;
  /** Create-org headline. */
  createOrgTitle: string;
  /** Create-org subhead. */
  createOrgSubtitle: string;
  /** "What to expect" enterprise list — pairs (label, body). */
  expect: ReadonlyArray<{ label: string; body: string }>;
}

const RFP: ProductBrand = {
  id: "rfp",
  wordmark: "RFP Engine",
  signInTitle: "Sign in to RFP Engine",
  signInSubtitle:
    "Discover the right RFPs, draft them in your voice, ship them clean.",
  signUpTitle: "Create your RFP Engine account",
  signUpSubtitle:
    "Start finding the right grants and contracts in five minutes.",
  contactTitle: "Talk to the RFP Engine team",
  contactSubtitle:
    "Capture cohort onboarding, voice training, vault setup. We'll reach out within one business day.",
  createOrgTitle: "Create your first capture org",
  createOrgSubtitle:
    "This scopes Discovery, Voice, Vault, Drafts, and Compliance to your team. You can create more orgs any time — one per entity or funding stack.",
  expect: [
    {
      label: "Capture cohort onboarding",
      body: "30-min walkthrough with one of our operators. We map your funding stack to the right discovery sources and set your initial scoring weights.",
    },
    {
      label: "Voice training session",
      body: "We help you upload 5–10 past proposals and verify your stylometric fingerprint. The drafter learns your voice that day.",
    },
    {
      label: "Vault setup help",
      body: "We chunk and embed your past wins, annual reports, and program docs so the drafter cites real artifacts — not hallucinations.",
    },
    {
      label: "Pricing tailored to your scope",
      body: "Starter $299, Pro $799, Agency $2,499, Enterprise contact. Win-fee add-on optional. We size it to your active capture pipeline.",
    },
  ],
};

const DEFAULT: ProductBrand = {
  id: "perpetual-core",
  wordmark: "Perpetual Core",
  signInTitle: "Welcome back",
  signInSubtitle: "Sign in to your account to continue",
  signUpTitle: "Create an account",
  signUpSubtitle: "Enter your details to get started with Perpetual Core",
  contactTitle: "Let's Build Something Amazing Together",
  contactSubtitle:
    "Our enterprise team will help you transform your business with AI. Fill out the form and we'll be in touch within 24 hours.",
  createOrgTitle: "Create an organization",
  createOrgSubtitle:
    "Set up your tenant — this scopes your workspace, data, and team to one organization.",
  expect: [
    {
      label: "24-Hour Response",
      body: "Our enterprise team will reach out within one business day to schedule a personalized demo.",
    },
    {
      label: "Custom Demo",
      body: "See Perpetual Core in action with examples tailored to your industry and use case.",
    },
    {
      label: "Tailored Proposal",
      body: "Get a custom pricing and implementation plan designed for your organization.",
    },
    {
      label: "Security & Compliance",
      body: "Review our SOC 2, HIPAA, and enterprise security practices with our team.",
    },
  ],
};

const PRODUCT_BRANDS: Record<ProductId, ProductBrand> = {
  rfp: RFP,
  sentinel: DEFAULT,
  atlas: DEFAULT,
  sage: DEFAULT,
  "perpetual-core": DEFAULT,
};

/**
 * Detect the product from a hostname. Server- and client-safe (just
 * inspect the string). Returns "perpetual-core" for anything we don't
 * have a dedicated brand for (including localhost, preview deploys,
 * apex, and www).
 */
export function detectProductFromHost(host: string | null | undefined): ProductId {
  if (!host) return "perpetual-core";
  const h = host.toLowerCase().split(":")[0];
  if (h.startsWith("rfp.")) return "rfp";
  if (h.startsWith("sentinel.")) return "sentinel";
  if (h.startsWith("atlas.")) return "atlas";
  if (h.startsWith("sage.")) return "sage";
  return "perpetual-core";
}

export function productBrand(id: ProductId): ProductBrand {
  return PRODUCT_BRANDS[id];
}
