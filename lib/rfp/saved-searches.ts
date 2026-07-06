import { z } from "zod";

export const RFP_SAVED_SEARCH_SOURCES = [
  "sam_gov",
  "grants_gov",
  "simpler_grants",
  "sbir",
  "fed_register",
  "nih_grants",
  "nsf_grants",
  "ny_state",
  "nyc_dycd",
  "nyc_hra",
  "nyc_doe",
  "ca_grants",
  "foundation_url",
] as const;

export const SavedSearchFiltersSchema = z
  .object({
    query: z.string().trim().max(100).default(""),
    sources: z.array(z.enum(RFP_SAVED_SEARCH_SOURCES)).default([]),
    deadline_within_days: z.union([z.literal(7), z.literal(30), z.null()]).default(null),
    min_amount: z.number().int().positive().nullable().default(null),
    actionability: z
      .union([
        z.literal("ready"),
        z.literal("needs_review"),
        z.literal("missing_info"),
        z.null(),
      ])
      .default(null),
    sort: z.union([z.literal("fit"), z.literal("readiness"), z.literal("deadline")]).default("fit"),
  })
  .strict();

export const SavedSearchModeSchema = z
  .enum(["all", "nonprofit", "forprofit"])
  .default("all");

export const SavedSearchBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    filters: SavedSearchFiltersSchema,
    mode: SavedSearchModeSchema,
    is_shared: z.boolean().default(false),
    alert_enabled: z.boolean().default(false),
    alert_frequency: z.enum(["instant", "daily", "weekly"]).default("weekly"),
    min_fit_score: z.number().min(0).max(100).default(70),
  })
  .strict();

export const SavedSearchPatchSchema = SavedSearchBodySchema.partial().strict();

export type SavedSearchFilters = z.infer<typeof SavedSearchFiltersSchema>;
export type SavedSearchMode = z.infer<typeof SavedSearchModeSchema>;
export type SavedSearchBody = z.infer<typeof SavedSearchBodySchema>;
export type SavedSearchPatch = z.infer<typeof SavedSearchPatchSchema>;

export interface RfpSavedSearch {
  id: string;
  org_id: string;
  created_by: string;
  name: string;
  filters: SavedSearchFilters;
  mode: SavedSearchMode;
  is_shared: boolean;
  alert_enabled: boolean;
  alert_frequency: "instant" | "daily" | "weekly";
  min_fit_score: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RfpSavedSearchWithPreview extends RfpSavedSearch {
  preview?: {
    matches_now: number;
    new_since_last_run: number;
  };
}

export const SAVED_SEARCH_COLUMNS =
  "id, org_id, created_by, name, filters, mode, is_shared, alert_enabled, alert_frequency, min_fit_score, last_run_at, created_at, updated_at";

export function normalizeSavedSearchRow(row: unknown): RfpSavedSearch {
  const raw = row as Omit<RfpSavedSearch, "filters" | "mode"> & {
    filters: unknown;
    mode: unknown;
  };
  const filters = SavedSearchFiltersSchema.parse(raw.filters ?? {});
  const mode = SavedSearchModeSchema.parse(raw.mode ?? "all");
  return {
    ...raw,
    filters,
    mode,
    min_fit_score: Number(raw.min_fit_score),
  };
}
