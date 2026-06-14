import { MetadataRoute } from "next";

// Defensive: env vars pulled from Vercel can carry a trailing \n which corrupts
// every <loc> in the rendered sitemap. Strip all whitespace and trailing slashes.
function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com";
  return raw.replace(/\s+/g, "").replace(/\/$/, "");
}

const RFP_BASE = "https://rfp.perpetualcore.com";

// RFP Engine — separate subdomain, own sitemap entries. Listed inline with
// absolute URLs so they get the correct host even when NEXT_PUBLIC_APP_URL
// points at the parent (www.perpetualcore.com / perpetualcore.ai).
const rfpPages: MetadataRoute.Sitemap = [
  { url: `${RFP_BASE}/rfp`, priority: 1.0, changeFrequency: "weekly", lastModified: new Date() },
  { url: `${RFP_BASE}/rfp/how-it-works`, priority: 0.9, changeFrequency: "monthly", lastModified: new Date() },
  { url: `${RFP_BASE}/rfp/pricing`, priority: 0.9, changeFrequency: "monthly", lastModified: new Date() },
  { url: `${RFP_BASE}/rfp/trust`, priority: 0.7, changeFrequency: "monthly", lastModified: new Date() },
  { url: `${RFP_BASE}/rfp/vs`, priority: 0.7, changeFrequency: "monthly", lastModified: new Date() },
  { url: `${RFP_BASE}/rfp/roadmap`, priority: 0.7, changeFrequency: "weekly", lastModified: new Date() },
  { url: `${RFP_BASE}/rfp/roi`, priority: 0.8, changeFrequency: "monthly", lastModified: new Date() },
  { url: `${RFP_BASE}/rfp/changelog`, priority: 0.6, changeFrequency: "weekly", lastModified: new Date() },
  { url: `${RFP_BASE}/contact-sales/rfp-engine`, priority: 0.8, changeFrequency: "monthly", lastModified: new Date() },
];

type Page = {
  path: string;
  priority: number;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  const mainPages: Page[] = [
    { path: "", priority: 1.0, changeFrequency: "daily" },
    { path: "/features", priority: 0.9, changeFrequency: "weekly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
    { path: "/packages", priority: 0.9, changeFrequency: "weekly" },
    { path: "/products", priority: 0.9, changeFrequency: "weekly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/compare", priority: 0.8, changeFrequency: "weekly" },
    { path: "/compare/vs-chatgpt-teams", priority: 0.8, changeFrequency: "monthly" },
    { path: "/compare/vs-claude-for-teams", priority: 0.8, changeFrequency: "monthly" },
    { path: "/compare/vs-microsoft-copilot", priority: 0.8, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
    { path: "/blog/the-75k-floor", priority: 0.8, changeFrequency: "monthly" },
    { path: "/blog/what-an-ai-install-actually-costs", priority: 0.7, changeFrequency: "monthly" },
    { path: "/blog/outcome-eval-the-line-item-every-ai-install-skips", priority: 0.7, changeFrequency: "monthly" },
    { path: "/guide/ai-implementation-buyers-guide", priority: 0.8, changeFrequency: "monthly" },
    { path: "/docs", priority: 0.6, changeFrequency: "monthly" },
    { path: "/help", priority: 0.6, changeFrequency: "monthly" },
    { path: "/agents", priority: 0.7, changeFrequency: "weekly" },
    { path: "/marketplace", priority: 0.7, changeFrequency: "weekly" },
    { path: "/partners", priority: 0.6, changeFrequency: "monthly" },
    { path: "/partners/apply", priority: 0.5, changeFrequency: "monthly" },
    // NOTE: /consultation and /consulting omitted — both 301 to studio routes
    // (see next.config.mjs redirects). Including redirecting URLs in sitemaps
    // is an SEO anti-pattern.
    { path: "/contact-sales", priority: 0.7, changeFrequency: "monthly" },
    { path: "/enterprise-demo", priority: 0.7, changeFrequency: "monthly" },
    { path: "/roi-calculator", priority: 0.7, changeFrequency: "monthly" },
    { path: "/lead-magnet", priority: 0.7, changeFrequency: "monthly" },
    { path: "/start", priority: 0.9, changeFrequency: "monthly" },
    // /productivity-guide retired — 301 to /lead-magnet via next.config
    { path: "/professional-services", priority: 0.7, changeFrequency: "monthly" },
    { path: "/executive-suite", priority: 0.7, changeFrequency: "monthly" },
    { path: "/ai-readiness-quiz", priority: 0.6, changeFrequency: "monthly" },
    { path: "/developers", priority: 0.6, changeFrequency: "monthly" },
    { path: "/fund", priority: 0.7, changeFrequency: "monthly" },
    { path: "/institute", priority: 0.7, changeFrequency: "monthly" },
    { path: "/engine", priority: 0.7, changeFrequency: "monthly" },
    { path: "/engine/spec", priority: 0.5, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  ];

  const studioPages: Page[] = [
    { path: "/studio", priority: 0.9, changeFrequency: "weekly" },
    { path: "/studio/engagements", priority: 0.8, changeFrequency: "monthly" },
    { path: "/studio/retainers", priority: 0.8, changeFrequency: "monthly" },
    { path: "/studio/methodology", priority: 0.7, changeFrequency: "monthly" },
    { path: "/studio/process", priority: 0.7, changeFrequency: "monthly" },
    { path: "/studio/case-studies", priority: 0.7, changeFrequency: "weekly" },
  ];

  const productPages: Page[] = [
    "atlas",
    "atlas-discovery",
    "sentinel",
    "sage",
    "vellum",
    "rfp-sentry",
  ].map((slug) => ({
    path: `/products/${slug}`,
    priority: 0.8,
    changeFrequency: "weekly" as const,
  }));

  // Canonical vertical pages = /solutions/*. /industries/* now 301s to these
  // via next.config redirects, so they intentionally don't appear here.
  const solutionPages: Page[] = [
    "accountants",
    "agencies",
    "churches",
    "consulting",
    "education",
    "financial-advisors",
    "healthcare",
    "it-services",
    "law-firms",
    "non-profits",
    "real-estate",
    "sales",
  ].map((slug) => ({
    path: `/solutions/${slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  const allPages = [
    ...mainPages,
    ...studioPages,
    ...productPages,
    ...solutionPages,
  ];

  const lastModified = new Date();

  return [
    ...allPages.map((page) => ({
      url: `${baseUrl}${page.path}`,
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...rfpPages,
  ];
}
