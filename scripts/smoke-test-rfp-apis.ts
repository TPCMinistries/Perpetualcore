#!/usr/bin/env tsx
/**
 * RFP API Smoke Test
 *
 * Hits each Discovery source's ping endpoint and reports per-source PASS/SKIP/FAIL.
 *
 * Exit codes:
 *   0 — all public sources passed + at least one auth source passed
 *   1 — all auth sources skipped (keys not yet provisioned) but public sources OK
 *   2 — a public (no-auth) source failed — infrastructure problem
 *   3 — an auth-required source returned 401/403/error with a key present — bad key
 *
 * Re-run command after SAM.gov key lands:
 *   npm run smoke:rfp-apis
 *
 * No code change is needed when new keys arrive — just set the env var and re-run.
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local first (real values), fall back to .env (example values are fine for defaults).
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Import after dotenv so env validation picks up the loaded vars.
// Using relative path to avoid tsconfig-paths resolution issues when running standalone.
import { RFP_SOURCES, type RfpSourceName } from "../lib/rfp/sources";
// We import env only for key presence checks. Base URLs come from RFP_SOURCES which
// uses env internally — but if env validation fails (e.g. Supabase keys not in shell),
// the base URL env vars won't have their Zod defaults applied. Guard here.
import { env } from "../lib/env";

type ResultStatus = "pass" | "fail" | "skip" | "error";

interface SmokeResult {
  source: RfpSourceName;
  status: ResultStatus;
  httpStatus?: number;
  message?: string;
}

async function ping(name: RfpSourceName): Promise<SmokeResult> {
  const src = RFP_SOURCES[name];

  // Skip auth-required sources when the key is absent.
  if (name === "sam_gov" && !env.SAM_GOV_API_KEY) {
    return {
      source: name,
      status: "skip",
      message:
        "SAM_GOV_API_KEY not set (re-registration pending — ~10 business days from 2026-05-09)",
    };
  }
  if (name === "simpler_grants" && !env.SIMPLER_GRANTS_API_KEY) {
    return {
      source: name,
      status: "skip",
      message:
        "SIMPLER_GRANTS_API_KEY not set (generate at https://api.simpler.grants.gov — ~5 min)",
    };
  }

  try {
    const req = src.pingRequest();
    const res = await fetch(req);

    if (src.isAuthOk(res.status)) {
      return { source: name, status: "pass", httpStatus: res.status };
    }

    // Non-OK status — capture the first 200 chars of body for diagnostics.
    let body = "";
    try {
      body = (await res.text()).slice(0, 200);
    } catch {
      // Body read failed; not critical.
    }

    return {
      source: name,
      status: "fail",
      httpStatus: res.status,
      message: body || `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      source: name,
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

function formatLine(r: SmokeResult): string {
  const tag =
    r.status === "pass"
      ? "[PASS]"
      : r.status === "skip"
        ? "[SKIP]"
        : r.status === "fail"
          ? "[FAIL]"
          : "[ERROR]";

  const parts = [tag, r.source];
  if (r.httpStatus !== undefined) parts.push(`HTTP ${r.httpStatus}`);
  if (r.message) parts.push(r.message);
  return parts.join("  ");
}

async function main(): Promise<void> {
  console.log(`RFP API Smoke Test — ${new Date().toISOString()}`);
  console.log("---");

  const sourceOrder: RfpSourceName[] = [
    "sam_gov",
    "grants_gov",
    "simpler_grants",
    "sbir_gov",
  ];

  const results = await Promise.all(sourceOrder.map(ping));

  for (const r of results) {
    console.log(formatLine(r));
  }

  console.log("---");

  const noAuthResults = results.filter(
    (r) => !RFP_SOURCES[r.source].requiresAuth
  );
  const authResults = results.filter(
    (r) => RFP_SOURCES[r.source].requiresAuth
  );

  const publicAllPass = noAuthResults.every((r) => r.status === "pass");
  const anyAuthPass = authResults.some((r) => r.status === "pass");
  const anyAuthHardFail = authResults.some(
    (r) => r.status === "fail" || r.status === "error"
  );
  const allAuthSkipped = authResults.every((r) => r.status === "skip");

  // Rule 1: Public sources must ALWAYS pass — they have no auth.
  if (!publicAllPass) {
    const failed = noAuthResults
      .filter((r) => r.status !== "pass")
      .map((r) => r.source)
      .join(", ");
    console.error(
      `FAIL: Public API sources must always pass — no auth required. Failed: ${failed}`
    );
    process.exit(2);
  }

  // Rule 2: Auth sources with keys present must not return hard failures.
  if (anyAuthHardFail) {
    const failed = authResults
      .filter((r) => r.status === "fail" || r.status === "error")
      .map((r) => `${r.source} (${r.message ?? r.httpStatus})`)
      .join(", ");
    console.error(
      `FAIL: Auth-required source returned an error with key present — check key validity. Failed: ${failed}`
    );
    process.exit(3);
  }

  // Rule 3: If all auth sources are skipped, warn but don't block CI entirely.
  // This is the expected state during SAM.gov re-registration wait.
  if (allAuthSkipped) {
    console.warn(
      "WARN: All auth-required sources are [SKIP] — API keys not yet provisioned."
    );
    console.warn(
      "      Re-run `npm run smoke:rfp-apis` once SAM_GOV_API_KEY and SIMPLER_GRANTS_API_KEY are set."
    );
    console.log("OK: Public sources passed. Auth sources pending provisioning.");
    process.exit(1);
  }

  if (anyAuthPass) {
    console.log("OK: Smoke test passed. All reachable sources returned auth-OK responses.");
    process.exit(0);
  }

  // Shouldn't reach here, but be defensive.
  console.log("OK: Public sources passed.");
  process.exit(0);
}

main();
