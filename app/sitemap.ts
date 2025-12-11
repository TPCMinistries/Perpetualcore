import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.ai";

  // Public pages that should be indexed
  const routes = [
    "",
    "/features",
    "/pricing",
    "/about",
    "/contact",
    "/blog",
    "/docs",
    "/privacy",
    "/terms",
    "/marketplace",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));
}
