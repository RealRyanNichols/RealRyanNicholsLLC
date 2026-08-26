import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInitialCustodyBulletin,
  deadmanReleaseDue,
  parseDeadmanActivators,
} from "../lib/deadman";

test("parseDeadmanActivators accepts valid unique hashed contacts and fails closed", () => {
  const hash = "a".repeat(64);
  const contacts = parseDeadmanActivators(
    JSON.stringify([
      { id: "amanda", label: "Amanda Williams", hash, active: true },
      { id: "amanda", label: "Duplicate", hash: "b".repeat(64) },
      { id: "bad id", label: "Bad", hash },
      { id: "short", label: "", hash },
    ]),
  );
  assert.deepEqual(contacts, [
    { id: "amanda", label: "Amanda Williams", hash, active: true },
  ]);
  assert.deepEqual(parseDeadmanActivators("not-json"), []);
});

test("deadmanReleaseDue allows at most one release per calendar hour", () => {
  const now = new Date("2026-08-26T15:00:00.000Z");
  assert.equal(deadmanReleaseDue(null, now), true);
  assert.equal(
    deadmanReleaseDue("2026-08-26T14:59:59.000Z", now),
    true,
  );
  assert.equal(
    deadmanReleaseDue("2026-08-26T15:00:00.000Z", now),
    false,
  );
});

test("initial bulletin labels advocacy and unresolved facts", () => {
  const bulletin = buildInitialCustodyBulletin({
    confirmedAt: "2026-08-26T15:00:00.000Z",
    confirmationType: "official_booking_record",
    agency: "Example County Sheriff's Office",
    facility: "Example County Jail",
    publicSummary: "An official booking record lists Ryan Nichols in custody.",
    sourceUrl: "https://example.gov/booking/123",
  });
  assert.match(bulletin.body, /official booking or custody record/i);
  assert.match(bulletin.body, /Ryan's position and this site's advocacy view/i);
  assert.match(bulletin.body, /not presented as a judicial finding/i);
  assert.match(bulletin.body, /What remains unknown/i);
  assert.match(bulletin.body, /Harrison County accountability/i);
  assert.match(bulletin.body, /https:\/\/example\.gov\/booking\/123/);
});

test("initial bulletin refuses non-http source schemes", () => {
  const bulletin = buildInitialCustodyBulletin({
    confirmedAt: "2026-08-26T15:00:00.000Z",
    confirmationType: "attorney_or_designated_contact",
    publicSummary: "Counsel directly confirmed custody to an authorized contact.",
    sourceUrl: "javascript:alert(1)",
  });
  assert.doesNotMatch(bulletin.body, /javascript:/i);
  assert.match(bulletin.body, /public source link was not available/i);
});
