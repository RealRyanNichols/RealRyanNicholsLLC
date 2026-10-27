import assert from "node:assert/strict";
import test from "node:test";
import {
  createWaterIncidentHandler,
  waterIncidentSchema,
  WATER_REPORT_MAX_BYTES,
  type WaterIncidentDependencies,
} from "../lib/water-incident";

const valid = {
  town: "Marshall",
  county: "Harrison",
  incident_date: "2026-10-24",
  utility: "",
  general_location: "Near the public square",
  knowledge_basis: "firsthand",
  observed_details: "I personally observed a loss of water pressure.",
  heard_details: "",
  notice_context: "",
  notice_url: "",
  contact_email: "",
  contact_permission: false,
  private_review_consent: true,
  source_post_slug: "fiber-water-incident-review",
  website: "",
};

function request(
  payload: unknown = valid,
  headers: Record<string, string> = {},
) {
  return new Request("https://realryannichols.com/api/water-incident-reports", {
    method: "POST",
    headers: {
      origin: "https://realryannichols.com",
      "content-type": "application/json",
      ...headers,
    },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

function fixture(overrides: Partial<WaterIncidentDependencies> = {}) {
  const saved: unknown[] = [];
  const handler = createWaterIncidentHandler({
    isConfigured: () => true,
    rateLimit: async () => ({ ok: true, ipHash: "a".repeat(64) }),
    submit: async (input, ipHash) => {
      saved.push({ input, ipHash });
      return "saved";
    },
    ...overrides,
  });
  return { handler, saved };
}

test("anonymous firsthand report is accepted without implied contact or publication consent", () => {
  const parsed = waterIncidentSchema.parse(valid);
  assert.equal(parsed.contact_permission, false);
  assert.equal(parsed.contact_email, "");
  assert.equal("publication_consent" in parsed, false);
});

test("firsthand and secondhand information cannot silently substitute for one another", () => {
  assert.equal(
    waterIncidentSchema.safeParse({ ...valid, knowledge_basis: "secondhand" })
      .success,
    false,
  );
  assert.equal(
    waterIncidentSchema.safeParse({ ...valid, knowledge_basis: "mixed" })
      .success,
    false,
  );
  assert.equal(
    waterIncidentSchema.safeParse({
      ...valid,
      knowledge_basis: "secondhand",
      observed_details: "",
      heard_details: "A neighbor described the service interruption to me.",
    }).success,
    true,
  );
});

test("private review consent is required and contact requires both permission and an email", () => {
  for (const change of [
    { private_review_consent: false },
    { contact_email: "person@example.com" },
    { contact_permission: true },
  ]) {
    assert.equal(
      waterIncidentSchema.safeParse({ ...valid, ...change }).success,
      false,
    );
  }
  assert.equal(
    waterIncidentSchema.safeParse({
      ...valid,
      contact_email: "person@example.com",
      contact_permission: true,
    }).success,
    true,
  );
});

test("invalid dates, credential-bearing URLs and upload/publication fields are rejected", () => {
  for (const change of [
    { incident_date: "2026-02-31" },
    { notice_url: "javascript:alert(1)" },
    { notice_url: "https://user:password@example.com/notice" },
    { uploads: ["private-file"] },
    { publication_consent: true },
    { status: "published" },
    { home_address: "not collected" },
  ]) {
    assert.equal(
      waterIncidentSchema.safeParse({ ...valid, ...change }).success,
      false,
    );
  }
});

test("accepted notice URLs normalize to the same http/https representation required by storage", () => {
  for (const notice_url of [
    "HTTPS://example.com/notice",
    "https:example.com/notice",
  ]) {
    assert.equal(
      waterIncidentSchema.parse({ ...valid, notice_url }).notice_url,
      "https://example.com/notice",
    );
  }
});

test("cross-origin submissions stop before private storage", async () => {
  const { handler, saved } = fixture();
  assert.equal(
    (await handler(request(valid, { origin: "https://other.example" }))).status,
    403,
  );
  assert.equal(saved.length, 0);
});

test("trusted public origin accepts the reverse proxy's internal request URL", async () => {
  const { handler, saved } = fixture({ publicOrigin: "https://realryannichols.com" });
  const proxied = new Request("http://localhost:3103/api/water-incident-reports", {
    method: "POST",
    headers: { origin: "https://realryannichols.com", "content-type": "application/json" },
    body: JSON.stringify(valid),
  });
  assert.equal((await handler(proxied)).status, 201);
  assert.equal(saved.length, 1);
});

test("forwarded headers cannot widen the trusted public origin", async () => {
  const { handler, saved } = fixture({ publicOrigin: "https://realryannichols.com" });
  assert.equal((await handler(request(valid, {
    origin: "https://other.example",
    "x-forwarded-host": "other.example",
    "x-forwarded-proto": "https",
  }))).status, 403);
  assert.equal(saved.length, 0);
});

test("invalid configured public origin fails closed before storage", async () => {
  const { handler, saved } = fixture({ publicOrigin: "invalid configuration" });
  assert.equal((await handler(request())).status, 503);
  assert.equal(saved.length, 0);
});

test("missing origin, wrong content type and invalid JSON never reach storage", async () => {
  const { handler, saved } = fixture();
  const missing = request();
  missing.headers.delete("origin");
  assert.equal((await handler(missing)).status, 403);
  assert.equal(
    (await handler(request(valid, { "content-type": "text/plain" }))).status,
    415,
  );
  assert.equal((await handler(request("{"))).status, 400);
  assert.equal(saved.length, 0);
});

test("request byte limit applies to the actual body even without Content-Length", async () => {
  const { handler, saved } = fixture();
  const result = await handler(request("x".repeat(WATER_REPORT_MAX_BYTES + 1)));
  assert.equal(result.status, 413);
  assert.equal(saved.length, 0);
});

test("invalid or extra fields never reach private storage", async () => {
  const { handler, saved } = fixture();
  assert.equal(
    (await handler(request({ ...valid, approved: true }))).status,
    400,
  );
  assert.equal(saved.length, 0);
});

test("unconfigured intake fails closed", async () => {
  const { handler, saved } = fixture({ isConfigured: () => false });
  assert.equal((await handler(request())).status, 503);
  assert.equal(saved.length, 0);
});

test("attempt limit and atomic submission limit both produce a safe retry response", async () => {
  const limited = fixture({
    rateLimit: async () => ({
      ok: false,
      error: "internal detail",
      retryAfterSec: 3600,
    }),
  });
  const result = await limited.handler(request());
  assert.equal(result.status, 429);
  assert.equal(result.headers.get("retry-after"), "3600");
  assert.equal(limited.saved.length, 0);
  const atomic = fixture({ submit: async () => "rate_limited" });
  assert.equal((await atomic.handler(request())).status, 429);
});

test("storage failures do not echo report content or internal details", async () => {
  const { handler } = fixture({
    submit: async () => {
      throw new Error("private narrative and secret infrastructure detail");
    },
  });
  const result = await handler(request());
  assert.equal(result.status, 503);
  const body = await result.text();
  assert.equal(body.includes("secret"), false);
  assert.equal(body.includes(valid.observed_details), false);
});

test("successful response exposes no report, contact, ID, count or public ledger link", async () => {
  const { handler, saved } = fixture();
  const result = await handler(request());
  assert.equal(result.status, 201);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.equal(result.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.deepEqual(await result.json(), { ok: true });
  assert.equal(saved.length, 1);
});

test("honeypot does not write private data", async () => {
  const { handler, saved } = fixture();
  assert.equal(
    (await handler(request({ ...valid, website: "spam" }))).status,
    202,
  );
  assert.equal(saved.length, 0);
});
