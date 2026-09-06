import { describe, expect, it } from "vitest";

import { parseNyscrSearchPage } from "@/lib/rfp/ingest/scrape/nys-contract-reporter";

// Trimmed from a live https://www.nyscr.ny.gov/Ads/Search response, 2026-09-06.
const FIXTURE = `
<div class="mb-4 filter-tags"></div>
<div class="opp-list-item d-flex gap-1 mb-3" data-ad-id="2138734">
  <div class="flex-fill min-w-0 border-lg-dark-subtle">
    <div class="d-flex">
      <div class="d-none d-lg-block w-exact-8 px-2 py-1 flex-shrink-0 bg-dark text-light text-end fs-5">Title:</div>
      <div class="flex-fill min-w-0 px-2 py-1 bg-primary text-light fs-5 text-lg-truncate" title="Full Title: IFB 1254 Special Education Teacher for MacCormick Secure Center"> IFB 1254 Special Education Teacher for MacCormick Secure Center </div>
    </div>
    <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold fs-5">CR#:</div><div class="px-2 fw-bold fs-5">2138734</div></div>
    <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold"> Agency: </div><div class="px-2">Children &amp; Family Services, NYS Office of</div></div>
    <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold">Division:</div><div class="px-2">Bureau of Contract Management</div></div>
    <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold">Issue date:</div><div class="px-2">9/4/2026</div></div>
    <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold"> Due date: </div><div class="px-2"> 11/2/2026 </div></div>
    <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold">Category:</div><div class="px-2">Educational &amp; Recreational</div></div>
    <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold">Ad type:</div><div class="px-2">General</div></div>
  </div>
</div>
<div class="opp-list-item d-flex gap-1 mb-3" data-ad-id="2138770">
  <div class="flex-fill min-w-0 px-2 py-1 bg-primary text-light fs-5 text-lg-truncate" title="Full Title: SDVOB Opportunity - Matco Electric Corporation"> SDVOB Opportunity </div>
  <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold fs-5">CR#:</div><div class="px-2 fw-bold fs-5">2138770</div></div>
  <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold">Company:</div><div class="px-2">Matco Electric Corporation</div></div>
  <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold"> Due date: </div><div class="px-2"> Proposals accepted continuously. </div></div>
  <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold">Ad type:</div><div class="px-2">Contractor Ads</div></div>
</div>
<div class="opp-list-item d-flex gap-1 mb-3" data-ad-id="2138359">
  <div class="flex-fill min-w-0 px-2 py-1 bg-primary text-light fs-5 text-lg-truncate" title="Full Title: Workforce Innovation and Opportunity Act Title II and Welfare Education Program Funding WIOA RFP"> Workforce Innovation... </div>
  <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold fs-5">CR#:</div><div class="px-2 fw-bold fs-5">2138359</div></div>
  <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold"> Agency: </div><div class="px-2">Education, NYS Dept. of</div></div>
  <div class="d-flex"><div class="w-exact-8 px-2 flex-shrink-0 text-end bg-light fw-bold"> Due date: </div><div class="px-2"> 11/13/2026 </div></div>
</div>
`;

describe("NYS Contract Reporter search parser", () => {
  it("extracts one ad per data-ad-id block with labeled fields", () => {
    const ads = parseNyscrSearchPage(FIXTURE);
    expect(ads).toHaveLength(3);

    const [first, contractor, second] = ads;
    expect(contractor.adId).toBe("2138770");
    expect(contractor.fields["company"]).toBe("Matco Electric Corporation");
    expect(contractor.fields["due date"]).toBe("Proposals accepted continuously.");
    expect(first.adId).toBe("2138734");
    expect(first.title).toBe(
      "IFB 1254 Special Education Teacher for MacCormick Secure Center"
    );
    expect(first.fields["cr#"]).toBe("2138734");
    expect(first.fields["agency"]).toBe("Children & Family Services, NYS Office of");
    expect(first.fields["due date"]).toBe("11/2/2026");
    expect(first.fields["category"]).toBe("Educational & Recreational");
    expect(first.fields["ad type"]).toBe("General");

    expect(second.adId).toBe("2138359");
    expect(second.fields["agency"]).toBe("Education, NYS Dept. of");
    expect(second.fields["due date"]).toBe("11/13/2026");
  });

  it("returns an empty list when the listing markup is absent", () => {
    expect(parseNyscrSearchPage("<html><body>Log in</body></html>")).toEqual([]);
  });
});
