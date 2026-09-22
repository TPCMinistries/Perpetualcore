import { describe, expect, it } from "vitest";
import { briefMailto, EMPTY_BRIEF, formatBrief, LIMITS, validateBrief, type RepairBrief } from "../../lib/repairs/brief";

const valid: RepairBrief = { category: "Next.js application", systems: "Next.js 16 & API", expected: "A record appears", actual: "Error: missing field", reproduction: "Use fictional customer Example & Sons.\nClick save.", name: "" };

describe("repair brief boundary", () => {
  it("requires the issue fields, but permits an anonymous request", () => {
    expect(validateBrief(valid)).toEqual({});
    expect(Object.keys(validateBrief(EMPTY_BRIEF))).toHaveLength(5);
    expect(validateBrief({ ...valid, actual: "   " })).toHaveProperty("actual");
  });
  it("rejects unsupported categories and oversized entries before export", () => {
    expect(validateBrief({ ...valid, category: "Other" })).toHaveProperty("category");
    const oversized = { ...valid, reproduction: "a".repeat(LIMITS.reproduction + 1) };
    expect(() => formatBrief(oversized)).toThrow();
  });
  it("encodes body contents as data rather than email header parameters", () => {
    const brief = { ...valid, actual: "&bcc=other@example.com # % ?\nUnicode: café" };
    const url = new URL(briefMailto(brief));
    expect(url.pathname).toBe("info@perpetualcore.com");
    expect([...url.searchParams.keys()]).toEqual(["subject", "body"]);
    expect(url.searchParams.get("body")).toBe(formatBrief(brief));
    expect(url.searchParams.get("body")).toContain("No purchase or delivery commitment");
  });
});
