/**
 * /refund-policy — refund and cancellation policy for every product sold by
 * The Perpetual Core LLC (perpetualcore.com, rfp.perpetualcore.com,
 * sentinel.perpetualcore.com). Sister sites link here rather than keeping
 * their own copy, so this is the one place to change it.
 */

import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy | Perpetual Core",
  description:
    "How cancellations and refunds work for Perpetual Core subscriptions, fixed-scope services such as Proposal Desk, and monthly engagements.",
  alternates: { canonical: "/refund-policy" },
};

const SECTIONS = [
  {
    heading: "Who this covers",
    body: [
      "This policy applies to everything sold by The Perpetual Core LLC, including perpetualcore.com, RFP Engine (rfp.perpetualcore.com) and Sentinel (sentinel.perpetualcore.com).",
      "If a product page, proposal or signed agreement gives you a different refund term or guarantee, that term applies to that purchase.",
    ],
  },
  {
    heading: "Subscriptions",
    body: [
      "You can cancel a subscription at any time from your account's billing settings, or by emailing us. Cancellation stops the next renewal. You keep access until the end of the period you have already paid for.",
      "We don't refund partial months or unused time on a plan you cancel part-way through a billing period.",
      "If you are charged for a renewal you meant to cancel, email us within 14 days of the charge and we will refund that renewal in full, provided the service hasn't been used since the renewal.",
      "Annual plans can be cancelled for a full refund within 14 days of the first annual charge. After that, they run to the end of the paid year and won't renew.",
    ],
  },
  {
    heading: "Fixed-scope services (including Proposal Desk)",
    body: [
      "Fixed-scope work is billed as a 50% deposit when you order and the balance on delivery, unless your order says otherwise.",
      "Your deposit is fully refundable if you cancel before work begins. Work begins at the intake call, or when we start drafting from your documents, whichever comes first.",
      "Once work has begun, the deposit is non-refundable, because it covers time already spent on your project.",
      "If we miss the delivery date we committed to, you don't owe the balance.",
      "Each package includes the revision round stated in your order. We never charge a percentage of any award or contract you win.",
    ],
  },
  {
    heading: "Monthly engagements",
    body: [
      "Monthly services, such as Proposal Desk Monthly, are billed in advance each month and have the minimum term stated in your order.",
      "After the minimum term, cancel any time before your next billing date and you won't be billed again. The month already paid for is delivered in full and isn't refunded.",
    ],
  },
  {
    heading: "Free services",
    body: [
      "Free offers, such as the Proposal Desk Funding Scan, cost nothing and never convert into a paid order unless you accept a written quote.",
    ],
  },
  {
    heading: "Billing errors",
    body: [
      "If you are charged twice, charged the wrong amount, or charged for something you didn't order, we refund the error in full.",
    ],
  },
  {
    heading: "How to cancel or request a refund",
    body: [
      "Email info@perpetualcore.com from the address on your account. Include your organization name and the date or receipt of the charge.",
      "We reply within two business days. Approved refunds go back to your original payment method and usually appear within 5 to 10 business days, depending on your bank.",
      "If something has gone wrong, please contact us before disputing a charge with your bank. We can usually resolve it faster.",
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <span aria-hidden className="block h-1.5 w-1.5 bg-primary" />
            <p className="eyebrow !text-foreground/70">Policies</p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.035em] leading-[1.05] text-foreground mb-6">
            Refund and cancellation policy
          </h1>
          <p className="text-sm text-muted-foreground mb-12">
            The Perpetual Core LLC · Last updated October 6, 2026
          </p>

          <div className="divide-y divide-border border-y border-border">
            {SECTIONS.map((section) => (
              <section key={section.heading} className="py-8">
                <h2 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-4">
                  {section.heading}
                </h2>
                <div className="space-y-3">
                  {section.body.map((p) => (
                    <p key={p} className="text-base text-muted-foreground leading-[1.7]">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-10 text-sm text-muted-foreground leading-[1.7]">
            Questions:{" "}
            <a className="underline underline-offset-4 hover:text-foreground" href="mailto:info@perpetualcore.com">
              info@perpetualcore.com
            </a>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
