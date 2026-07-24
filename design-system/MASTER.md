# Perpetual Core V2 Design System

## Product and experience model

Perpetual Core is an enterprise gateway with three buyer-facing entry points:
Platform, Marketplace, and Studio. The interface should help a buyer understand
the company first, discover the right capability second, and decode the deeper
Engine/Fund/Institute structure only when useful.

## Visual direction

- Preserve the existing high-trust editorial voice: Inter for interface copy,
  Instrument Serif for rare strategic emphasis, and JetBrains Mono for operating
  labels.
- Use a near-black engine canvas with electric violet, cyan, and mint signals for
  platform and marketplace sections.
- Use white and cool-lavender surfaces for explanatory company sections.
- Favor structured blocks, hairline borders, operating diagrams, and meaningful
  status labels over decorative product mockups.
- Avoid generic SaaS gradients, inflated metrics, anonymous testimonials, stock
  imagery, and large type that displaces the product story.

## Interaction

- Minimum 44px targets for navigation, filters, and controls.
- Visible focus states on every interactive element.
- Category filters use `aria-pressed`; filtered result counts use a polite live
  region.
- Hover states may change color or border but must not shift layout.
- Motion must honor `prefers-reduced-motion`.

## Responsive rules

- Verify at 375px, 768px, 1024px, and 1440px.
- Filter controls may scroll horizontally, but the page must never create
  horizontal document overflow.
- Cards collapse from three columns to two and then one.
- Operating diagrams become vertical flows on small screens.

## Content rules

- Lead with the customer job, not the internal arm.
- Clearly distinguish live, pilot, private, invitation, build, and installed
  engagement availability.
- Never fabricate customers, creator counts, installs, revenue, or outcomes.
- Describe Sage as a governed coordination interface. Raw and protected records
  remain in authoritative product and program systems.
- Consequential actions retain explicit human authority.

