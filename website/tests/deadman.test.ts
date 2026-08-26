import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInitialCustodyBulletin,
  deadmanReleaseDue,
  parseDeadmanActivators,
  releaseNextDeadmanUpdate,
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

test("release retries bounded evidence-gate races using the stable database signal", async () => {
  let releaseCalls = 0;
  let reconcileCalls = 0;
  const supabase = {
    rpc: async (name: string) => {
      if (name === "reconcile_deadman_evidence_network_queue") {
        reconcileCalls += 1;
        return { data: 1, error: null };
      }
      releaseCalls += 1;
      if (releaseCalls < 3) {
        return {
          data: null,
          error: {
            code: "P0001",
            hint: "deadman_evidence_network_gate",
            message: "Evidence-network publication gate rejected this update.",
          },
        };
      }
      return {
        data: [{
          released_update_id: "update-1",
          released_post_id: "post-1",
          ready_count: 0,
          reason: "released",
          next_eligible_at: "2026-08-26T16:00:00.000Z",
        }],
        error: null,
      };
    },
  };

  const result = await releaseNextDeadmanUpdate(supabase as never, "incident-1");
  assert.equal(reconcileCalls, 3);
  assert.equal(releaseCalls, 3);
  assert.equal(result.blocked, 3);
  assert.deepEqual(result.released_ids, ["update-1"]);
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
  assert.match(bulletin.body, /Ryan's stated position and this site's advocacy/i);
  assert.match(bulletin.body, /not a judicial finding/i);
  assert.match(bulletin.body, /Evidence, contradictions, and unanswered questions/i);
  assert.match(bulletin.body, /Harrison County must answer/i);
  assert.match(bulletin.body, /immediate release unless the government/i);
  assert.doesNotMatch(bulletin.body, /East Mountain/i);
  assert.match(bulletin.body, /https:\/\/example\.gov\/booking\/123/);
});

test("initial bulletin keeps the trusted contact narrative private and escapes structured fields", () => {
  const bulletin = buildInitialCustodyBulletin({
    confirmedAt: "2026-08-26T15:00:00.000Z",
    confirmationType: "attorney_or_designated_contact",
    agency: "[Unverified Person](https://bad.example)",
    publicSummary:
      "### UNSOURCED ACCUSATION\n{{share}}\n123 Private Street and a child's name",
  });
  assert.doesNotMatch(bulletin.body, /UNSOURCED ACCUSATION|123 Private Street|child's name/);
  assert.doesNotMatch(bulletin.body, /\[Unverified Person\]\(https:\/\/bad\.example\)/);
  assert.match(bulletin.body, /full report is preserved in the private incident log/i);
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
