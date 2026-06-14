# State Source Map — RFP/Grant Discovery Coverage (50 States + DC)

**Purpose:** Declarative source map for onboarding every US state into the RFP/grant discovery engine. Classifies the BEST available programmatic source per state by reliability so a generic connector framework can reach the maximum number of jurisdictions per integration.

**Status:** Research complete 2026-06-06. Open-data API status for major states verified live via `curl` against the Socrata SODA catalog API (`/api/catalog/v1`) and CKAN datastore API (`/api/3/action/package_search`). E-procurement / grants-portal classifications verified via vendor and state sites.

**Already live in product:** Federal (SAM.gov, Grants.gov, NIH, NSF), California (data.ca.gov CKAN), partial NY/NYC (fragile scraping).

---

## Source-type legend

| Type | Meaning | Typical reliability |
|------|---------|---------------------|
| `socrata` | State Socrata/Tyler open-data portal. Keyless JSON via SODA (`https://<domain>/resource/<id>.json` + `/api/catalog/v1`). | **A** |
| `ckan` | State CKAN open-data portal. Keyless `datastore_search` / `package_search`. | **A** |
| `state_grants_portal` | Dedicated state grants portal (may have API/export). | B–C |
| `eprocurement` | State e-procurement RFP system. Usually scrape-only. | C |
| `aggregator` | Covered by a municipal/state bid aggregator (BidNet, DemandStar, Bonfire, OpenGov, Public Purchase). | C (one integration → many) |
| `none_found` | No good programmatic source; flag for manual/scrape. | D |

**Reliability tiers:** **A** = open keyless API · **B** = portal with structured export/feed · **C** = scrape-only · **D** = none found.

> Important nuance: an open-data **portal** (Socrata/CKAN) is not the same thing as a **live solicitations feed**. Most states publish *grant/award reference datasets* on the open-data portal but post *live RFPs* only in the e-procurement system. The strategy below favors Socrata/CKAN for grant discovery + a generic e-proc/aggregator scraper for live RFPs. Where a state has a Socrata portal we mark tier A because the **same generic connector** reaches it with zero per-state code; whether *that specific state* publishes a useful grants dataset there is a per-dataset onboarding question, not a connector question.

---

## 51-row coverage table

| State | Primary source type | Source name / domain / URL | Keyless API? | Tier | Notes |
|-------|--------------------|----------------------------|:---:|:---:|-------|
| Alabama | aggregator | STAARS Vendor Self Service; BidNet/DemandStar for locals | N | C | No live state Socrata. STAARS VSS scrape-only. |
| Alaska | eprocurement | IRIS / Alaska Online Public Notices (aws.state.ak.us/OnlinePublicNotices) | N | C | Public Notices system has structured listings; no keyless JSON confirmed. |
| Arizona | eprocurement | APP — Arizona Procurement Portal (app.az.gov); data.az.gov defunct | N | C | Open-data vanity domain dead. APP (ProcureAZ successor) scrape-only. |
| Arkansas | eprocurement | Arkansas State Procurement (ARBuy / transform.ar.gov) | N | C | No state Socrata. Scrape. |
| **California** | ckan | **data.ca.gov** (CKAN) + CA Grants Portal (grants.ca.gov) | **Y** | **A** | DONE. CKAN `package_search` verified 200. CA Grants Portal also exposes a CKAN-backed grants dataset on data.ca.gov. |
| Colorado | socrata | **data.colorado.gov** (Socrata) — SODA verified 200 | **Y** | **A** | E-proc = ColoradoVSS / BIDS. Socrata portal live. |
| Connecticut | socrata | **data.ct.gov** (Socrata) — SODA verified 200 | **Y** | **A** | E-proc = CT BizNet / State Contracting Portal (biznet.ct.gov, scrape). Socrata for grants/reference. |
| Delaware | socrata | **data.delaware.gov** (Socrata) — SODA verified 200 | **Y** | **A** | E-proc = MyMarketplace (Delaware). Socrata live. |
| **DC** | socrata | opendata.dc.gov (ArcGIS Hub, geo) + DC OCP (ocp.dc.gov) | Partial | B | opendata.dc.gov is ArcGIS Hub (not classic SODA — 404). Use OCP solicitations + ArcGIS Hub REST API for datasets. |
| **Florida** | eprocurement | MyFloridaMarketPlace VBS / Vendor Information Portal (vendor.myfloridamarketplace.com) | N | C | **No public state Socrata.** Live RFPs on VBS (SAP-backed). Scrape `vendor.myfloridamarketplace.com/search/bids`. FL DOT separate. |
| **Georgia** | eprocurement | Team Georgia Marketplace (Jaggaer/SciQuest); DOAS supplier bid notices | N | C | No state Socrata. Jaggaer-backed; scrape DOAS bid notices. Aggregators cover GA locals. |
| Hawaii | socrata | data.hawaii.gov (Socrata, host moved — vanity 404, portal exists) + HIePRO/HANDS | N | B | HIePRO is the e-proc. Socrata portal exists but vanity host flaky; verify resource host. |
| Idaho | eprocurement | Luma / IPRO (Idaho); no state Socrata | N | C | Scrape. |
| **Illinois** | socrata | **data.illinois.gov** (Socrata) — SODA verified 200 | **Y** | **A** | E-proc = BidBuy (bidbuy.illinois.gov) + Illinois Procurement Bulletin. Grants = GATA / state.gata. Socrata live. |
| Indiana | eprocurement | IDOA / Indiana Bid system; hub.mph.in.gov geo | N | C | data.in.gov vanity dead. Scrape IDOA. |
| Iowa | socrata | **data.iowa.gov / mydata.iowa.gov** (Socrata) — mydata verified 200 | **Y** | **A** | Vanity `data.iowa.gov` 404 but **mydata.iowa.gov** SODA 200. E-proc = IMPACS / Iowa bid opportunities. |
| Kansas | eprocurement | Kansas eSupplier / Smart (Procurement & Contracts) | N | C | No state Socrata. Scrape. |
| Kentucky | eprocurement | Kentucky eProcurement (eMARS) / Vendor Self Service | N | C | No state Socrata. Scrape. |
| Louisiana | socrata | LaGov / data via Socrata historically; LaPAC (wwwprd.doa.louisiana.gov/osp/lapac) | Partial | C | LaPAC is the public bid system (scrape). Socrata presence weak. |
| Maine | eprocurement | Maine Division of Procurement Services (maine.gov/dafs/bbm/procurementservices) | N | C | Scrape. |
| **Maryland** | socrata | **opendata.maryland.gov** (Socrata) — SODA verified 200; e-proc = **eMMA** (emma.maryland.gov) | **Y** | **A** | `opendata.maryland.gov` 200. Live RFPs in eMMA (scrape). Strong dual coverage. |
| **Massachusetts** | state_grants_portal | data.mass.gov (Tyler Data Hub — no classic SODA/CKAN public API, 404) + COMMBUYS e-proc | N | C | MA migrated to new Tyler "Data Hub"; classic SODA/CKAN endpoints 404. Live RFPs = COMMBUYS (commbuys.com). Scrape. |
| **Michigan** | socrata | **data.michigan.gov** (Socrata) — SODA verified 200; e-proc = **SIGMA VSS** (sigma.michigan.gov) | **Y** | **A** | Socrata 200. Live RFPs in SIGMA VSS (Bid4Michigan / scrape). |
| Minnesota | eprocurement | SWIFT / Minnesota SciQuest "Supplier Portal"; mn.gov/admin | N | C | mn.gov/admin/osp bid board. Scrape. Some Socrata-ish geo only. |
| Mississippi | eprocurement | MAGIC (SAP) / Mississippi Procurement | N | C | Scrape. |
| Missouri | socrata | **data.mo.gov** (Socrata) — SODA verified 200; e-proc = MissouriBUYS | **Y** | **A** | Socrata 200. Live RFPs = MissouriBUYS (missouribuys.mo.gov, scrape). |
| Montana | eprocurement | eMACS (Montana Acquisition & Contracting System) | N | C | Scrape. |
| Nebraska | eprocurement | Nebraska eBid / DAS Materiel; data.nebraska.gov geo | N | C | data.nebraska.gov is ArcGIS-ish (SODA 404). Scrape eBid. |
| Nevada | eprocurement | NevadaEPro (nevadaepro.com) | N | C | data.nv.gov not live. Scrape NevadaEPro. |
| New Hampshire | eprocurement | NH Vendor Resources / NHFirst (das.nh.gov) | N | C | Scrape. |
| **New Jersey** | socrata | **data.nj.gov** (Socrata) — SODA verified 200. E-proc = **NJSTART** (njstart.gov). Grants = **SAGE** (njsage.intelligrants.com). | **Y** | **A** | **PRIORITY.** Socrata portal live (keyless). Live RFPs = NJSTART (Periscope/mojix-backed, scrape `njstart.gov/bso`). Grants = SAGE (IntelliGrants/Agate — portal, scrape). Three distinct surfaces: Socrata (A, reference), NJSTART (C, live RFPs), SAGE (C, grants). |
| **New York** | socrata | **data.ny.gov** (Socrata) — SODA verified 200, hosts real grant-opportunity datasets. Grants = **Grants Gateway** (grantsmanagement.ny.gov) + SFS Vendor Portal. RFPs = NYS Contract Reporter. | **Y** | **A** | **PRIORITY.** data.ny.gov SODA 200; `q=grant opportunities` returns live datasets (e.g. OHCS/OHA Housing Grant Opportunities). Replaces fragile scraping for grant *reference*. Live solicitations: NYS Contract Reporter (nyscr.ny.gov, login-walled — scrape/feed) + Grants Gateway Opportunity Portal (public, no login to view; scrape). |
| **— NYC (city)** | socrata | **data.cityofnewyork.us** (NYC Open Data, Socrata) — SODA verified 200. Live RFPs = **NYC City Record Online (a856-cityrecord.nyc.gov)** + PASSPort (passport.cityofnyc.us). | **Y** | **A** | NYC Open Data is one of the largest Socrata portals — keyless. City Record Online publishes all NYC procurement notices and has a public dataset mirror on NYC Open Data ("Recent Contract Awards" / "City Record"). Wire the City Record dataset for NYC procurement — far more reliable than scraping PASSPort. |
| **North Carolina** | eprocurement | NC eVP / NCEProcurement (evp.nc.gov, Jaggaer); IPS (Interactive Purchasing System) | N | C | data.nc.gov not classic SODA. Live RFPs = eVP/IPS. Scrape. NC DOT separate. |
| North Dakota | eprocurement | ND Online Bidding / OMB (apps.nd.gov/csd/spo/services/bidder) | N | C | Scrape. |
| **Ohio** | eprocurement | OhioBuys (ohiobuys.ohio.gov, Jaggaer); data.ohio.gov is ArcGIS/InnovateOhio (SODA 404) | N | C | data.ohio.gov SODA 404 (InnovateOhio Platform / geo). Live RFPs = OhioBuys. Scrape. |
| Oklahoma | eprocurement | OK CAP / Oklahoma eProcurement (OMES); data.ok.gov defunct | N | C | data.ok.gov SODA 404. Scrape OMES bid board. |
| Oregon | socrata | **data.oregon.gov** (Socrata) — SODA verified 200; e-proc = **OregonBuys** (oregonbuys.gov) | **Y** | **A** | Socrata 200. Live RFPs = OregonBuys (Periscope/mojix). Scrape for live. |
| **Pennsylvania** | socrata | **data.pa.gov** (Socrata) — SODA verified 200; e-proc = **PA eMarketplace** (emarketplace.state.pa.us) | **Y** | **A** | data.pa.gov SODA 200 (keyless). Live RFPs = PA eMarketplace (`emarketplace.state.pa.us/search.aspx`, scrape — public, no login). Strong dual coverage. |
| Rhode Island | socrata | data.ri.gov (Socrata, 301 redirect — verify host) + RIVIP/Ocean State Procures | Partial | B | data.ri.gov redirects (likely live under redirect target). E-proc = RIVIP / Ocean State Procures. |
| South Carolina | eprocurement | SCBO (South Carolina Business Opportunities) / SC Enterprise; data.sc.gov defunct | N | C | Scrape SCBO. |
| South Dakota | eprocurement | SD MyBidList / BFM (boardsandcommissions/state procurement) | N | C | Scrape. |
| Tennessee | eprocurement | Edison Supplier Portal / TN SWC (tn.gov/generalservices); data.tn.gov 404 | N | C | data.tn.gov SODA 404. Scrape Edison. |
| **Texas** | socrata | **data.texas.gov** (Socrata) — SODA verified 200. Live RFPs = **ESBD** (txsmartbuy.gov/esbd). Grants = TX eGrants (per-agency). | **Y** | **A** | **PRIORITY (large).** data.texas.gov SODA 200 (keyless). Live RFPs = Electronic State Business Daily (ESBD) on Texas SmartBuy — public search, scrape `txsmartbuy.gov/esbd`. eGrants is decentralized per agency (TEA, etc.). |
| Utah | socrata | data.utah.gov (Socrata, 302 → opendata.utah.gov); e-proc = SciQuest "U3P" / Utah Public Procurement | Partial | B | data.utah.gov 302 redirect to live portal. E-proc = solicitation.sciquest.com/Utah. |
| Vermont | socrata | **data.vermont.gov** (Socrata) — SODA verified 200; e-proc = Vermont Bid Opportunities (bgs.vermont.gov) | **Y** | **A** | Socrata 200. Live RFPs = VT Bid Opportunities (scrape). |
| **Virginia** | ckan | **data.virginia.gov** (now **CKAN** — `package_search` verified 200); e-proc = **eVA** (eva.virginia.gov) | **Y** | **A** | **VA migrated Socrata→CKAN.** Use keyless CKAN `package_search`. eVA also publishes **"eVA Open Data"** (eva.virginia.gov/eva-open-data.html) — live solicitation exports. High-value: eVA open data = live RFP feed. |
| **Washington** | socrata | **data.wa.gov** (Socrata) — SODA verified 200; e-proc = **WEBS** (Washington Electronic Business Solution) | **Y** | **A** | **PRIORITY (large).** data.wa.gov SODA 200 (keyless). Live RFPs = WEBS (des.wa.gov/webs, login-walled — scrape) + WA dept bid boards. |
| West Virginia | eprocurement | wvOASIS / VendorSelfService (vendor.wvoasis.gov) | N | C | Scrape. |
| Wisconsin | eprocurement | VendorNet (vendornet.wi.gov); data.wi.gov not classic SODA | N | C | VendorNet is public bid board (scrape). |
| Wyoming | eprocurement | Wyoming Public Notices / WY procurement (ai.wyo.gov) | N | C | Scrape. |

### Verified-live keyless endpoints (curl-confirmed 2026-06-06)
- **Socrata SODA (HTTP 200 on `/api/catalog/v1`):** data.ny.gov, data.wa.gov, data.texas.gov, data.michigan.gov, data.illinois.gov, opendata.maryland.gov, data.colorado.gov, data.oregon.gov, data.ct.gov, data.delaware.gov, data.mo.gov, data.nj.gov, **data.pa.gov**, data.vermont.gov, mydata.iowa.gov, data.cityofnewyork.us (NYC).
- **CKAN (HTTP 200 on `/api/3/action/package_search`):** data.ca.gov, **data.virginia.gov**.
- **Confirmed NOT classic SODA/CKAN (404/redirect/dead):** data.ca.gov (CKAN not SODA — expected), data.ohio.gov (ArcGIS), data.mass.gov (Tyler Data Hub, no public API), data.tn.gov, data.ok.gov, data.iowa.gov vanity (use mydata.iowa.gov), data.az.gov / data.nc.gov / data.nv.gov / data.in.gov / data.sc.gov / data.georgia.gov (dead vanity domains).

---

## Aggregator leverage

These aggregators each reach **many** jurisdictions through a single integration — by far the highest coverage-per-effort for **local/municipal** RFPs (where most volume lives and where no statewide open-data API exists).

| Aggregator | Rough coverage | Access path | Notes |
|------------|---------------|-------------|-------|
| **BidNet Direct / Periscope (mdf/Mediagrif)** | "100,000+ state, local & federal agencies" aggregated; powers many **statewide purchasing groups** (e.g., regional state coops). | `bidnetdirect.com` — registration-walled; per-group bid lists. Scrape with authenticated session, or apply for partner/API access. | Powers several state e-proc backends (Periscope/OregonBuys, NJSTART-adjacent). One login → many state purchasing groups. **Highest raw reach.** |
| **DemandStar (now Bonfire/GTY)** | **1,300+ agencies post free**, marketplace reaches **90,000+** agencies. | `demandstar.com/browse-bids` (public browse) + `network.demandstar.com`. Free vendor account → notifications. | Acquired by Bonfire. Public browse page is scrapeable. Combined DemandStar+Bonfire footprint = **1,900+ state/local buying agencies**. |
| **Bonfire (GTY Technology)** | **650+** government agencies (North America). | `gobonfire.com` / `bonfirehub.com` portals (per-agency subdomains). | Each agency = `<agency>.bonfirehub.com/portal/?tab=openOpportunities`. Predictable URL pattern → templated scraper across all Bonfire tenants. |
| **OpenGov Procurement (formerly ProcureNow)** | Hundreds of cities/counties. | Per-agency `procurement.opengov.com/portal/<agency>`. | Predictable portal URL pattern; scrapeable. Strong in mid-size cities. |
| **Public Purchase** | ~1,000+ smaller agencies. | `publicpurchase.com` — registration-walled. | Long tail of small municipalities. Lower priority. |
| **PlanetBids** | Many CA + western cities/counties. | Per-agency `pbsystem.planetbids.com/portal/<id>/bo/bo-search`. | Predictable JSON-ish search endpoints per portal; good for CA locals beyond data.ca.gov. |

**Strategic read:** A single **Bonfire templated scraper** (one URL pattern, ~650 tenants) plus a **BidNet** and **DemandStar** integration covers a very large share of *local* procurement nationwide — more jurisdictions than wiring 50 state e-proc systems individually. These are the highest-leverage non-API targets.

---

## Coverage summary

Counting the **primary** classification per row (51 total). "A via Socrata/CKAN" means the generic open-data connector reaches it keyless; live-RFP completeness still varies per state.

- **Tier A (keyless open API — Socrata or CKAN):** **20**
  - **CKAN (2):** California, Virginia.
  - **Socrata (18):** New York, New Jersey, Pennsylvania, Texas, Washington, Michigan, Illinois, Maryland, Colorado, Connecticut, Delaware, Missouri, Oregon, Vermont, Iowa (mydata host), + NYC (city). (Plus borderline Hawaii/Rhode Island/Utah which redirect — counted as B below.)
- **Tier B (portal w/ structured export or ArcGIS Hub / redirecting Socrata):** **5** — DC, Hawaii, Rhode Island, Utah, Massachusetts (Tyler Data Hub export). *(MA's live RFPs are still scrape-only via COMMBUYS, but the Data Hub offers structured downloads.)*
- **Tier C (scrape-only — e-proc system or aggregator-covered):** **26** — Alabama, Alaska, Arizona, Arkansas, Florida, Georgia, Idaho, Indiana, Kansas, Kentucky, Louisiana, Maine, Minnesota, Mississippi, Montana, Nebraska, Nevada, New Hampshire, North Carolina, North Dakota, Ohio, Oklahoma, South Carolina, South Dakota, Tennessee, West Virginia, Wisconsin, Wyoming. *(Note: this list is the practical "needs scraping for live RFPs" bucket; several have only a defunct open-data vanity domain.)*
- **Tier D (no good source found):** **0** at state level — every state has at least an e-procurement bid board to scrape. Treat the weakest C-tier states (WY, ND, SD, MS, ME) as effectively D for *grant* discovery until aggregators fill them.

**Big picture:** ~20 of 51 jurisdictions (incl. the largest: CA, TX, NY, PA, IL, MI, WA, NJ, plus NYC) are reachable with **one generic keyless connector** (Socrata + CKAN variants). The other ~30 require scraping their e-proc system or — more efficiently — riding the aggregators.

---

## Recommended onboarding order (max coverage-per-effort)

**Wave 1 — Generic Socrata connector (one build → 16+ states + NYC, all keyless).**
Build a single `socrata` connector parameterized by `{domain, dataset_id}`. Wire these verified-200 domains first:
`data.ny.gov`, `data.nj.gov`, `data.texas.gov`, `data.wa.gov`, `data.pa.gov`, `data.michigan.gov`, `data.illinois.gov`, `opendata.maryland.gov`, `data.colorado.gov`, `data.ct.gov`, `data.oregon.gov`, `data.mo.gov`, `data.delaware.gov`, `data.vermont.gov`, `mydata.iowa.gov`, **`data.cityofnewyork.us` (NYC)**.
Per-state work = just find the right grant/procurement dataset IDs (e.g., NY "Grant Opportunities", NYC "City Record"). **This immediately replaces the fragile NY/NYC scraping** and adds 14 more states for near-zero marginal cost.

**Wave 2 — Generic CKAN connector (one build → CA + VA, reuses the existing CA work).**
You already have CA CKAN. Generalize it to `{base_url, resource_id}` and add **data.virginia.gov** (and eVA Open Data exports). VA is high-value because eVA publishes live solicitations as open data.

**Wave 3 — High-leverage aggregator scrapers (one pattern → hundreds of local agencies).**
1. **Bonfire** templated scraper (`<agency>.bonfirehub.com`, ~650 tenants).
2. **DemandStar** public browse (`demandstar.com/browse-bids`).
3. **BidNet Direct** (apply for access; powers many state purchasing groups).
This is where most *local* RFP volume lives and where there's no API anywhere.

**Wave 4 — Priority large-state live-RFP scrapers (where the Socrata portal lacks live solicitations).**
Targeted scrapers for public, login-free e-proc search pages, in size order:
- **FL** — `vendor.myfloridamarketplace.com/search/bids` (no state Socrata; must scrape).
- **TX ESBD** — `txsmartbuy.gov/esbd` (public).
- **PA eMarketplace** — `emarketplace.state.pa.us/search.aspx` (public).
- **GA** Team Georgia / DOAS bid notices, **OH** OhioBuys, **NC** eVP/IPS.
- **NY** Contract Reporter + Grants Gateway Opportunity Portal (public view) to complement data.ny.gov.
- **NJ** NJSTART (`njstart.gov/bso`) + SAGE for grants — to complement data.nj.gov.

**Wave 5 — Long tail.** Remaining C-tier states via their e-proc boards, or defer to aggregator coverage. Massachusetts (COMMBUYS), and the small states (WY/ND/SD/MS/ME/etc.) last.

**Effort ranking:** Wave 1 (Socrata) and Wave 2 (CKAN) are the cheapest, highest-coverage moves — two generic connectors reach ~20 jurisdictions including 8 of the 10 largest states. Wave 3 (aggregators) is the cheapest path to the *local* long tail. Per-state e-proc scrapers (Waves 4–5) are the expensive, low-leverage tail — do them only for big states or where a customer needs them.

---

## Connector-framework implications

1. **Two generic API connectors cover Tier A entirely:** `socrata` (`/resource/<id>.json`, paginate via `$limit`/`$offset`, filter via SoQL `$where`) and `ckan` (`/api/3/action/datastore_search` or `package_search`). Both keyless. The declarative source map should be `{state, type, domain/base_url, dataset_id?, query?}`.
2. **Socrata SODA is uniform** — one client handles all 16+ Socrata states. Add `X-App-Token` header only if you hit the anonymous throttle (1000 req/rolling — easily avoided with caching).
3. **Aggregator scrapers are templated, not per-agency** — Bonfire/OpenGov/PlanetBids each have a single URL+response pattern across all their tenants. Model them as `{aggregator, tenant_id}` rows, not as states.
4. **Distinguish "grant reference dataset" vs "live solicitation feed"** in the schema — many Socrata portals give you the former but not the latter; live RFPs for those states still need the e-proc scraper. A `feed_kind` enum (`grants_dataset` | `live_solicitations` | `awards`) keeps expectations honest.
5. **Corrections to prior assumptions baked in here:** Virginia is now **CKAN** (was Socrata). data.ca.gov is **CKAN** not Socrata (404 on SODA — already known). PA and NJ **do** have live keyless Socrata portals (data.pa.gov, data.nj.gov — both verified 200), which is better than treating them as scrape-only. Iowa's working host is **mydata.iowa.gov**, not data.iowa.gov.
