import { MetadataRoute } from "next";

// Defensive: env vars pulled from Vercel can carry a trailing \n which corrupts
// the Sitemap directive. Strip all whitespace and trailing slashes.
function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com";
  return raw.replace(/\s+/g, "").replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/auth/",
          "/admin",
          "/admin/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/accept-invite",
          "/invite/",
          "/test-upload",
          "/test-documents",
          "/presentation",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
