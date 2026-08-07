import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type { OpportunityInput } from "@/lib/rfp/ingest/normalize";
import {
  persistCanonicalAliases,
  type OpportunityRowWithId,
} from "@/lib/rfp/ingest/canonicalize";
import { recordBaseline } from "@/lib/rfp/ingest/scrape/drift";

export type CuratedSourceName = "corporate_foundations" | "bank_cra";

interface CuratedProgram {
  source: CuratedSourceName;
  slug: string;
  title: string;
  agency: string;
  type: string;
  url: string;
  brief: string;
  keywords: string[];
  amount_min?: number | null;
  amount_max?: number | null;
  focus_areas?: string[];
  markets?: string[];
  cycle?: string;
  eligibility?: string;
  application_mode?: "open" | "invitation" | "letter_of_interest" | "rolling" | "cycle";
  needs_review?: boolean;
}

interface CuratedProgramMonitoring {
  application_window_status: "open" | "rolling" | "invitation_only" | "cycle_watch" | "verify";
  review_cadence_days: number;
  next_verification: string;
}

export interface CuratedIngestResult {
  source: CuratedSourceName;
  fetched: number;
  upserted: number;
  canonicalized: number;
  upserted_ids: string[];
  errors: string[];
}

const CORPORATE_PROGRAMS: CuratedProgram[] = [
  {
    source: "corporate_foundations",
    slug: "walmart-spark-good-local-grants",
    title: "Walmart Spark Good Local Grants",
    agency: "Walmart Foundation",
    type: "Corporate Foundation Grant",
    url: "https://walmart.org/how-we-give/program-guidelines/spark-good-local-grants-guidelines",
    brief:
      "Open local giving program for eligible nonprofits serving communities around Walmart and Sam's Club facilities. Published guidance lists awards from $250 to $5,000.",
    amount_min: 250,
    amount_max: 5_000,
    keywords: ["corporate giving", "local grants", "community", "walmart"],
  },
  {
    source: "corporate_foundations",
    slug: "target-circle-community-giving",
    title: "Target Circle Community Giving",
    agency: "Target",
    type: "Corporate Community Giving",
    url: "https://corporate.target.com/about/purpose-history/communities/grants-corporate-giving/target-circle-community-giving",
    brief:
      "Community giving program where nonprofits can apply to be considered as Target Circle nonprofit partners and receive guest-directed local giving.",
    keywords: ["corporate giving", "community", "retail", "target"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "costco-charitable-giving",
    title: "Costco Charitable Giving",
    agency: "Costco Wholesale",
    type: "Corporate Charitable Giving",
    url: "https://www.costco.com/charitable-giving.html",
    brief:
      "Rolling charitable giving for 501(c)(3) nonprofits focused on children, education, health, and human services.",
    keywords: ["corporate giving", "children", "education", "health", "human services"],
  },
  {
    source: "corporate_foundations",
    slug: "coca-cola-foundation-grants",
    title: "The Coca-Cola Foundation Grants",
    agency: "The Coca-Cola Foundation",
    type: "Corporate Foundation Grant",
    url: "https://www.coca-colacompany.com/about-us/people-and-communities/the-coca-cola-foundation",
    brief:
      "Foundation grantmaking focused on water access, watershed conservation, recycling value chains, disaster preparedness and response, economic prosperity, and hometown community causes.",
    keywords: ["corporate foundation", "water", "recycling", "disaster response", "economic prosperity"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "lowes-foundation-gable-grants",
    title: "Lowe's Foundation Gable Grants",
    agency: "Lowe's Foundation",
    type: "Corporate Foundation Workforce Grant",
    url: "https://corporate.lowes.com/our-responsibilities/lowes-foundation",
    brief:
      "Skilled trades workforce grant program supporting community-based nonprofits and community or technical colleges that train job-ready tradespeople.",
    keywords: ["corporate foundation", "workforce", "skilled trades", "career pathways"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "state-farm-good-neighbor-community-grants",
    title: "State Farm Good Neighbor Citizenship Company Grants",
    agency: "State Farm",
    type: "Corporate Community Grant",
    url: "https://www.statefarm.com/about-us/corporate-responsibility/community-grants",
    brief:
      "Community grant program aligned with safety, community development, and education to help build safer, stronger, and better educated communities.",
    keywords: ["corporate giving", "safety", "community development", "education"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "verizon-foundation-grants",
    title: "Verizon Foundation Grant Requirements",
    agency: "Verizon",
    type: "Corporate Foundation Grant",
    url: "https://www.verizon.com/about/responsibility/grant-requirements",
    brief:
      "Grant program aligned around digital inclusion, climate protection, and human prosperity. New applications are by invitation only.",
    keywords: ["corporate foundation", "digital inclusion", "climate", "human prosperity"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "microsoft-nonprofit-technology-grants",
    title: "Microsoft Nonprofit Technology Grants",
    agency: "Microsoft",
    type: "Corporate Technology Grant",
    url: "https://www.microsoft.com/en-us/nonprofits/offers-for-nonprofits",
    brief:
      "Technology grants and discounts for eligible nonprofits, including Microsoft cloud products and nonprofit solutions.",
    keywords: ["corporate giving", "technology grants", "cloud", "digital capacity"],
  },
  {
    source: "corporate_foundations",
    slug: "home-depot-foundation-veteran-housing-grants",
    title: "The Home Depot Foundation Veteran Housing Grants",
    agency: "The Home Depot Foundation",
    type: "Corporate Foundation Housing Grant",
    url: "https://corporate.homedepot.com/page/grants",
    brief:
      "Grant programs supporting nonprofit partners that create and preserve housing for veterans and help communities recover from natural disasters.",
    keywords: ["corporate foundation", "veterans", "housing", "disaster recovery"],
    focus_areas: ["veteran housing", "disaster response", "community development"],
    application_mode: "cycle",
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "chick-fil-a-true-inspiration-awards",
    title: "Chick-fil-A True Inspiration Awards",
    agency: "Chick-fil-A, Inc.",
    type: "Corporate Community Grant",
    url: "https://www.chick-fil-a.com/true-inspiration-awards",
    brief:
      "Annual grant program recognizing nonprofit organizations working in education, hunger, and community-centered initiatives.",
    keywords: ["corporate giving", "education", "hunger", "community"],
    focus_areas: ["education", "hunger", "community development"],
    application_mode: "cycle",
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "starbucks-foundation-neighborhood-grants",
    title: "The Starbucks Foundation Neighborhood Grants",
    agency: "The Starbucks Foundation",
    type: "Corporate Foundation Local Grant",
    url: "https://stories.starbucks.com/stories/neighborhood-grants/",
    brief:
      "Neighborhood Grants support grassroots and local nonprofits nominated by Starbucks partners and community members.",
    keywords: ["corporate foundation", "local grants", "neighborhood", "community"],
    focus_areas: ["local community", "grassroots nonprofits"],
    application_mode: "cycle",
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "publix-charities-grant-requests",
    title: "Publix Super Markets Charities Grant Requests",
    agency: "Publix Super Markets Charities",
    type: "Corporate Foundation Grant",
    url: "https://www.publixcharities.org/requests",
    brief:
      "Grant requests for eligible nonprofit organizations in Publix operating areas, with published focus areas including youth, education, food insecurity, and housing.",
    keywords: ["corporate foundation", "youth", "education", "food insecurity", "housing"],
    focus_areas: ["youth", "education", "food insecurity", "housing"],
    markets: ["Publix operating areas"],
    application_mode: "cycle",
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "kroger-zero-hunger-zero-waste-foundation",
    title: "Kroger Zero Hunger | Zero Waste Foundation",
    agency: "The Kroger Co. Foundation",
    type: "Corporate Foundation Food Security Grant",
    url: "https://www.thekrogerco.com/community/zero-hunger-zero-waste/",
    brief:
      "Foundation and community investment work focused on ending hunger and eliminating waste in communities Kroger serves.",
    keywords: ["corporate foundation", "food security", "hunger", "waste reduction"],
    focus_areas: ["food security", "hunger relief", "waste reduction"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "aws-imagine-grant",
    title: "AWS Imagine Grant",
    agency: "Amazon Web Services",
    type: "Corporate Technology Grant",
    url: "https://aws.amazon.com/government-education/nonprofits/aws-imagine-grant-program/",
    brief:
      "Technology grant program supporting nonprofit organizations using cloud technology to accelerate mission impact.",
    keywords: ["corporate giving", "technology grants", "cloud", "nonprofit innovation"],
    focus_areas: ["cloud technology", "nonprofit innovation", "digital capacity"],
    application_mode: "cycle",
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "google-ad-grants",
    title: "Google Ad Grants",
    agency: "Google for Nonprofits",
    type: "Corporate Technology Grant",
    url: "https://www.google.com/grants/",
    brief:
      "In-kind Google Search advertising grant for eligible nonprofits to promote mission, programs, and fundraising.",
    amount_max: 10_000,
    keywords: ["corporate giving", "advertising", "digital marketing", "nonprofit technology"],
    focus_areas: ["digital marketing", "audience growth", "fundraising"],
    application_mode: "open",
  },
  {
    source: "corporate_foundations",
    slug: "cisco-foundation-social-impact-grants",
    title: "Cisco Foundation Social Impact Grants",
    agency: "Cisco Foundation",
    type: "Corporate Foundation Grant",
    url: "https://www.cisco.com/c/en/us/about/csr/community/nonprofits.html",
    brief:
      "Social impact grants and nonprofit partnerships aligned with Cisco's priorities around digital inclusion, economic empowerment, crisis response, and climate impact.",
    keywords: ["corporate foundation", "digital inclusion", "economic empowerment", "crisis response", "climate"],
    focus_areas: ["digital inclusion", "economic empowerment", "crisis response", "climate"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "toyota-usa-foundation-grants",
    title: "Toyota USA Foundation Grants",
    agency: "Toyota USA Foundation",
    type: "Corporate Foundation Education Grant",
    url: "https://www.toyotaeffect.com/impact/tuf/",
    brief:
      "Foundation grantmaking focused on education and preparing students for future careers, with emphasis on STEM and underserved communities.",
    keywords: ["corporate foundation", "education", "stem", "career readiness"],
    focus_areas: ["STEM education", "career readiness", "underserved students"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "hyundai-hope-grants",
    title: "Hyundai Hope Grants",
    agency: "Hyundai Hope",
    type: "Corporate Foundation Health Grant",
    url: "https://hyundaihope.com/",
    brief:
      "Corporate philanthropy program supporting pediatric cancer research and nonprofit hospital partners through Hyundai Hope.",
    keywords: ["corporate foundation", "health", "pediatric cancer", "research"],
    focus_areas: ["pediatric cancer", "health research", "hospital partners"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "aflac-childhood-cancer-foundation",
    title: "Aflac Childhood Cancer Foundation",
    agency: "Aflac Childhood Cancer Foundation",
    type: "Corporate Foundation Health Grant",
    url: "https://www.aflacchildhoodcancer.org/",
    brief:
      "Foundation and corporate philanthropy focused on childhood cancer and blood disorders through hospital, family, and research support.",
    keywords: ["corporate foundation", "health", "childhood cancer", "blood disorders"],
    focus_areas: ["childhood cancer", "blood disorders", "family support"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "delta-community-engagement",
    title: "Delta Air Lines Community Engagement",
    agency: "Delta Air Lines",
    type: "Corporate Community Giving",
    url: "https://www.delta.com/us/en/about-delta/community",
    brief:
      "Community engagement and giving program supporting nonprofit partners in Delta communities, with focus areas including education, wellness, and equity.",
    keywords: ["corporate giving", "education", "wellness", "equity", "community"],
    focus_areas: ["education", "wellness", "equity", "community"],
    markets: ["Delta communities"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "southwest-airlines-charitable-giving",
    title: "Southwest Airlines Charitable Giving",
    agency: "Southwest Airlines",
    type: "Corporate Community Giving",
    url: "https://www.southwest.com/citizenship/people/community-outreach/",
    brief:
      "Community outreach and charitable giving aligned with strengthening communities and supporting nonprofit partners across Southwest markets.",
    keywords: ["corporate giving", "community", "travel", "nonprofit partners"],
    focus_areas: ["community", "travel support", "nonprofit partnerships"],
    markets: ["Southwest Airlines markets"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "att-connected-learning",
    title: "AT&T Connected Learning",
    agency: "AT&T",
    type: "Corporate Digital Inclusion Program",
    url: "https://about.att.com/csr/home/society/education.html",
    brief:
      "Corporate social impact program focused on digital inclusion, connectivity, and education support for learners and families.",
    keywords: ["corporate giving", "digital inclusion", "education", "connectivity"],
    focus_areas: ["digital inclusion", "education", "connectivity"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "comcast-project-up",
    title: "Comcast Project UP",
    agency: "Comcast NBCUniversal",
    type: "Corporate Digital Equity Program",
    url: "https://corporate.comcast.com/impact/project-up",
    brief:
      "Digital equity initiative supporting connectivity, skills, entrepreneurship, and community partners working to expand opportunity.",
    keywords: ["corporate giving", "digital equity", "connectivity", "skills", "entrepreneurship"],
    focus_areas: ["digital equity", "skills", "entrepreneurship", "connectivity"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "tmobile-hometown-grants",
    title: "T-Mobile Hometown Grants",
    agency: "T-Mobile",
    type: "Corporate Community Grant",
    url: "https://www.t-mobile.com/brand/hometown-grants",
    brief:
      "Grant program supporting community projects in small towns across America, including downtown revitalization, public spaces, and local gathering places.",
    amount_max: 50_000,
    keywords: ["corporate giving", "small towns", "community development", "public spaces"],
    focus_areas: ["small towns", "public spaces", "community development"],
    application_mode: "cycle",
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "nfl-foundation-grants",
    title: "NFL Foundation Grants",
    agency: "NFL Foundation",
    type: "Corporate/Foundation Sports Grant",
    url: "https://www.nflfoundation.org/grants",
    brief:
      "Grant programs supporting youth football, health and safety, community initiatives, and player-supported charitable activities.",
    keywords: ["foundation grant", "sports", "youth", "health", "community"],
    focus_areas: ["youth sports", "health and safety", "community"],
    application_mode: "cycle",
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "dicks-sporting-goods-sports-matter",
    title: "DICK'S Sporting Goods Sports Matter",
    agency: "DICK'S Sporting Goods Foundation",
    type: "Corporate Foundation Youth Sports Grant",
    url: "https://www.sportsmatter.org/",
    brief:
      "Foundation initiative supporting youth sports access through grants, equipment, and community partnerships.",
    keywords: ["corporate foundation", "youth sports", "equipment", "access"],
    focus_areas: ["youth sports", "sports access", "equipment"],
    needs_review: true,
  },
  {
    source: "corporate_foundations",
    slug: "genentech-foundation-giving",
    title: "Genentech Giving and Philanthropy",
    agency: "Genentech",
    type: "Corporate Health Equity Grant",
    url: "https://www.gene.com/good/giving",
    brief:
      "Corporate giving and grantmaking supporting health equity, science education, patient communities, and local community needs.",
    keywords: ["corporate giving", "health equity", "science education", "patients"],
    focus_areas: ["health equity", "science education", "patient communities"],
    needs_review: true,
  },
];

const BANK_CRA_PROGRAMS: CuratedProgram[] = [
  {
    source: "bank_cra",
    slug: "bank-of-america-charitable-foundation-local-grants",
    title: "Bank of America Charitable Foundation Local Grants",
    agency: "Bank of America Charitable Foundation",
    type: "Bank Foundation Grant",
    url: "https://about.bankofamerica.com/en/making-an-impact/grant-funding-for-nonprofits-sponsorship-programs",
    brief:
      "Nonprofit grant funding aligned with economic mobility priorities including basic needs, income creation, stable housing, and empowered communities.",
    keywords: ["bank foundation", "economic mobility", "basic needs", "housing", "community development"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "bank-of-america-neighborhood-builders",
    title: "Bank of America Neighborhood Builders",
    agency: "Bank of America Charitable Foundation",
    type: "Bank Foundation Leadership Grant",
    url: "https://about.bankofamerica.com/en/making-an-impact/neighborhood-builders-eligibility-criteria",
    brief:
      "Leadership development and grant program for eligible 501(c)(3) nonprofits in Bank of America markets. Published award ranges run from $100,000 to $400,000 over two years.",
    amount_min: 100_000,
    amount_max: 400_000,
    keywords: ["bank foundation", "leadership", "economic mobility", "community development"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "us-bank-community-possible",
    title: "U.S. Bank Foundation Community Possible Grants",
    agency: "U.S. Bank Foundation",
    type: "Bank Foundation Grant",
    url: "https://www.usbank.com/about-us-bank/community/community-possible-grant-program.html",
    brief:
      "Community Possible grants support work, home, and play priorities. New and emerging organizations may submit a letter of interest during the year.",
    keywords: ["bank foundation", "workforce", "housing", "arts", "community"],
  },
  {
    source: "bank_cra",
    slug: "truist-foundation-grants",
    title: "Truist Foundation Grants",
    agency: "Truist Foundation",
    type: "Bank Foundation Grant",
    url: "https://www.truist.com/purpose/truist-foundation/grant-application",
    brief:
      "Open application grant program for nonprofits focused on building career pathways to economic mobility or strengthening small businesses. Published guidance indicates grants of $5,000 or more.",
    amount_min: 5_000,
    keywords: ["bank foundation", "career pathways", "small business", "economic mobility"],
  },
  {
    source: "bank_cra",
    slug: "pnc-foundation-grants",
    title: "PNC Foundation Grants",
    agency: "PNC Foundation",
    type: "Bank Foundation Grant",
    url: "https://www.pnc.com/en/about-pnc/corporate-responsibility/philanthropy/pnc-foundation.html",
    brief:
      "Foundation grants for nonprofit organizations, with emphasis on early childhood education, economic development, and diverse community impact in PNC markets.",
    keywords: ["bank foundation", "early childhood", "economic development", "community"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "pnc-charitable-trusts",
    title: "PNC Charitable Trust Grants",
    agency: "PNC Institutional Asset Management",
    type: "Bank Trustee Foundation Grant",
    url: "https://www.pnc.com/en/about-pnc/corporate-responsibility/philanthropy/charitable-trusts.html",
    brief:
      "Charitable trusts administered by PNC with regional application cycles and deadlines for eligible nonprofit organizations.",
    keywords: ["bank trustee", "charitable trust", "regional grants", "community"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "truist-trusteed-foundations",
    title: "Truist Trusteed Foundations Grant Application",
    agency: "Truist",
    type: "Bank Trustee Foundation Grant",
    url: "https://www.truist.com/trusteed-foundations/application-info",
    brief:
      "Online grant application process for Truist Trusteed Foundations with foundation-specific guidelines and cycle deadlines.",
    keywords: ["bank trustee", "charitable trust", "foundation grants", "regional"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "jpmorgan-chase-community-impact",
    title: "JPMorganChase Community Impact Philanthropy",
    agency: "JPMorganChase",
    type: "Bank Philanthropy Program",
    url: "https://www.jpmorganchase.com/impact",
    brief:
      "Philanthropic and community investment priorities include neighborhood revitalization, affordable housing, skills training, job creation, small business growth, and financial health.",
    keywords: ["bank philanthropy", "affordable housing", "workforce", "small business", "financial health"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "wells-fargo-community-giving",
    title: "Wells Fargo Community Giving",
    agency: "Wells Fargo Foundation",
    type: "Bank Foundation Grant",
    url: "https://www.wellsfargo.com/about/corporate-responsibility/community-giving/",
    brief:
      "Community giving and grantmaking aligned with housing affordability, small business growth, financial health, and sustainability.",
    keywords: ["bank foundation", "housing", "small business", "financial health", "sustainability"],
    focus_areas: ["housing affordability", "small business", "financial health", "sustainability"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "td-charitable-foundation-grants",
    title: "TD Charitable Foundation Grants",
    agency: "TD Charitable Foundation",
    type: "Bank Foundation Grant",
    url: "https://www.td.com/us/en/about-us/communities/ready-commitment/funding-opportunities/td-charitable-foundation",
    brief:
      "Foundation grantmaking for eligible nonprofits in TD markets, aligned with financial security, vibrant planet, connected communities, and better health.",
    keywords: ["bank foundation", "financial security", "environment", "health", "community"],
    focus_areas: ["financial security", "environment", "health", "community"],
    markets: ["TD Bank markets"],
    application_mode: "cycle",
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "regions-foundation-grants",
    title: "Regions Foundation Grants",
    agency: "Regions Foundation",
    type: "Bank Foundation Grant",
    url: "https://www.regions.com/about-regions/community-engagement/regions-foundation",
    brief:
      "Foundation grantmaking focused on economic and community development, education and workforce readiness, and financial wellness.",
    keywords: ["bank foundation", "economic development", "education", "workforce", "financial wellness"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "citi-foundation-grants",
    title: "Citi Foundation Grants",
    agency: "Citi Foundation",
    type: "Bank Foundation Grant",
    url: "https://www.citigroup.com/global/foundation",
    brief:
      "Foundation grantmaking focused on economic opportunity, youth employment, financial inclusion, and community solutions.",
    keywords: ["bank foundation", "economic opportunity", "youth employment", "financial inclusion"],
    focus_areas: ["economic opportunity", "youth employment", "financial inclusion"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "morgan-stanley-foundation",
    title: "Morgan Stanley Foundation",
    agency: "Morgan Stanley Foundation",
    type: "Bank Foundation Grant",
    url: "https://www.morganstanley.com/about-us/giving-back",
    brief:
      "Foundation and community affairs work supporting children's health, education, diversity, and community resilience.",
    keywords: ["bank foundation", "children", "health", "education", "community"],
    focus_areas: ["children's health", "education", "diversity", "community resilience"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "flagstar-foundation",
    title: "Flagstar Foundation Grants",
    agency: "Flagstar Foundation",
    type: "Bank Foundation Grant",
    url: "https://www.flagstar.com/community-involvement/flagstar-foundation.html",
    brief:
      "Foundation grants supporting charitable organizations in Flagstar communities, with emphasis on workforce readiness, arts and culture, and community investment.",
    keywords: ["bank foundation", "workforce readiness", "arts", "community investment"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "cadence-bank-foundation",
    title: "Cadence Bank Foundation Grants",
    agency: "Cadence Bank Foundation",
    type: "Bank Foundation Grant",
    url: "https://cadencebank.com/about/community-involvement",
    brief:
      "Community involvement and foundation support for nonprofit organizations in Cadence Bank markets.",
    keywords: ["bank foundation", "community involvement", "nonprofit support"],
    markets: ["Cadence Bank markets"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "synovus-foundation",
    title: "Synovus Foundation Grants",
    agency: "Synovus Foundation",
    type: "Bank Foundation Grant",
    url: "https://www.synovus.com/about-us/community-outreach/",
    brief:
      "Community outreach and foundation giving supporting nonprofit partners across Synovus markets.",
    keywords: ["bank foundation", "community outreach", "nonprofit partners"],
    markets: ["Synovus markets"],
    needs_review: true,
  },
  {
    source: "bank_cra",
    slug: "eastern-bank-foundation",
    title: "Eastern Bank Foundation Grants",
    agency: "Eastern Bank Foundation",
    type: "Bank Foundation Grant",
    url: "https://www.easternbank.com/foundation",
    brief:
      "Foundation grants and community advocacy supporting economic inclusion, community vitality, and nonprofit partners.",
    keywords: ["bank foundation", "economic inclusion", "community vitality", "nonprofit partners"],
    needs_review: true,
  },
];

const PROGRAMS_BY_SOURCE: Record<CuratedSourceName, CuratedProgram[]> = {
  corporate_foundations: CORPORATE_PROGRAMS,
  bank_cra: BANK_CRA_PROGRAMS,
};

export function getCuratedProgramCounts(): Record<CuratedSourceName, number> {
  return {
    corporate_foundations: CORPORATE_PROGRAMS.length,
    bank_cra: BANK_CRA_PROGRAMS.length,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function sourceId(program: CuratedProgram): string {
  return createHash("sha256")
    .update(`${program.source}:${program.slug}:${program.url}`)
    .digest("hex")
    .slice(0, 24);
}

function monitoringFor(program: CuratedProgram): CuratedProgramMonitoring {
  if (program.application_mode === "open") {
    return {
      application_window_status: "open",
      review_cadence_days: 30,
      next_verification: "Confirm eligibility, award limits, and any updated application instructions monthly.",
    };
  }
  if (program.application_mode === "rolling") {
    return {
      application_window_status: "rolling",
      review_cadence_days: 30,
      next_verification: "Check monthly for changed submission links, criteria, or rolling-program pauses.",
    };
  }
  if (program.application_mode === "invitation") {
    return {
      application_window_status: "invitation_only",
      review_cadence_days: 90,
      next_verification: "Research relationship path and confirm whether unsolicited applications are accepted.",
    };
  }
  if (program.application_mode === "letter_of_interest") {
    return {
      application_window_status: "cycle_watch",
      review_cadence_days: 45,
      next_verification: "Check whether the next LOI window is open and capture the deadline before pursuit.",
    };
  }
  if (program.application_mode === "cycle") {
    return {
      application_window_status: "cycle_watch",
      review_cadence_days: 45,
      next_verification: "Monitor for the next application cycle, deadline, and refreshed program guidelines.",
    };
  }
  return {
    application_window_status: "verify",
    review_cadence_days: program.needs_review ? 30 : 60,
    next_verification: "Open the official source page and classify the application window before pursuit.",
  };
}

function toInput(program: CuratedProgram): OpportunityInput {
  return {
    source: program.source,
    source_id: sourceId(program),
    title: program.title,
    agency: program.agency,
    type: program.type,
    amount_min: program.amount_min ?? null,
    amount_max: program.amount_max ?? null,
    deadline: null,
    posted_at: null,
    brief: program.brief,
    keywords: [
      program.source === "bank_cra" ? "cra" : "corporate foundation",
      ...program.keywords,
    ],
    geo: "US",
    url: program.url,
    needs_review: program.needs_review ?? false,
    raw_json: {
      curated_program: program,
      source_monitoring: monitoringFor(program),
      curated_at: nowIso(),
      source_note:
        "Curated from official funder program pages. Deadlines and invitation status require source-page review before pursuit.",
    },
  };
}

function toRow(input: OpportunityInput): Omit<OpportunityRowWithId, "id"> {
  return {
    source: input.source as CuratedSourceName,
    source_id: input.source_id,
    title: input.title,
    agency: input.agency ?? null,
    type: input.type ?? null,
    amount_min: input.amount_min ?? null,
    amount_max: input.amount_max ?? null,
    deadline: input.deadline ?? null,
    posted_at: input.posted_at ?? null,
    brief: input.brief ?? null,
    keywords: input.keywords ?? [],
    geo: input.geo ?? null,
    url: input.url ?? null,
    needs_review: input.needs_review ?? true,
    last_seen_at: nowIso(),
    raw_json: input.raw_json,
  };
}

export function isCuratedIngestSource(source: string): source is CuratedSourceName {
  return source === "corporate_foundations" || source === "bank_cra";
}

export async function runCuratedIngest(options?: {
  sources?: CuratedSourceName[];
}): Promise<CuratedIngestResult[]> {
  const requested = new Set(options?.sources ?? Object.keys(PROGRAMS_BY_SOURCE));
  const sources = (Object.keys(PROGRAMS_BY_SOURCE) as CuratedSourceName[]).filter(
    (source) => requested.has(source),
  );
  const supabase = createAdminClient() as unknown as {
    from: (table: string) => any;
  };
  const results: CuratedIngestResult[] = [];

  for (const source of sources) {
    const inputs = PROGRAMS_BY_SOURCE[source].map(toInput);
    const rows = inputs.map(toRow);
    const { data, error } = await supabase
      .from("rfp_opportunities")
      .upsert(rows as unknown as never[], {
        onConflict: "source,source_id",
        ignoreDuplicates: false,
      })
      .select(
        "id, source, source_id, title, agency, type, amount_min, amount_max, deadline, posted_at, brief, keywords, geo, url, needs_review, last_seen_at, raw_json",
      );

    if (error) {
      results.push({
        source,
        fetched: inputs.length,
        upserted: 0,
        canonicalized: 0,
        upserted_ids: [],
        errors: [`upsert: ${error.message}`],
      });
      continue;
    }

    const upsertedRows = (data ?? []) as OpportunityRowWithId[];
    const canonical = await persistCanonicalAliases(upsertedRows);
    await recordBaseline(source, inputs.length);
    results.push({
      source,
      fetched: inputs.length,
      upserted: upsertedRows.length,
      canonicalized: canonical.aliases_upserted,
      upserted_ids: upsertedRows.map((row) => String(row.id)),
      errors: canonical.errors,
    });
  }

  return results;
}
