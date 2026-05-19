/**
 * JSON-LD structured data builders for SEO.
 * Strip whitespace from env-derived URLs (Vercel pulls can carry trailing \n).
 */

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com";
  return raw.replace(/\s+/g, "").replace(/\/$/, "");
}

export const ORG_NAME = "Perpetual Core";
export const ORG_LEGAL_NAME = "Perpetual Core LLC";

export function organizationSchema() {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: ORG_NAME,
    legalName: ORG_LEGAL_NAME,
    url: baseUrl,
    logo: `${baseUrl}/og-image.png`,
    description:
      "An AI-first studio installing operating systems for mission-driven organizations. Engagements start at $75,000. 10–15% of revenue funds the Institute for Human Advancement.",
    founder: {
      "@type": "Person",
      name: "Lorenzo Daughtry-Chambers",
      url: "https://lorenzodc.com",
    },
    parentOrganization: {
      "@type": "NGO",
      name: "Institute for Human Advancement",
      url: "https://theiha.org",
    },
    sameAs: [
      "https://theiha.org",
      "https://lorenzodc.com",
      "https://github.com/TPCMinistries",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: "lorenzo@perpetualcore.com",
        availableLanguage: ["English"],
      },
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@perpetualcore.com",
        availableLanguage: ["English"],
      },
    ],
  };
}

export function websiteSchema() {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: ORG_NAME,
    description: "AI-first studio for mission-driven organizations.",
    publisher: { "@id": `${baseUrl}/#organization` },
    inLanguage: "en-US",
  };
}

type ProductInput = {
  slug: string;
  name: string;
  description: string;
  category?: string;
  status?: "live" | "pilot" | "invite";
};

export function productSchema(p: ProductInput) {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}/products/${p.slug}#product`,
    name: p.name,
    description: p.description,
    applicationCategory: p.category || "BusinessApplication",
    operatingSystem: "Web",
    url: `${baseUrl}/products/${p.slug}`,
    publisher: { "@id": `${baseUrl}/#organization` },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/contact-sales?product=${p.slug}`,
      availability:
        p.status === "live"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
      priceCurrency: "USD",
      price: "0",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "USD",
        description: "Custom pricing. Contact sales for an engagement quote.",
      },
    },
  };
}

type FaqItem = { question: string; answer: string };

export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: i.answer,
      },
    })),
  };
}

type BreadcrumbItem = { name: string; path: string };

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}

type ServiceInput = {
  name: string;
  description: string;
  category: string;
  area?: string;
  priceFrom?: string;
};

export function serviceSchema(s: ServiceInput) {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.description,
    serviceType: s.category,
    provider: { "@id": `${baseUrl}/#organization` },
    areaServed: s.area || "Global",
    ...(s.priceFrom && {
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: s.priceFrom,
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "USD",
          description: `Engagements start at $${s.priceFrom}`,
        },
      },
    }),
  };
}
