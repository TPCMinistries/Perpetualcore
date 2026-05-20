/**
 * RSS 2.0 feed for /blog. When the post list moves to MDX or a CMS,
 * this should pull from that source. For now, the post list is
 * maintained in-file alongside app/blog/page.tsx — keep them in sync.
 */

import { NextResponse } from "next/server";

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com";
  return raw.replace(/\s+/g, "").replace(/\/$/, "");
}

type Post = {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  author: string;
};

const POSTS: Post[] = [
  {
    slug: "what-an-ai-install-actually-costs",
    title: "What an AI install actually costs",
    subtitle:
      "And why we price engagements at $75,000. An honest breakdown of the four cost buckets: vendor subscriptions, engineering time, integration debt, and outcome evaluation.",
    date: "2026-05-20",
    author: "Lorenzo Daughtry-Chambers",
  },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toUTCString();
}

export async function GET() {
  const baseUrl = getBaseUrl();
  const buildDate = new Date().toUTCString();
  const latestDate =
    POSTS.length > 0 ? rfc822(POSTS[0].date) : buildDate;

  const items = POSTS.map((post) => {
    const link = `${baseUrl}/blog/${post.slug}`;
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${rfc822(post.date)}</pubDate>
      <description>${escapeXml(post.subtitle)}</description>
      <dc:creator>${escapeXml(post.author)}</dc:creator>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Perpetual Core — Notes</title>
    <link>${baseUrl}/blog</link>
    <description>Occasional dispatches on AI installs, the Engine commitment, and what we're shipping. Written by Lorenzo Daughtry-Chambers.</description>
    <language>en-us</language>
    <copyright>© 2026 Perpetual Core</copyright>
    <pubDate>${latestDate}</pubDate>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
