import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "AI-Use Disclosure | Perpetual Core RFP & Proposal Engine",
  description:
    "Disclosure of how artificial intelligence is used in the Perpetual Core RFP & Proposal Engine, which AI providers process your data, the human-review requirement, and federal and grant funder AI-disclosure obligations.",
};

export default function AiDisclosurePage() {
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
          <h1 className="text-4xl font-bold mb-2">AI-Use Disclosure</h1>
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
              1. How AI Is Used in This Product
            </h2>
            <p>
              The Perpetual Core RFP &amp; Proposal Engine uses large-language
              models (LLMs) and embedding models throughout its core workflow.
              Specifically, AI is used to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Fit Scoring:</strong> Evaluate each funding opportunity
                against your organization profile and vault documents and assign
                a relevance score. Scores reflect AI judgment and should be
                treated as a starting signal, not a definitive assessment.
              </li>
              <li>
                <strong>Draft Generation:</strong> Produce full or section-level
                proposal drafts grounded in your uploaded vault documents
                (past proposals, annual reports, program descriptions) and the
                solicitation requirements.
              </li>
              <li>
                <strong>Adversarial Review:</strong> Critique drafts for logical
                gaps, unsupported claims, and weak sections — simulating a
                reviewer&apos;s perspective before you submit.
              </li>
              <li>
                <strong>Compliance Checking:</strong> Identify whether a draft
                addresses key eligibility and submission requirements stated in
                the solicitation, and flag missing elements.
              </li>
              <li>
                <strong>Embeddings &amp; Semantic Search:</strong> Convert vault
                documents and opportunity text into vector representations to
                enable retrieval-augmented generation (RAG) — surfacing the most
                relevant portions of your vault when drafting a specific section.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. Which AI Providers Process Your Data
            </h2>
            <p>
              When you use AI features in the Service, your vault documents,
              organization profile context, and opportunity details are sent to
              one or more of the following third-party AI providers:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Anthropic (Claude):</strong> Used for proposal drafting,
                adversarial review, compliance checking, and fit-score
                narratives. Vault document excerpts and opportunity text are
                included in the prompt context. Subject to{" "}
                <a
                  href="https://www.anthropic.com/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Anthropic&apos;s Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>OpenAI:</strong> Used for embedding generation (text
                converted to vectors for semantic search). Input text is sent to
                OpenAI&apos;s embeddings API. Subject to{" "}
                <a
                  href="https://openai.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI&apos;s Privacy Policy
                </a>
                .
              </li>
            </ul>
            <p className="mt-4">
              Under standard enterprise API terms, these providers do not use
              your input data to train their models. You should review each
              provider&apos;s terms to confirm this for your specific use case,
              particularly if your vault documents contain sensitive or
              proprietary information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. Human Review Requirement
            </h2>
            <p>
              AI-generated drafts are a starting point. The Service is designed
              to get you to a submission-ready state; it does{" "}
              <strong>not</strong> auto-submit anything to any government agency,
              foundation, or other funder.
            </p>
            <p className="mt-4">
              Before submitting any proposal generated or assisted by this
              Service, you must:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Review every section for factual accuracy, completeness, and
                compliance with the solicitation requirements.
              </li>
              <li>
                Verify that all data, statistics, certifications, and
                representations are accurate and authorized by your organization.
              </li>
              <li>
                Ensure compliance with any funder-specific policies regarding
                AI-assisted content, including any disclosure requirements (see
                Section 4).
              </li>
            </ul>
            <p className="mt-4">
              The user is solely responsible for the accuracy, compliance, and
              legal sufficiency of any submitted proposal, regardless of how
              the draft was generated.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. Federal &amp; Grant Compliance Context
            </h2>
            <p>
              Organizations using AI assistance in responses to federal
              solicitations should be aware of applicable disclosure and
              compliance requirements. Requirements vary by agency, solicitation
              type, and program. The following is provided as general context,
              not legal advice; consult qualified counsel for your specific
              situation.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              4.1 Federal Acquisition / GSA GSAR Clause 552.239-7001
            </h3>
            <p>
              Federal contractors and prospective contractors responding to
              General Services Administration (GSA) and other federal
              solicitations may be subject to GSA GSAR clause{" "}
              <strong>552.239-7001</strong> (Prohibition on Use of Artificial
              Intelligence for Certain Systems) and related AI-governance
              provisions. This clause governs the use of AI in IT systems that
              process federal data and may impose notification, transparency, or
              prohibition requirements depending on the solicitation and contract
              type.
            </p>
            <p className="mt-4">
              If you are responding to a federal solicitation, review the full
              text of any AI-related clauses incorporated into that solicitation
              and determine whether disclosing the AI-assisted nature of your
              proposal content is required or appropriate. Perpetual Core LLC
              provides a draft AI-use disclosure notice within the compliance
              gate feature (Phase 19 of the product roadmap) to help you
              satisfy this requirement.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              4.2 NIH Grant Applications
            </h3>
            <p>
              The National Institutes of Health (NIH) has issued guidance on the
              use of AI in grant applications. As of 2024, NIH generally expects
              applicants to disclose when AI tools were used to assist in writing
              an application if the funder&apos;s policies so require, and
              reviewers are expected to flag applications that appear to rely
              heavily on AI-generated content without appropriate human
              oversight. NIH policy evolves; always consult the current NIH
              policy and the specific Funding Opportunity Announcement (FOA)
              before submission.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">
              4.3 Other Funders
            </h3>
            <p>
              Many other federal agencies, private foundations, and municipal
              funders are developing or have issued policies on AI use in grant
              applications. Review the applicable guidance for each funder and
              solicitation before using AI-generated content in a submission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. Controlling AI Use
            </h2>
            <p>
              You control when AI features are invoked. Specifically:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                AI drafting and scoring are initiated by explicit user actions
                (clicking &quot;Generate Draft,&quot; &quot;Score,&quot; etc.),
                not automatically.
              </li>
              <li>
                You may edit or entirely replace AI-generated content before
                submission.
              </li>
              <li>
                Vault documents are only sent to AI providers when you actively
                request a feature that requires them (e.g., generating a
                draft or running a vault search).
              </li>
              <li>
                If you need to limit AI processing due to policy constraints,
                contact us at{" "}
                <a
                  href="mailto:legal@perpetualcore.com"
                  className="text-primary hover:underline"
                >
                  legal@perpetualcore.com
                </a>{" "}
                to discuss your options.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Data Retention for AI-Processed Content
            </h2>
            <p>
              Vault documents and proposal context sent to AI providers are
              processed in real time for each request. Under standard enterprise
              API terms, Anthropic and OpenAI do not retain this input data
              beyond the immediate processing window and do not use it to train
              their models. Perpetual Core LLC stores the{" "}
              <em>outputs</em> (draft text, embeddings, scores) in your
              account&apos;s tenant-isolated database until you delete them or
              close your account.
            </p>
            <p className="mt-4">
              For detailed retention periods, see our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Contact</h2>
            <p>
              Questions about AI use in this product may be directed to:
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
            This disclosure describes how Perpetual Core LLC uses artificial
            intelligence in the RFP &amp; Proposal Engine as of the date above.
            Federal AI requirements evolve; consult qualified counsel before
            submitting AI-assisted proposals to government agencies or grant
            funders.
          </p>
        </div>
      </div>
    </div>
  );
}
