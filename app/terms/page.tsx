import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Perpetual Core RFP & Proposal Engine",
  description:
    "Terms of Service for the Perpetual Core RFP & Proposal Engine — government and grant opportunity discovery, vault-grounded proposal drafting, and submission tracking.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: June 1, 2026</p>
        </div>

        {/* Draft banner */}
        <div className="mb-8 rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-500 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Draft — pending counsel review.
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            This content is provided for informational purposes only and does
            not constitute legal advice. Review with qualified counsel before
            relying on it.
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the Perpetual Core RFP &amp; Proposal Engine
              ("Service") operated by Perpetual Core LLC, you agree to be bound
              by these Terms of Service. If you do not agree, please do not use
              the Service. Perpetual Core LLC is an operating company within the
              Institute for Human Advancement (IHA) ecosystem.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. Description of Service
            </h2>
            <p>
              The Service is an AI-assisted platform available at{" "}
              <strong>rfp.perpetualcore.com</strong> that helps organizations
              discover, evaluate, and respond to government and grant funding
              opportunities. Core capabilities include:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Opportunity Discovery:</strong> Surfacing relevant
                solicitations from public government data sources (SAM.gov,
                Grants.gov, SBIR.gov, NIH, NSF, and municipal open-data
                portals).
              </li>
              <li>
                <strong>Fit Scoring:</strong> AI-generated relevance scores
                comparing opportunities against your organization profile and
                vault documents.
              </li>
              <li>
                <strong>Proposal Drafting:</strong> AI-assisted generation of
                proposal content grounded in your uploaded vault documents.
              </li>
              <li>
                <strong>Compliance Review:</strong> Automated compliance and
                eligibility checking against solicitation requirements.
              </li>
              <li>
                <strong>Submission Tracking:</strong> Status and deadline
                management for active pursuits.
              </li>
            </ul>
            <p className="mt-4 font-medium">
              The Service does <em>not</em> auto-submit proposals. All
              submissions are made solely by the user. The Service gets you to
              submission-ready; you control whether and how anything is
              submitted.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. User Responsibilities
            </h2>
            <p>
              You are solely responsible for reviewing and verifying all
              AI-generated proposal content before submission to any government
              agency, foundation, or other funder. In particular:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                All factual statements, certifications, and representations in a
                submitted proposal are your responsibility regardless of how
                drafts were generated.
              </li>
              <li>
                You must ensure compliance with any applicable laws, regulations,
                solicitation requirements, and funder policies — including, where
                applicable, requirements to disclose AI use.
              </li>
              <li>
                You must not upload documents you do not have the right to
                process or share with AI service providers.
              </li>
              <li>
                You agree to use the Service only for lawful purposes and in
                accordance with these Terms.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. Government &amp; Public Data
            </h2>
            <p>
              Opportunity data is sourced from publicly available government and
              municipal databases, including SAM.gov, Grants.gov, SBIR.gov, NIH
              Reporter, NSF Award Search, and NYC / New Jersey open-data
              portals. Those sources&apos; own terms and licenses govern their
              data. Perpetual Core LLC does not redistribute data that is subject
              to license restrictions prohibiting AI or LLM use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. AI-Generated Content
            </h2>
            <p>
              Proposals generated by the Service are AI-assisted and may contain
              errors, omissions, or content that requires significant revision.
              AI-generated drafts are a starting point, not a finished product.
              See our{" "}
              <Link href="/ai-disclosure" className="text-primary hover:underline">
                AI-Use Disclosure
              </Link>{" "}
              for details on which AI providers process your data and the
              human-review requirements that apply — including relevant federal
              and grant funder AI-disclosure obligations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Intellectual Property
            </h2>
            <p>
              You retain all rights to content you upload to the vault. By
              uploading vault documents, you grant Perpetual Core LLC a limited,
              non-exclusive license to process that content solely to provide the
              Service (e.g., generating embeddings and proposal drafts). The
              Service and its original technology are owned by Perpetual Core
              LLC and protected by applicable intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              7. Limitation of Liability
            </h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as
              available.&quot; To the maximum extent permitted by law, Perpetual
              Core LLC shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of the
              Service, including but not limited to damages from inaccurate
              AI-generated content, proposal rejections, missed deadlines, or
              unsuccessful submissions.
            </p>
            <p className="mt-4">
              We make no warranties about the accuracy, completeness, or fitness
              for purpose of AI-generated proposal content, opportunity scores,
              or compliance assessments.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the
              Service at our discretion for conduct that violates these Terms or
              is harmful to other users, third parties, or Perpetual Core LLC.
              You may terminate your account at any time by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will
              be communicated by updating the &quot;Last updated&quot; date and,
              where appropriate, via email. Continued use of the Service after
              changes take effect constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
            <p>
              Questions about these Terms may be directed to:
            </p>
            <div className="mt-2 space-y-1">
              <p>
                <strong>Email:</strong> legal@perpetualcore.com
              </p>
              <p>
                <strong>Operator:</strong> Perpetual Core LLC
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            By using the Perpetual Core RFP &amp; Proposal Engine, you
            acknowledge that you have read, understood, and agree to be bound by
            these Terms of Service. You also acknowledge that all proposal
            submissions are your sole responsibility.
          </p>
        </div>
      </div>
    </div>
  );
}
