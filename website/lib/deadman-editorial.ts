export const DEADMAN_EDITORIAL_MODE = "evidence_led_accountability_v3";

export const DEADMAN_REQUIRED_HEADINGS = [
  "Verified facts",
  "Official account and allegations",
  "Evidence, contradictions, and unanswered questions",
  "Accountability notice",
  "Advocacy position",
  "How to help lawfully",
] as const;

export type DeadmanEvidenceStrength =
  | "primary_record"
  | "corroborated"
  | "direct_confirmation"
  | "single_public_source"
  | "no_new_information";

export type DeadmanClaim = {
  id: string;
  claim: string;
  source_ids?: string[];
  attributed_to?: string;
  basis_claim_ids?: string[];
};

export type DeadmanClaimLabels = {
  verified_facts: DeadmanClaim[];
  attributed_allegations: DeadmanClaim[];
  editorial_inferences: DeadmanClaim[];
  advocacy_positions: DeadmanClaim[];
  unresolved_questions: DeadmanClaim[];
};

export type DeadmanPublicSource = {
  id: string;
  type: string;
  url?: string;
  note?: string;
};

export type DeadmanAccountabilityDraft = {
  title: string;
  body: string;
  evidenceStrength: DeadmanEvidenceStrength;
  sources: DeadmanPublicSource[];
  claimLabels: DeadmanClaimLabels;
  accountabilityTargets: string[];
};

export type DeadmanEditorialValidation = {
  ok: boolean;
  errors: string[];
};

const TARGETING_PATTERNS = [
  /\b(?:home|private) address\b/i,
  /\b(?:target|contact|confront) (?:their|his|her) (?:children|family)\b/i,
  /\b(?:hurt|attack|threaten|violence against)\b/i,
  /\b(?:sealed|private) (?:family|child|children|medical) (?:record|records|matter|information)\b/i,
] as const;

function validClaimId(value: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{2,79}$/i.test(value);
}

function validateClaims(
  label: keyof DeadmanClaimLabels,
  claims: DeadmanClaim[],
  sourceIds: Set<string>,
  allClaimIds: Set<string>,
  errors: string[],
) {
  for (const claim of claims) {
    if (!validClaimId(claim.id) || claim.claim.trim().length < 8) {
      errors.push(`${label} contains an invalid claim id or empty claim.`);
      continue;
    }

    if (
      label === "verified_facts" &&
      /\b(?:this site|we) (?:call|calls|demand|demands)|\bshould (?:release|resign)|\bmust release\b/i.test(
        claim.claim,
      )
    ) {
      errors.push(`${claim.id} is advocacy and cannot be labeled as a verified fact.`);
    }

    if (label === "verified_facts" || label === "attributed_allegations") {
      if (!claim.source_ids?.length) {
        errors.push(`${claim.id} must cite at least one source id.`);
      } else if (claim.source_ids.some((id) => !sourceIds.has(id))) {
        errors.push(`${claim.id} cites a source id that is not in the source manifest.`);
      }
    }

    if (label === "attributed_allegations" && !claim.attributed_to?.trim()) {
      errors.push(`${claim.id} must identify who made the allegation.`);
    }

    if (label === "editorial_inferences") {
      if (!claim.basis_claim_ids?.length) {
        errors.push(`${claim.id} must identify the facts supporting the inference.`);
      } else if (claim.basis_claim_ids.some((id) => !allClaimIds.has(id))) {
        errors.push(`${claim.id} relies on an unknown basis claim.`);
      }
    }
  }
}

/**
 * Validates the emergency editorial contract before a release record reaches
 * Supabase. The database repeats the structural checks so no alternate worker
 * can bypass them.
 */
export function validateDeadmanAccountabilityDraft(
  draft: DeadmanAccountabilityDraft,
): DeadmanEditorialValidation {
  const errors: string[] = [];
  if (draft.title.trim().length < 8 || draft.title.trim().length > 200) {
    errors.push("Title must be 8 to 200 characters.");
  }
  if (draft.body.trim().length < 200 || draft.body.length > 50_000) {
    errors.push("Body must be 200 to 50,000 characters.");
  }
  for (const heading of DEADMAN_REQUIRED_HEADINGS) {
    if (!draft.body.includes(`## ${heading}`)) {
      errors.push(`Missing required section: ${heading}.`);
    }
  }
  for (const pattern of TARGETING_PATTERNS) {
    if (pattern.test(draft.body)) {
      errors.push("Body contains prohibited private-person targeting or sensitive material.");
      break;
    }
  }
  if (draft.accountabilityTargets.length === 0) {
    errors.push("At least one public institution or sourced public-role target is required.");
  }

  const sourceIds = new Set<string>();
  for (const source of draft.sources) {
    if (!validClaimId(source.id) || source.type.trim().length < 3) {
      errors.push("Every source must have a stable id and source type.");
      continue;
    }
    if (!source.url?.trim() && !source.note?.trim()) {
      errors.push(`${source.id} must include a public URL or a verification note.`);
    }
    if (source.url) {
      try {
        const parsed = new URL(source.url);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          errors.push(`${source.id} uses an unsupported URL scheme.`);
        }
      } catch {
        errors.push(`${source.id} contains an invalid URL.`);
      }
    }
    sourceIds.add(source.id);
  }
  if (sourceIds.size === 0) errors.push("At least one source record is required.");

  const allClaims = Object.values(draft.claimLabels).flat();
  const allClaimIds = new Set(allClaims.map((claim) => claim.id));
  if (allClaimIds.size !== allClaims.length) {
    errors.push("Claim ids must be unique across every claim class.");
  }
  for (const label of Object.keys(draft.claimLabels) as Array<keyof DeadmanClaimLabels>) {
    const factualBasisIds = new Set([
      ...draft.claimLabels.verified_facts.map((claim) => claim.id),
      ...draft.claimLabels.attributed_allegations.map((claim) => claim.id),
    ]);
    validateClaims(label, draft.claimLabels[label], sourceIds, factualBasisIds, errors);
  }
  if (draft.claimLabels.verified_facts.length === 0) {
    errors.push("At least one source-linked verified fact is required.");
  }

  return { ok: errors.length === 0, errors };
}

export const EVIDENCE_NETWORK_RESEARCH_NOTICE =
  "Every named matter may be investigated internally. No misconduct, coordination, or cross-incident conclusion is publishable unless reviewed sources establish the people, events, public relevance, and claimed connection, and the legal and privacy gates are open.";

/** @deprecated Use the evidence-network notice for all private research leads. */
export const EAST_MOUNTAIN_RESEARCH_NOTICE = EVIDENCE_NETWORK_RESEARCH_NOTICE;
