import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.ai";

  const mainPages = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/features", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/marketplace", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/partners", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/consultation", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/roi-calculator", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/lead-magnet", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/productivity-guide", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/professional-services", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/executive-suite", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/ai-readiness-quiz", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/developers", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/status", priority: 0.5, changeFrequency: "daily" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "monthly" as const },
    { path: "/cookies", priority: 0.3, changeFrequency: "monthly" as const },
  ];

  const solutionPages = [
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

  const industryPages = [
    "law-firm",
    "healthcare",
    "sales",
    "consulting",
    "education",
    "real-estate",
    "accounting",
    "marketing-agency",
    "it-services",
    "financial-advisory",
    "non-profit",
    "church",
  ].map((slug) => ({
    path: `/industries/${slug}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));

  const allPages = [...mainPages, ...solutionPages, ...industryPages];

  return allPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
