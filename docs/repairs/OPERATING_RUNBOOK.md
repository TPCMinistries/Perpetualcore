# Perpetual Core repairs — operating runbook

Prepared September 5, 2026. This is the operating procedure for a first paid service, not a customer or revenue claim.

## Offer and capacity

Buyer: an owner or agency with an existing Next.js application or automation and one reproducible failure. Initial offer: $300 USD for one accepted repair, at most two connected systems, verification evidence and a short runbook. A broader rebuild, a new multi-system installation, additional defects, third-party fees and ongoing maintenance need their own scope. No subscription is included.

Use a free initial scope review to determine fit; it is not free implementation. Agree the exact failure, acceptance examples, access needs, price and realistic delivery date in writing before requesting payment. Limit the first pilot to one active customer so observed delivery effort informs capacity. The owner has authorized ordinary commercial work; do not create a repeated owner-approval step for routine replies and delivery decisions.

## Acquisition and intake

The /repairs page prepares a brief locally and opens the visitor's email app addressed to the owner-designated commercial mailbox, info@perpetualcore.com. It does not submit a lead, upload a file, charge a card or claim delivery. Copy/download provide a fallback if the visitor has no mail handler. Authenticated mailbox access is verified; inbound receipt still needs a delivery test before the campaign begins. Gmail lists billing@, hello@, lorenzo@ and sales@perpetualcore.com as configured send-as addresses. Keep info@ as intake, sales@ for sales correspondence, and billing@ for invoices after the relevant delivery path is tested.

Use one commercial sender and a monitored reply channel. Prioritize direct requests for one defect; answer through the original marketplace where applicable. Check whether the buyer is still hiring and whether proposal credits cost money. The incremental spending limit remains $0. Never submit unverified portfolio claims. A real prior software project is capability evidence, not evidence of paid repair customers.

Revenue Studio is the intended commercial record. Persist in its authenticated Perpetual Core workspace when available. Do not put prospect records or customer exports into LDC Brain, Sage, Uplift, IHA or this source repository. This document contains templates only.

## Scope confirmation message

Subject: Your repair scope — [short issue]

The issue we will repair is [observed failure] in [application/workflow and version]. The agreed result is [observable behavior]. The $300 scope includes [specific patch/configuration], [acceptance examples], and a short troubleshooting handoff. It does not include [relevant additional requests]. We need [scoped access and redacted inputs]. The delivery date is [date agreed after inspection], assuming that access is available by [date]. We use AI-assisted engineering and verify the result against these examples. Please confirm this scope before we issue the payment request.

Fill every bracket from actual evidence before sending. If diagnosis shows the work does not fit, state that before accepting the fixed-price job.

## Delivery sequence

1. Obtain a reproducible example and client-approved access to a copy/test environment. Customer files stay in their authorized workspace. Do not ask for passwords or paste secrets into source.
2. Record the failing result before changing anything. For n8n exports, run `node scripts/repairs/preflight.ts input.json report.json` using Node 24. The inspector is static; it cannot prove connectors or execution work.
3. Make the smallest repair in a branch or copied workflow. Preserve the original so the change can be reverted.
4. Test the original failure, normal behavior and relevant edge cases. For write automations include repeated events, missing fields and destination failures; verify that recovery does not duplicate a write.
5. Show the customer the result and the patch/configuration. Obtain authorization for activation in their environment, verify the live path, and provide the runbook.
6. Record customer acceptance separately from payment. An invoice, checkout return or proposal is not settled revenue. Verify the provider receipt before reporting collected cash.

## Payment preparation

The owner designated Mercury as the receiving bank. The authenticated Mercury workspace is The Perpetual Core. The owner supplied receiving-account details, matching the checking account shown in that workspace. Native invoicing is available. Full banking details stay in the bank; no bank configuration or money movement has occurred.

Proposed one-time line item: `Perpetual Core — scoped workflow/software repair`; currency USD; amount 30000 cents; quantity 1; no recurring interval. Description must identify the agreed scope. Do not create a broad public pay-now link that accepts unreviewed jobs.

A read-only check found an existing live Stripe account with charges and payouts enabled, but its public business profile points to Lorenzo Daughtry Chambers / lorenzodc.com. Confirm the intended merchant account before issuing Perpetual Core payment requests. No product, price, invoice, checkout, charge or transfer was created during setup. Existing package links charge other amounts and must not be reused for this offer.

## Operating status and diagnosis

For each real job keep: stage, latest receipt, next action, due date, blocker, elapsed work time, model usage, owner minutes, Sarah's minutes, external cost, accepted result and settled payment. Use an authorized commercial system, not this repository, for client identities and message bodies.

Stages: inquiry → scoped → customer-confirmed → payment-requested → funded → in-progress → delivered → accepted → closed. A rejected scope or refund is a separate explicit event. Report payment processing, collected cash, refunds and processor fees separately.

Diagnosis follows the evidence: no replies → inspect targeting/channel; replies but no scopes → inspect fit and clarity; scopes but no payment → inspect buyer objections and payment path; late repairs → inspect access waits and implementation time; repeated failures → inspect tests and failure alerts. Do not diagnose a zero-send campaign as weak demand.

No unattended campaign or continuous monitoring has been activated. When a runtime and monitored commercial account are available, schedule checks against real records and notify the owner only about meaningful changes, failures, or required decisions.
