/**
 * Product manifest used by both /products listing and per-product JSON-LD.
 * Description copy mirrors hero subhead on each product page.
 */

export type ProductManifestEntry = {
  slug: string;
  name: string;
  description: string;
  category: string;
  status: "live" | "pilot" | "invite";
};

export const PC_PRODUCTS: Record<string, ProductManifestEntry> = {
  atlas: {
    slug: "atlas",
    name: "Atlas",
    description:
      "AI-native COO for fund-backed portfolio companies. Installed across a portco in 6 to 10 weeks, before the next quarterly board meeting.",
    category: "BusinessApplication",
    status: "pilot",
  },
  "atlas-discovery": {
    slug: "atlas-discovery",
    name: "Atlas Discovery",
    description:
      "Productized $25K+ AI operational audit. Two-week deliverable: operational map, AI opportunity ranking, outcome-eval scope, OP + CFO co-signed contract framing.",
    category: "BusinessApplication",
    status: "live",
  },
  sentinel: {
    slug: "sentinel",
    name: "Sentinel",
    description:
      "Due diligence and intel for the people Kroll won't take calls from. Open-source intelligence, adverse-media synthesis, sanctions checks. Pay-per-vet or managed diligence lane.",
    category: "BusinessApplication",
    status: "live",
  },
  sage: {
    slug: "sage",
    name: "Sage",
    description:
      "Personal AI OS with ambient context and a voice clone. Lives in Telegram, voice, and web. 15% of every subscription funds the Institute for Human Advancement.",
    category: "BusinessApplication",
    status: "live",
  },
  vellum: {
    slug: "vellum",
    name: "Vellum",
    description:
      "Institutional memory for organizations. Calls, docs, voice notes, channels — one queryable mind. Trial / $299 Operator / $1,500 Team / Institution. 30% mission-driven discount for verified 501(c)(3)s.",
    category: "BusinessApplication",
    status: "invite",
  },
  "development-intelligence": {
    slug: "development-intelligence",
    name: "Development Intelligence",
    description:
      "Evidence-linked conversation analysis for workforce development, interviews, meetings, and leadership coaching—with human review and longitudinal progress built in.",
    category: "BusinessApplication",
    status: "live",
  },
  "rfp-sentry": {
    slug: "rfp-sentry",
    name: "RFP Sentry",
    description:
      "Bid intelligence and compliance gate. RFPs scored against your capability statement, past wins, and team capacity. Federal, state, and foundation pipelines monitored on cadence.",
    category: "BusinessApplication",
    status: "invite",
  },
  press: {
    slug: "press",
    name: "Press",
    description:
      "Media production system running the HeyGen, ElevenLabs, Opus Clips, and Descript jobs as open-source models on hardware we own. $0/month to run. By invitation.",
    category: "BusinessApplication",
    status: "invite",
  },
};
