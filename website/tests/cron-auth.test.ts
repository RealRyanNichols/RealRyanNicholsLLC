import assert from "node:assert/strict";
import test from "node:test";
import {
  deadmanCronSecretConfigured,
  isAuthorizedDeadmanCron,
} from "../lib/cron-auth";

test("cron authorization requires the exact configured bearer secret", () => {
  const secret = "0123456789abcdef0123456789abcdef";
  assert.equal(
    isAuthorizedDeadmanCron(
      new Request("https://example.com/api/cron", {
        headers: { authorization: `Bearer ${secret}` },
      }),
      secret,
    ),
    true,
  );
  assert.equal(
    isAuthorizedDeadmanCron(
      new Request("https://example.com/api/cron", {
        headers: { "x-vercel-cron-schedule": "0 * * * *" },
      }),
      secret,
    ),
    false,
  );
  assert.equal(
    isAuthorizedDeadmanCron(
      new Request("https://example.com/api/cron", {
        headers: { authorization: "Bearer wrong" },
      }),
      secret,
    ),
    false,
  );
});

test("cron readiness requires a nontrivial configured secret", () => {
  assert.equal(deadmanCronSecretConfigured("0123456789abcdef"), true);
  assert.equal(deadmanCronSecretConfigured("short"), false);
  assert.equal(deadmanCronSecretConfigured(""), false);
});

test("cron authorization fails closed when no secret is configured", () => {
  assert.equal(
    isAuthorizedDeadmanCron(
      new Request("https://example.com/api/cron", {
        headers: { "x-vercel-cron-schedule": "0 * * * *" },
      }),
      "",
    ),
    false,
  );
});
