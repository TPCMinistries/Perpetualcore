/**
 * Public intake contracts — the single source of truth for what the public
 * forms can submit, shared by the routes themselves and by the `intake-contract`
 * ops capability that checks those declarations against the live database.
 *
 * This module exists because of 2026-08-08. Three public intake paths had been
 * failing for months, each because what the code sends and what the database
 * accepts had silently diverged:
 *
 *   - /contact-sales   plan values drifted past a CHECK constraint  → 503 to every visitor
 *   - /package-intake  wrote 7 columns that do not exist            → 500 after the buyer paid
 *   - /api/early-access wrote to a table that never existed          → "You're on the list", stored nowhere
 *
 * Routes import their enums from here rather than declaring their own, so the
 * capability is checking the same values the route actually accepts. A manifest
 * that could drift from the code would reproduce the original bug in a new place.
 */

export const PLAN_VALUES = [
  "software-access",
  "guided-setup",
  "first-workflow",
  "operating-lane-deposit",
  "manual-invoice",
  "company-ai-os",
  "department-ai-os",
  "studio-sprint-30",
  "studio-retainer",
  "product-subscription",
  "venture-partner",
  "institute-partner",
  "exploring",
  "Pro",
  "Enterprise",
  "Custom",
] as const;

export const PACKAGE_VALUES = [
  "software-access",
  "guided-setup",
  "first-workflow",
  "operating-lane-deposit",
] as const;

/** Superset offered by /contact-sales. package-intake offers a subset, which is
 *  covered transitively — if every value here passes, any subset does. */
export const COMPANY_SIZE_VALUES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
  "1001+",
] as const;

/** One column a route writes, and the table it writes it to. */
export interface IntakeContract {
  /** human label used in findings */
  label: string;
  /** the public path a visitor actually uses */
  route: string;
  /** table this contract covers */
  table: string;
  /** every column the route writes to `table` — all must exist */
  columns: string[];
  /**
   * A column constrained by a CHECK, plus every value the route can put in it.
   * All values must satisfy the constraint or the write 4xx/5xxs at runtime.
   */
  enums?: { column: string; values: readonly string[] }[];
}

export const INTAKE_CONTRACTS: IntakeContract[] = [
  {
    label: "contact-sales → sales_contacts",
    route: "/contact-sales",
    table: "sales_contacts",
    columns: [
      "name",
      "email",
      "company",
      "phone",
      "company_size",
      "interested_in",
      "message",
      "product",
      "created_at",
      "status",
    ],
    enums: [
      { column: "interested_in", values: PLAN_VALUES },
      { column: "company_size", values: COMPANY_SIZE_VALUES },
      { column: "status", values: ["new"] },
    ],
  },
  {
    label: "contact-sales → leads",
    route: "/contact-sales",
    table: "leads",
    columns: [
      "user_id",
      "first_name",
      "last_name",
      "contact_name",
      "email",
      "contact_email",
      "phone",
      "company",
      "company_name",
      "company_size",
      "status",
      "source",
      "lead_type",
      "qualification_notes",
      "tags",
      "metadata",
      "updated_at",
      "created_at",
    ],
  },
  {
    label: "package-intake → leads",
    route: "/package-intake",
    table: "leads",
    columns: [
      "user_id",
      "first_name",
      "last_name",
      "contact_name",
      "email",
      "contact_email",
      "phone",
      "company",
      "company_name",
      "company_size",
      "status",
      "source",
      "lead_type",
      "qualification_notes",
      "tags",
      "metadata",
      "updated_at",
      "created_at",
    ],
  },
  {
    label: "early-access → early_access",
    route: "/api/early-access",
    table: "early_access",
    columns: ["email", "product", "source", "created_at"],
  },
  {
    label: "newsletter capture → leads",
    route: "/api/leads/capture",
    table: "leads",
    columns: ["email", "source", "created_at"],
  },
];
