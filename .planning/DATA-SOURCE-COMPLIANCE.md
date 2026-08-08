# Data-Source Terms-of-Use Compliance Review

**Reviewer:** Lorenzo Daughtry-Chambers / Perpetual Core LLC
**Date:** 2026-06-06
**Product:** RFP & Proposal Engine (rfp.perpetualcore.com)
**Requirement satisfied:** TRUST-04

---

## Declaration

Data sources reviewed for ToS compliance as of 2026-06-06. Every source registered in `lib/rfp/source-catalog.ts` is enumerated below with its status, governing terms, and a compliant/blocked verdict. Candid / Foundation Directory is excluded — the license prohibits AI/LLM use and redistribution; zero Candid API calls exist in the codebase. No license-restricted data is redistributed by this product.

---

## Verification Commands and Output

The following commands were run against the codebase on 2026-06-06 to confirm zero Candid ingestion and zero ProPublica/IRS 990 ingestion.

### Candid exclusion verification

Command run:
```
grep -rin "candid.org\|candid_foundation\|candid API\|candid api" lib/ app/
```

Output (complete):
```
lib/rfp/source-catalog.ts:322:    source: "candid_foundation_directory",
lib/rfp/source-catalog.ts:331:    canonicalUrl: "https://candid.org",
```

**Interpretation:** The only references to `candid.org` in the entire codebase are the source-catalog entry marking Candid as `status: "blocked"` and `ingestMode: "licensed"`. No ingest file, no API call, no HTTP fetch. The catalog entry is an explicit block record — its purpose is to permanently record that this source must not be ingested without resolving the license.

Additional broader search to confirm no active ingest:
```
grep -rin "candid" lib/ app/ 2>/dev/null
```
All matches for `candid` in `lib/` and `app/` are either:
- Variable/function names containing the substring "candidate" (unrelated to Candid the organization)
- `lib/rfp/source-catalog.ts` lines 322 and 331 (the blocked catalog entry)
- `app/(rfp-marketing)/rfp/how-it-works/HowItWorksContent.tsx` lines 71, 188, 259 (UI marketing copy only — mentions "Candid" in a list of sources the product *can* scan; this is aspirational/planned marketing copy and does NOT represent any live ingest. No data is fetched from candid.org by this page.)

No file named `candid.ts` or similar exists in `lib/rfp/ingest/`. The complete ingest directory listing confirms this:
```
lib/rfp/ingest/canonical-backfill.ts
lib/rfp/ingest/canonicalize.ts
lib/rfp/ingest/connectors/socrata.ts
lib/rfp/ingest/federal-register.ts
lib/rfp/ingest/grants-gov.ts
lib/rfp/ingest/nih-grants.ts
lib/rfp/ingest/normalize.ts
lib/rfp/ingest/nsf-grants.ts
lib/rfp/ingest/run-state-city.ts
lib/rfp/ingest/run.ts
lib/rfp/ingest/sam-gov.ts
lib/rfp/ingest/sbir.ts
lib/rfp/ingest/scrape/ca-grants.ts
lib/rfp/ingest/scrape/drift.ts
lib/rfp/ingest/scrape/ny-state.ts
lib/rfp/ingest/scrape/nyc-doe.ts
lib/rfp/ingest/scrape/nyc-dycd.ts
lib/rfp/ingest/scrape/nyc-hra.ts
lib/rfp/ingest/scrape/types.ts
lib/rfp/ingest/scrape/utils.ts
lib/rfp/ingest/simpler-grants.ts
```

No `candid` ingest module exists. TRUST-04 Candid clause: **SATISFIED**.

### ProPublica / IRS 990 ingestion status verification

Command run:
```
grep -rin "propublica.org\|propublica API\|propublica api\|irs_990\|irs990" lib/ app/
```

Output (complete):
```
lib/rfp/source-catalog.ts:309:    source: "irs_990_foundations",
```

**Interpretation:** The only reference is the source-catalog entry for `irs_990_foundations` with `status: "planned"`. No ProPublica API calls exist anywhere in the codebase. Ingest is deferred to Phase 16. No data has been ingested from this source.

---

## Per-Source Compliance Table

This table covers every entry in `lib/rfp/source-catalog.ts` as of 2026-06-06 (22 entries total). No registered source is omitted.

| # | Source Key | Label | Catalog Status | Ingest Mode | ToS / Terms URL | Key Terms Summary | Compliant Verdict |
|---|-----------|-------|---------------|-------------|----------------|-------------------|-------------------|
| 1 | `sam_gov` | SAM.gov Contract Opportunities | **live** | api | https://sam.gov/content/data-services | Public domain federal data. GSA Data Services terms allow reuse, redistribution, and third-party integration. No resale restriction on opportunity metadata. Attribution to SAM.gov recommended. | **YES** |
| 2 | `grants_gov` | Grants.gov | **live** | api | https://www.grants.gov/web/grants/learn-grants/grant-process/grant-terminology.html | Public government data. Grants.gov API terms of use permit third-party integration and display of federal grant opportunity data. Free to use. | **YES** |
| 3 | `simpler_grants` | Simpler Grants | **live** | api | https://simpler.grants.gov | Public government data. Simpler Grants API is a federal open-data initiative. Same public-domain basis as Grants.gov. | **YES** |
| 4 | `sbir` | SBIR/STTR | **live** | api | https://www.sbir.gov/about/about-sbir | Public federal data published by the U.S. Small Business Administration. No API key required for public opportunity search. Free to access and display. | **YES** |
| 5 | `fed_register` | Federal Register funding notices | **live** | api | https://www.federalregister.gov/reader-aids/developer-resources/rest-api | Federal Register API is a government open-data API. Documents are public domain. Commercial and non-commercial use permitted. | **YES** |
| 6 | `nih_grants` | NIH Grant Opportunities | **live** | api | https://grants.nih.gov/grants/guide/reader_instructions.htm | NIH funding opportunities are public-domain government records. NIH Reporter and Grants.gov API terms allow third-party integration of opportunity listings. | **YES** |
| 7 | `nsf_grants` | NSF funding search | **live** | api | https://new.nsf.gov/funding/opportunities | NSF opportunities published via Grants.gov. Same public-domain basis. NSF API (awards.nsf.gov) is a federal open-data service. | **YES** |
| 8 | `ny_state` | New York State Contract Reporter | **live** | html_scrape | https://www.nyscr.ny.gov | NY State Contract Reporter is a public government procurement portal. The state publishes this data as a public notice requirement. Scraping publicly available procurement notices is lawful. No ToS prohibiting automated access was identified on the public portal. | **YES** |
| 9 | `nyc_dycd` | NYC DYCD | **live** | html_scrape | https://opendata.cityofnewyork.us/terms-of-service/ | NYC Open Data terms of service permit free use, reuse, and redistribution. Attribution to NYC Open Data required. No prohibition on commercial use. | **YES** |
| 10 | `nyc_doe` | NYC DOE | **live** | html_scrape | https://www.schools.nyc.gov / opendata.cityofnewyork.us | NYC public procurement data. Same NYC Open Data ToS basis. | **YES** |
| 11 | `nyc_hra` | NYC HRA | **live** | html_scrape | https://www.nyc.gov/site/hra/about/contracts.page | NYC public procurement portal. Same NYC Open Data ToS basis. | **YES** |
| 12 | `nyc_passport` | NYC PASSPort | **live** | html_scrape | https://passport.cityofnewyork.us | NYC citywide procurement system. Public procurement notices are legally required to be publicly accessible. | **YES** |
| 13 | `ca_grants` | California Grants Portal | **live** | html_scrape | https://www.grants.ca.gov/terms-of-use/ | California Grants Portal ToS permits free access to grant opportunity data. Public government data. Redistribution permitted with attribution. | **YES** |
| 14 | `foundation_url` | Manual foundation/imported opportunities | **live** | manual_import | N/A — user-provided URL | User uploads or pastes a URL; the user is responsible for the terms governing access to that URL. No bulk third-party data ingested by this source. Product processes user-provided content under user agreement. | **YES** |
| 15 | `nj_grants` | New Jersey grants and procurement | **live** | html_scrape | https://www.njstart.gov/bso/view/search/external/advancedSearchBid.xhtml?openBids=true | NJSTART publishes public, unauthenticated New Jersey open-bid records for external public viewing. Connector reads the public open-bids table and public detail pages only; it does not log in, submit forms, or download attachments. | **YES** |
| 16 | `ct_grants` | Connecticut grants and procurement | **live** | api | https://portal.ct.gov/das/ctsource/bidboard | Connecticut DAS publishes CTsource Bid Board as a public, unauthenticated procurement listing through the embedded Proactis/WebProcure public search service. Connector reads Open public solicitation metadata only; it does not log in, submit bids, or download attachments. | **YES** |
| 17 | `pa_grants` | Pennsylvania grants and procurement | **live** | html_scrape | https://www.emarketplace.state.pa.us/Search.aspx | Pennsylvania DGS identifies eMarketplace as the public source for bidding opportunities, awards, and contracts. Connector reads the public current solicitations grid and public detail links only; it does not log in, submit forms, or download solicitation files. | **YES** |
| 18 | `nih_guide_notices` | NIH Guide notices | **live** | api | https://grants.nih.gov/grants/guide/newsfeed/fundingopps.xml | NIH Guide notices are public-domain government publications exposed through the official NIH RSS feed. Connector treats these as notice/policy/RFI intelligence and keeps active NIH NOFOs sourced from Grants.gov. | **YES** |
| 19 | `irs_990_foundations` | IRS 990 foundation intelligence | **live** | api | https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf | IRS EO Business Master File Extract is a public IRS CSV dataset. Connector ingests private-foundation profile metadata from IRS state files into `rfp_funder_profiles`, not `rfp_opportunities`, so profiles are not represented as open RFPs. ProPublica Nonprofit Explorer API was reviewed but not used because its Data Store terms are not a clean fit for paid SaaS redistribution. | **YES — IRS primary source only** |
| 20 | `candid_foundation_directory` | Candid / Foundation Directory | **blocked** | licensed | https://candid.org/data-services/terms | License PROHIBITS AI/LLM use and redistribution of Candid data. Correctly blocked. | **N/A (blocked — do not ingest)** |
| 21 | `corporate_foundations` | Corporate foundation programs | **live** | curated | Official funder program pages only | Curated from official corporate/foundation program pages. Connector stores program intelligence and source URLs, not proprietary third-party grant listings. Deadlines/invitation status are flagged for source review. | **YES — official-source curated basis** |
| 22 | `bank_cra` | Bank CRA and community grants | **live** | curated | Official bank/foundation program pages only | Curated from official bank, bank foundation, and bank trustee program pages. CRA/community investment relevance is based on official program descriptions. Deadlines/invitation status are flagged for source review. | **YES — official-source curated basis** |

**Table notes:**
- "Catalog status" reflects the value of the `status` field in `lib/rfp/source-catalog.ts` as of 2026-06-06.
- All 22 registered catalog entries are covered. No entry is omitted.
- For live sources (rows 1–14): compliance is confirmed for current production use.
- There are no remaining planned live-ingest sources in the catalog table. Candid remains intentionally blocked.
- Row 20 (Candid) has no production action to verify — the block is the compliance state.

---

## Candid Exclusion (CONFIRMED)

**Finding:** Candid / Foundation Directory is excluded from the product and will not be ingested without explicit license resolution.

**Basis:**
- Candid's data services license (candid.org/data-services/terms) prohibits use of Candid data for AI/LLM training, inference, or redistribution without an explicit commercial license.
- The source catalog records this explicitly: `status: "blocked"`, `ingestMode: "licensed"`, `nextStep: "Resolve licensing/API terms before ingesting proprietary data."`
- Code verification (command and full output above): zero API calls to candid.org exist anywhere in `lib/` or `app/`. The only code references to Candid are the blocked catalog entry and aspirational marketing copy in a UI component.
- No ingest file for Candid exists (ingest directory listing above confirms this).

**TRUST-04 Candid clause: SATISFIED by current codebase state.**

**Note on marketing copy:** Three lines in `app/(rfp-marketing)/rfp/how-it-works/HowItWorksContent.tsx` list "Candid" among sources the product can scan. This is aspirational UI copy describing a future capability. It does not represent any live data ingestion. **This marketing copy should be updated in a future sprint to remove Candid from the current-feature list until a license is secured.** This is a content accuracy issue, not a compliance violation (no data flows).

---

## ProPublica / IRS 990 (PLANNED — Not Yet Ingested)

**Finding:** ProPublica Nonprofit Explorer and direct IRS 990 data are registered in the catalog as `status: "planned"` and have not been ingested as of 2026-06-06. Phase 16 is the planned integration phase.

**Code confirmation:** Zero ProPublica API calls or IRS 990 ingest files exist in the codebase (grep evidence above).

**Compliance analysis:**

**IRS 990 direct (public domain):**
IRS Form 990 filings are public government records. The IRS publishes them in bulk via AWS S3 (open access) and via HTTPS at irs.gov. These are public-domain government documents — the same legal basis as SAM.gov and Grants.gov data. Direct IRS 990 ingestion is lawful.

**ProPublica Nonprofit Explorer API:**
ProPublica makes IRS 990 data available via its Nonprofit Explorer API (https://projects.propublica.org/nonprofits/api). The API is publicly accessible and free. ProPublica's stated purpose for the API is to enable research and public interest journalism, and it has been used commercially by third-party tools.

**Open question — commercial-use clause:**
ProPublica's API terms do not carry an explicit creative-commons or open-government license like SAM.gov. The terms at https://projects.propublica.org/nonprofits/api must be read in full to confirm whether commercial SaaS redistribution is permitted without a separate agreement.

**Pre-Phase-16 action required:**
> Read https://projects.propublica.org/nonprofits/api terms explicitly. Document the specific clause or absence of clause that governs commercial SaaS use. Update this section with the finding before Phase 16 begins ingesting `irs_990_foundations` data. If the terms are ambiguous or restrictive, evaluate switching to direct IRS AWS bulk download instead (public domain, no ToS concern).

**TRUST-04 ProPublica clause: SATISFIED for current state (not yet ingested). Action item open for Phase 16.**

---

## Redistribution Stance

This product surfaces opportunity metadata and links — it does not resell or redistribute bulk licensed datasets.

Specifically:
- Federal government data (SAM.gov, Grants.gov, NIH, NSF, SBIR, Federal Register) is public-domain and may be freely redistributed. The product presents structured summaries and links to originating government portals.
- State and municipal open data (NY State, NYC, California) is published under open-data terms that explicitly allow redistribution with attribution.
- User-provided vault documents (past proposals, org materials) are processed internally to generate embeddings and AI-assisted drafts. They are not shared with other organizations.
- No Candid data is ingested or redistributed.
- No proprietary licensed datasets are used in any live production source.

Users are displayed links back to originating portals so they can verify primary sources. Proposal drafts generated by the AI are labeled as AI-generated and require human review before submission.

---

## Compliance Summary (TRUST-04)

| Clause | Status |
|--------|--------|
| All live sources reviewed against their ToS | COMPLETE — 14 live sources reviewed, all compliant |
| Candid excluded — no license-restricted data ingested | CONFIRMED — zero API calls, source blocked in catalog |
| ProPublica/IRS 990 not yet ingested | CONFIRMED — status "planned", no ingest code exists |
| Pre-Phase-16 action documented | YES — commercial-use ToS review required before integration |

**Overall TRUST-04 verdict: SATISFIED for current production state as of 2026-06-06.**

---

## Review Cadence

This document must be re-reviewed when:

1. Any source in the catalog moves from `planned` to `live` — confirm terms before go-live.
2. Any new source is added to `lib/rfp/source-catalog.ts` — add a row to the compliance table before or at the same time.
3. Phase 16 begins — ProPublica/IRS 990 action item must be resolved first.
4. Annual review — terms of use for live sources can change; re-verify once per year or after any major source ToS update.

**Next scheduled review trigger:** Phase 16 planning (before `irs_990_foundations` ingestion begins).

---

*This compliance review was prepared by Perpetual Core LLC as an internal record. It does not constitute legal advice. Review with qualified counsel before relying on it for regulatory or contractual purposes.*
