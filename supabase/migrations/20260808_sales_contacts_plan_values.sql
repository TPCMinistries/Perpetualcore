-- Widen sales_contacts.valid_interested_in to accept the plan values the form
-- actually submits.
--
-- /api/contact-sales validates `plan` against 16 planValues, then inserts it
-- into sales_contacts.interested_in. The CHECK constraint only permitted
-- 'Pro', 'Enterprise', 'Custom', 'business', 'enterprise', 'custom',
-- 'consultation' — written for an older pricing model and never updated when
-- the plans were renamed.
--
-- Only 3 of the 16 submittable values could satisfy it, and none of the ones
-- the current UI offers. So every real submission violated the constraint, the
-- insert failed, and the route returned HTTP 503 "We could not safely store
-- this inquiry" to the visitor. sales_contacts has 0 rows: not one sales
-- inquiry has ever made it through. The error was additionally gated on
-- NODE_ENV === "development", so production recorded nothing.
--
-- This is why public.leads has never held a source='contact-sales' row — the
-- request 503'd long before reaching the leads write.
--
-- Widening a CHECK is additive: no existing row can be invalidated by it (and
-- there are none). Legacy values are retained so historical data stays valid.

ALTER TABLE public.sales_contacts DROP CONSTRAINT IF EXISTS valid_interested_in;

ALTER TABLE public.sales_contacts ADD CONSTRAINT valid_interested_in CHECK (
  interested_in = ANY (ARRAY[
    -- current planValues — keep in sync with app/api/contact-sales/route.ts
    'software-access',
    'guided-setup',
    'first-workflow',
    'operating-lane-deposit',
    'manual-invoice',
    'company-ai-os',
    'department-ai-os',
    'studio-sprint-30',
    'studio-retainer',
    'product-subscription',
    'venture-partner',
    'institute-partner',
    'exploring',
    'Pro',
    'Enterprise',
    'Custom',
    -- legacy values, retained so historical rows remain valid
    'business',
    'enterprise',
    'custom',
    'consultation'
  ]::text[])
);
