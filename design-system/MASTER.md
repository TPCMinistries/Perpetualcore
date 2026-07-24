# Perpetual Core V3 Design System

## Experience model

Perpetual Core should feel like a living company system, not an enterprise
consulting deck. A visitor should understand the promise, see a product-shaped
interface, choose the operating job, discover a system, and select an engagement
path without decoding the internal architecture first.

## Visual direction

- Warm canvas: `#f7f6f2` with off-white and pale lavender surfaces.
- Primary ink: `#17171b`; primary signal: `#5548d9`.
- Supporting signals: coral `#ff6b4a`, blue `#3276e8`, teal `#168a72`,
  magenta `#e04d7f`, and amber `#e98a24`.
- Use Inter as a clean product typeface. Do not use italic display serif on the
  public V3 homepage or marketplace.
- Hero headlines cap at 70px desktop and 46px mobile. Body copy is 16–20px with
  solid contrast and a readable line length.
- Product visuals and representative interfaces carry the story. Avoid abstract
  grids, cyberpunk glow, inventory dashboards, and walls of text.
- Use rounded 20–30px product surfaces, restrained ambient gradients, soft
  depth, and asymmetrical bento layouts.

## Page rhythm

- Homepage: six focused sections maximum.
- Marketplace: compact hero, catalog, and Studio escalation only.
- Prefer one warm content canvas with one deliberate ink section.
- Avoid repeated three-column bordered grids and alternating dark/light bands.
- Marketplace cards contain name, availability, one outcome sentence, delivery,
  and one action. Deeper detail belongs on product pages.

## Interaction

- Minimum 44px targets for navigation, filters, and controls.
- Visible focus states on every interactive element.
- Category filters use `aria-pressed`; result counts use a polite live region.
- Product cards may lift by no more than 4px on hover.
- Motion uses opacity or transforms for 150–300ms and honors
  `prefers-reduced-motion`.

## Responsive rules

- Verify at 375px, 768px, 1024px, and 1440px.
- Filter controls may scroll horizontally, but the document must not overflow.
- Hero becomes a single-column narrative followed by the product canvas.
- Product bento collapses to one column without losing visual hierarchy.
- Necessary copy never falls below 12px or low-contrast gray.

## Content and evidence rules

- Lead with the customer job, not the internal arm.
- Clearly distinguish live, pilot, private, invitation, build, and installed
  engagement availability.
- Representative product visuals must not imply real customer data or outcomes.
- Never fabricate customers, creator counts, installs, revenue, or outcomes.
- Sage coordinates approved context; raw and protected records remain in their
  authoritative systems.
- Consequential actions retain explicit human authority.
