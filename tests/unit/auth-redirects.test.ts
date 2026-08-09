import { describe, expect, it } from "vitest";
import { safeAuthNext } from "@/lib/auth/redirects";

describe("safeAuthNext", () => {
  it("keeps a customer route and query string", () => {
    expect(safeAuthNext("/press/studio?project=demo")).toBe(
      "/press/studio?project=demo",
    );
  });

  it.each([
    undefined,
    null,
    "",
    "https://attacker.example",
    "//attacker.example",
    "/api/private",
    "/auth/callback?next=/press/studio",
  ])("rejects unsafe destination %s", (value) => {
    expect(safeAuthNext(value)).toBeNull();
  });
});
