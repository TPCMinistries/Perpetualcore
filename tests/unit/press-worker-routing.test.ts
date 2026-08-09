import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const proxySource = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");
const claimRouteSource = readFileSync(
  resolve(process.cwd(), "app/api/press/worker/jobs/claim/route.ts"),
  "utf8",
);

describe("Press worker routing contract", () => {
  it("lets the authenticated queue worker reach its claim route", () => {
    expect(proxySource).not.toContain("PRESS_WORKER_ENDPOINT_RETIRED");
    expect(proxySource).not.toContain("Press worker endpoint retired");
    expect(proxySource).toContain("pathname.startsWith('/api/press/worker/')");
    expect(claimRouteSource).toContain("requireWorkerAuthorization");
    expect(claimRouteSource).toContain('from("press_worker_heartbeats").upsert');
  });
});
