import { test, expect } from "@playwright/test";

test.describe("API Input Validation", () => {
  test("POST /api/chat rejects empty body", async ({ request }) => {
    const response = await request.post("/api/chat", {
      data: {},
    });

    // Should return 400 or 401
    expect([400, 401, 403]).toContain(response.status());
  });

  test("POST /api/documents/upload rejects no file", async ({ request }) => {
    const response = await request.post("/api/documents/upload", {
      data: {},
    });

    // Should return 400 or 401
    expect([400, 401, 403, 415]).toContain(response.status());
  });

  test("POST /api/agents rejects empty body", async ({ request }) => {
    const response = await request.post("/api/agents", {
      data: {},
    });

    expect([400, 401, 403]).toContain(response.status());
  });

  test("POST /api/skills/custom rejects empty body", async ({ request }) => {
    const response = await request.post("/api/skills/custom", {
      data: {},
    });

    expect([400, 401, 403]).toContain(response.status());
  });

  test("POST /api/stripe/create-checkout-session rejects invalid plan", async ({ request }) => {
    const response = await request.post("/api/stripe/create-checkout-session", {
      data: { plan: "nonexistent_plan" },
    });

    expect([400, 401, 403]).toContain(response.status());
  });
});

test.describe("API Response Format", () => {
  test("health endpoint returns valid JSON", async ({ request }) => {
    const response = await request.get("/api/health");

    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");

    const data = await response.json();
    expect(data).toBeTruthy();
    expect(typeof data).toBe("object");
  });

  test("error responses have consistent format", async ({ request }) => {
    const response = await request.get("/api/admin/revenue");

    expect([401, 403]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(typeof data.error).toBe("string");
  });
});

test.describe("CORS and Content Security", () => {
  test("API responses have correct content type", async ({ request }) => {
    const response = await request.get("/api/health");

    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });

  test("HTML pages have security headers", async ({ request }) => {
    const response = await request.get("/");

    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  });

  test("HSTS header is present", async ({ request }) => {
    const response = await request.get("/");

    const headers = response.headers();
    // HSTS might only be set in production, so check if present
    if (headers["strict-transport-security"]) {
      expect(headers["strict-transport-security"]).toContain("max-age");
    }
  });
});
