import assert from "node:assert/strict";
import test from "node:test";
import {
  EVIDENCE_NETWORK_RESEARCH_NOTICE,
  DEADMAN_REQUIRED_HEADINGS,
  validateDeadmanAccountabilityDraft,
  type DeadmanAccountabilityDraft,
} from "../lib/deadman-editorial";

function validDraft(): DeadmanAccountabilityDraft {
  const sections = DEADMAN_REQUIRED_HEADINGS.map(
    (heading) => `## ${heading}\n\nThis section states the record carefully and directly.`,
  ).join("\n\n");
  return {
    title: "Harrison County must disclose the basis for Ryan Nichols's detention",
    body: `${sections}\n\n${"Source-backed accountability. ".repeat(10)}`,
    evidenceStrength: "primary_record",
    accountabilityTargets: ["Harrison County public agencies"],
    sources: [
      {
        id: "source-booking",
        type: "official_booking_record",
        url: "https://example.gov/booking/123",
      },
    ],
    claimLabels: {
      verified_facts: [
        {
          id: "fact-custody",
          claim: "The official booking record lists Ryan Nichols in custody.",
          source_ids: ["source-booking"],
        },
      ],
      attributed_allegations: [],
      editorial_inferences: [],
      advocacy_positions: [
        {
          id: "advocacy-release",
          claim: "Release Ryan if no lawful and documented basis is produced.",
        },
      ],
      unresolved_questions: [],
    },
  };
}

test("evidence-led accountability draft accepts strong conditional advocacy", () => {
  const result = validateDeadmanAccountabilityDraft(validDraft());
  assert.deepEqual(result, { ok: true, errors: [] });
});

test("verified facts fail without a linked source", () => {
  const draft = validDraft();
  delete draft.claimLabels.verified_facts[0].source_ids;
  const result = validateDeadmanAccountabilityDraft(draft);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /must cite at least one source id/i);
});

test("advocacy cannot be mislabeled as a verified fact", () => {
  const draft = validDraft();
  draft.claimLabels.verified_facts[0].claim =
    "This site demands that Harrison County must release Ryan immediately.";
  const result = validateDeadmanAccountabilityDraft(draft);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /advocacy and cannot be labeled as a verified fact/i);
});

test("allegations fail without attribution and inferences fail without a factual basis", () => {
  const draft = validDraft();
  draft.claimLabels.attributed_allegations.push({
    id: "allegation-one",
    claim: "An office allegedly withheld information from Ryan.",
    source_ids: ["source-booking"],
  });
  draft.claimLabels.editorial_inferences.push({
    id: "inference-one",
    claim: "The timing may indicate an unresolved procedural irregularity.",
  });
  const result = validateDeadmanAccountabilityDraft(draft);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /identify who made the allegation/i);
  assert.match(result.errors.join(" "), /facts supporting the inference/i);
});

test("private-person targeting and sensitive details are rejected", () => {
  const draft = validDraft();
  draft.body += "\nContact their children and publish the home address.";
  const result = validateDeadmanAccountabilityDraft(draft);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /prohibited private-person targeting/i);
});

test("the research notice permits broad investigation without asserting a connection", () => {
  assert.match(EVIDENCE_NETWORK_RESEARCH_NOTICE, /every named matter may be investigated/i);
  assert.match(EVIDENCE_NETWORK_RESEARCH_NOTICE, /no misconduct, coordination, or cross-incident conclusion is publishable/i);
  assert.match(EVIDENCE_NETWORK_RESEARCH_NOTICE, /reviewed sources establish/i);
});
