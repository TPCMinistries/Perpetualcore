/**
 * Letter #001 of The Install. URL kept for link stability, narrative updated
 * away from floor-first pricing and toward AI operating-system implementation.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { NewsletterCapture } from "@/components/landing/NewsletterCapture";

const POST_TITLE = "What an AI operating system actually takes";
const POST_SUBTITLE =
  "Why serious AI work starts with the business map, not the model.";
const POST_DATE = "2026-05-22";
const POST_AUTHOR = "Lorenzo Daughtry-Chambers";
const READ_MINUTES = 6;

export const metadata = {
  title: `${POST_TITLE} — The Install · Perpetual Core`,
  description:
    "A practical letter on what it takes to install AI across a company: operating map, data surface, workflow ownership, governance, adoption, and expansion.",
  openGraph: {
    type: "article",
    title: POST_TITLE,
    description:
      "What a durable AI operating-system install requires beyond a chatbot or isolated workflow automation.",
    publishedTime: `${POST_DATE}T00:00:00Z`,
    authors: [POST_AUTHOR],
  },
};

function articleSchema() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com")
    .replace(/\s+/g, "")
    .replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: POST_TITLE,
    description:
      "What a company needs before AI can become part of its operating system.",
    image: `${baseUrl}/og-image.png`,
    datePublished: `${POST_DATE}T00:00:00Z`,
    dateModified: `${POST_DATE}T00:00:00Z`,
    author: {
      "@type": "Person",
      name: POST_AUTHOR,
      url: "https://lorenzodc.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Perpetual Core",
      logo: { "@type": "ImageObject", url: `${baseUrl}/og-image.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/the-75k-floor`,
    },
  };
}

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 text-muted-foreground">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{index}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{label}</span>
    </div>
  );
}

export default function PostPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          articleSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "The Install", path: "/blog" },
            { name: POST_TITLE, path: "/blog/the-75k-floor" },
          ]),
        ]}
      />
      <Navbar />

      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-baseline gap-3 mb-8 text-muted-foreground">
            <Link href="/blog" className="font-mono text-[10px] uppercase tracking-[0.22em] hover:text-foreground transition">
              ← The Install
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
              · {POST_DATE} · {READ_MINUTES} min read · #001
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.025em] text-foreground mb-4">
            {POST_TITLE}
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground leading-[1.4]">
            {POST_SUBTITLE}
          </p>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            By Lorenzo Daughtry-Chambers
          </p>
        </div>
      </section>

      <article className="container mx-auto px-6 sm:px-8 pb-20">
        <div className="max-w-2xl mx-auto prose-content">
          <p>
            Most companies do not have an AI strategy problem. They have an operating-system
            problem that AI finally makes visible.
          </p>

          <p>
            The sales team has context in calls and inboxes. Operations has the truth in
            spreadsheets, project tools, and memory. Leadership has dashboards that lag the work.
            Customers experience the gaps between those systems as delay, inconsistency, and
            follow-up that depends on who remembered what.
          </p>

          <p>
            Dropping a chatbot into that environment may feel modern for a week. It does not change
            the company. A real install starts by mapping where the business already moves.
          </p>

          <h2>The first layer is the operating map.</h2>

          <p>
            Before we build, we need to know how work actually travels: who receives the lead, where
            the note goes, who writes the proposal, who owns the handoff, what the customer hears,
            what leadership sees, and where the follow-through breaks.
          </p>

          <p>
            This matters for a furniture and interiors company. It matters for a local business. It
            matters for a professional services firm. The industry changes; the operating question
            stays stable.
          </p>

          <h2>The second layer is the data surface.</h2>

          <p>
            AI cannot reason from company knowledge it cannot access. Catalogs, proposals, customer
            history, project notes, call transcripts, service issues, policies, templates, and
            prior decisions all need a place in the system.
          </p>

          <p>
            This does not mean every file goes into one messy folder. It means the company needs a
            usable memory layer: structured enough to trust, flexible enough to grow.
          </p>

          <h2>The third layer is workflow ownership.</h2>

          <p>
            Every useful AI system needs an owner. Someone has to know whether the sales follow-up
            assistant is helping. Someone has to approve the proposal workflow. Someone has to say
            what good looks like.
          </p>

          <p>
            This is why we usually start with one strong wedge. Not because the ambition is small.
            Because the first workflow teaches the company how the full system should behave.
          </p>

          <h2>The fourth layer is adoption.</h2>

          <p>
            If the team does not use it, it is not installed. It is just software nearby.
            Installation means the system enters the operating rhythm: intake, review, follow-up,
            reporting, escalation, and decision-making.
          </p>

          <p>
            Training is not a courtesy at the end. It is part of the build.
          </p>

          <h2>The fifth layer is expansion.</h2>

          <p>
            A lead follow-up system can become sales intelligence. A proposal workflow can become a
            knowledge engine. A project visibility layer can become leadership reporting. The point
            is not to automate one task forever. The point is to build a path from the first win to
            the company operating system.
          </p>

          <p>
            That is what Perpetual Core is built to do: enter through the strongest operating pain,
            prove value quickly, and expand the system with discipline.
          </p>
        </div>
      </article>

      <section className="border-t border-border py-16 sm:py-20 bg-card/40">
        <div className="container mx-auto px-6 sm:px-8 max-w-2xl">
          <SectionRail index="—" label="Start here" />
          <h3 className="mt-6 text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-foreground mb-4">
            Map the first operating surface.
          </h3>
          <p className="text-base text-muted-foreground leading-[1.7] mb-8">
            If you run a company, the first question is not which model to use. It is where AI
            should touch sales, operations, knowledge, customers, reporting, and decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="/contact-sales">
                Map my AI operating system <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
              <Link href="/lead-magnet">Get the checklist</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8 max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
            The Install · Occasional letters from Lorenzo
          </p>
          <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-foreground mb-4">
            Field notes from inside the work.
          </h3>
          <NewsletterCapture variant="inline" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
