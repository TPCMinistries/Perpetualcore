-- =============================================================================
-- RFP & Proposal Engine — State Coverage Registry (Phase 16, DISCO-10)
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- "The ability to do every state": a declarative registry. Onboarding a state
-- = inserting a row, not writing code. Generic socrata/ckan connectors read
-- these rows; only scrape rows need bespoke work. Source of truth for the
-- per-state coverage status page. Seeded from .planning/research/STATE-SOURCE-MAP.md
-- (live-verified 2026-06-06).
-- SAFETY: additive only, service-only RLS (mirrors rfp_source_drift).
-- =============================================================================

CREATE TABLE IF NOT EXISTS rfp_state_coverage (
  state_code      text PRIMARY KEY,        -- 'NY','NJ','CA'... ; 'US-NYC' for NYC
  display_name    text NOT NULL,
  connector       text NOT NULL,           -- socrata | ckan | aggregator | scrape
  source_config   jsonb NOT NULL DEFAULT '{}'::jsonb,
  feed_kind       text NOT NULL DEFAULT 'grant_reference', -- grant_reference | live_solicitation
  status          text NOT NULL DEFAULT 'planned',          -- live | partial | planned | none
  reliability     text,                    -- A | B | C | D
  last_success_at timestamptz,
  opportunity_count int DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rfp_state_coverage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='rfp_state_coverage'
      AND policyname='rfp_state_coverage_service_only'
  ) THEN
    CREATE POLICY rfp_state_coverage_service_only
      ON rfp_state_coverage FOR ALL USING (false) WITH CHECK (false);
  END IF;
END $$;

INSERT INTO rfp_state_coverage (state_code, display_name, connector, source_config, feed_kind, status, reliability) VALUES
('AL','Alabama','scrape','{"eproc":"STAARS VSS","aggregator":"BidNet/DemandStar"}','live_solicitation','planned','C'),
('AK','Alaska','scrape','{"eproc":"IRIS / AK Online Public Notices","url":"aws.state.ak.us/OnlinePublicNotices"}','live_solicitation','planned','C'),
('AZ','Arizona','scrape','{"eproc":"Arizona Procurement Portal (APP)","url":"app.az.gov"}','live_solicitation','planned','C'),
('AR','Arkansas','scrape','{"eproc":"ARBuy","url":"transform.ar.gov"}','live_solicitation','planned','C'),
('CA','California','ckan','{"base_url":"https://data.ca.gov","grants_portal":"grants.ca.gov"}','grant_reference','live','A'),
('CO','Colorado','socrata','{"domain":"data.colorado.gov","eproc":"ColoradoVSS"}','grant_reference','planned','A'),
('CT','Connecticut','socrata','{"domain":"data.ct.gov","eproc":"CT BizNet"}','grant_reference','planned','A'),
('DE','Delaware','socrata','{"domain":"data.delaware.gov","eproc":"MyMarketplace"}','grant_reference','planned','A'),
('DC','District of Columbia','scrape','{"portal":"opendata.dc.gov (ArcGIS Hub)","eproc":"ocp.dc.gov"}','live_solicitation','planned','B'),
('FL','Florida','scrape','{"eproc":"MyFloridaMarketPlace VBS","url":"vendor.myfloridamarketplace.com"}','live_solicitation','planned','C'),
('GA','Georgia','scrape','{"eproc":"Team Georgia Marketplace (Jaggaer)","portal":"DOAS bid notices"}','live_solicitation','planned','C'),
('HI','Hawaii','scrape','{"eproc":"HIePRO","portal":"data.hawaii.gov"}','live_solicitation','planned','B'),
('ID','Idaho','scrape','{"eproc":"Luma / IPRO"}','live_solicitation','planned','C'),
('IL','Illinois','socrata','{"domain":"data.illinois.gov","eproc":"BidBuy","grants":"GATA"}','grant_reference','planned','A'),
('IN','Indiana','scrape','{"eproc":"IDOA Indiana Bid"}','live_solicitation','planned','C'),
('IA','Iowa','socrata','{"domain":"mydata.iowa.gov","eproc":"IMPACS"}','grant_reference','planned','A'),
('KS','Kansas','scrape','{"eproc":"Kansas eSupplier / Smart"}','live_solicitation','planned','C'),
('KY','Kentucky','scrape','{"eproc":"eMARS Vendor Self Service"}','live_solicitation','planned','C'),
('LA','Louisiana','scrape','{"eproc":"LaPAC","url":"wwwprd.doa.louisiana.gov/osp/lapac"}','live_solicitation','planned','C'),
('ME','Maine','scrape','{"eproc":"Maine Procurement Services"}','live_solicitation','planned','C'),
('MD','Maryland','socrata','{"domain":"opendata.maryland.gov","eproc":"eMMA","url":"emma.maryland.gov"}','grant_reference','planned','A'),
('MA','Massachusetts','scrape','{"portal":"data.mass.gov (Tyler Data Hub)","eproc":"COMMBUYS","url":"commbuys.com"}','live_solicitation','planned','C'),
('MI','Michigan','socrata','{"domain":"data.michigan.gov","eproc":"SIGMA VSS"}','grant_reference','planned','A'),
('MN','Minnesota','scrape','{"eproc":"SWIFT Supplier Portal","url":"mn.gov/admin"}','live_solicitation','planned','C'),
('MS','Mississippi','scrape','{"eproc":"MAGIC (SAP)"}','live_solicitation','planned','C'),
('MO','Missouri','socrata','{"domain":"data.mo.gov","eproc":"MissouriBUYS"}','grant_reference','planned','A'),
('MT','Montana','scrape','{"eproc":"eMACS"}','live_solicitation','planned','C'),
('NE','Nebraska','scrape','{"eproc":"Nebraska eBid / DAS Materiel"}','live_solicitation','planned','C'),
('NV','Nevada','scrape','{"eproc":"NevadaEPro","url":"nevadaepro.com"}','live_solicitation','planned','C'),
('NM','New Mexico','scrape','{"eproc":"NM SourcingForce / GSD Purchasing","portal":"Sunshine Portal (sunshineportalnm.com)"}','live_solicitation','planned','C'),
('NH','New Hampshire','scrape','{"eproc":"NHFirst","url":"das.nh.gov"}','live_solicitation','planned','C'),
('NJ','New Jersey','socrata','{"domain":"data.nj.gov","eproc":"NJSTART","eproc_url":"njstart.gov/bso","grants":"SAGE","grants_url":"njsage.intelligrants.com","priority":true}','grant_reference','planned','A'),
('NY','New York','socrata','{"domain":"data.ny.gov","grants":"Grants Gateway","grants_url":"grantsmanagement.ny.gov","rfp":"NYS Contract Reporter","rfp_url":"nyscr.ny.gov","priority":true}','grant_reference','partial','A'),
('US-NYC','New York City','socrata','{"domain":"data.cityofnewyork.us","rfp":"City Record Online","rfp_url":"a856-cityrecord.nyc.gov","eproc":"PASSPort","priority":true}','live_solicitation','partial','A'),
('NC','North Carolina','scrape','{"eproc":"NC eVP / IPS","url":"evp.nc.gov"}','live_solicitation','planned','C'),
('ND','North Dakota','scrape','{"eproc":"ND Online Bidding / OMB"}','live_solicitation','planned','C'),
('OH','Ohio','scrape','{"eproc":"OhioBuys (Jaggaer)","url":"ohiobuys.ohio.gov"}','live_solicitation','planned','C'),
('OK','Oklahoma','scrape','{"eproc":"OK CAP / OMES"}','live_solicitation','planned','C'),
('OR','Oregon','socrata','{"domain":"data.oregon.gov","eproc":"OregonBuys","url":"oregonbuys.gov"}','grant_reference','planned','A'),
('PA','Pennsylvania','socrata','{"domain":"data.pa.gov","eproc":"PA eMarketplace","url":"emarketplace.state.pa.us"}','grant_reference','planned','A'),
('RI','Rhode Island','scrape','{"portal":"data.ri.gov","eproc":"RIVIP / Ocean State Procures"}','live_solicitation','planned','B'),
('SC','South Carolina','scrape','{"eproc":"SCBO (SC Business Opportunities)"}','live_solicitation','planned','C'),
('SD','South Dakota','scrape','{"eproc":"SD MyBidList / BFM"}','live_solicitation','planned','C'),
('TN','Tennessee','scrape','{"eproc":"Edison Supplier Portal","url":"tn.gov/generalservices"}','live_solicitation','planned','C'),
('TX','Texas','socrata','{"domain":"data.texas.gov","eproc":"ESBD","url":"txsmartbuy.gov/esbd","grants":"TX eGrants (per-agency)","priority":true}','grant_reference','planned','A'),
('UT','Utah','scrape','{"portal":"data.utah.gov","eproc":"SciQuest U3P","url":"solicitation.sciquest.com/Utah"}','live_solicitation','planned','B'),
('VT','Vermont','socrata','{"domain":"data.vermont.gov","eproc":"VT Bid Opportunities","url":"bgs.vermont.gov"}','grant_reference','planned','A'),
('VA','Virginia','ckan','{"base_url":"https://data.virginia.gov","eproc":"eVA","open_data":"eVA Open Data","url":"eva.virginia.gov"}','grant_reference','planned','A'),
('WA','Washington','socrata','{"domain":"data.wa.gov","eproc":"WEBS","url":"des.wa.gov/webs","priority":true}','grant_reference','planned','A'),
('WV','West Virginia','scrape','{"eproc":"wvOASIS Vendor Self Service","url":"vendor.wvoasis.gov"}','live_solicitation','planned','C'),
('WI','Wisconsin','scrape','{"eproc":"VendorNet","url":"vendornet.wi.gov"}','live_solicitation','planned','C'),
('WY','Wyoming','scrape','{"eproc":"Wyoming Public Notices","url":"ai.wyo.gov"}','live_solicitation','planned','C')
ON CONFLICT (state_code) DO NOTHING;
