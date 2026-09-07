import { ClaimChip } from "@/components/case/ClaimChip";
import type { ClaimLabel } from "@/lib/officials";

// Maps a free-form document type (case_documents.doc_type) onto the archive's
// one classification vocabulary. Only two kinds carry a claim of their own:
// a record that is Ryan's own account, and a tip nobody has verified yet.
// Everything else (court filings, grievances, video, timeline entries) is
// already named by the doc_type pill beside this badge, so it renders
// nothing rather than a second, differently colored label for the same
// thing. Renders nothing for an unknown/missing kind, so it never breaks
// existing UI.

// The alias order is the archive's existing precedence: a type that reads
// as a court filing, a grievance, or a witness statement is never relabeled
// as Ryan's own account just because his name is in it.
const SILENT_KINDS = new Set([
  "court-filing",
  "grievance",
  "eyewitness",
  "corroborated",
  "opinion",
  "media",
  "timeline",
]);

function resolve(kind: string): ClaimLabel | null {
  const k = kind.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (k === "ryan-statement") return "RYAN STATEMENT";
  if (k === "unverified-tip") return "NEEDS AUTHENTICATION";
  if (SILENT_KINDS.has(k)) return null;
  if (/(court|filing|motion|order|brief|docket|indictment|complaint)/.test(k)) return null;
  if (/(grievance|complaint-filed)/.test(k)) return null;
  if (/(eyewitness|witness|statement-of)/.test(k)) return null;
  if (/(ryan|defendant|my-statement|declaration)/.test(k)) return "RYAN STATEMENT";
  if (/(corroborat|verified|confirmed)/.test(k)) return null;
  if (/(tip|unverified|lead|needs-auth)/.test(k)) return "NEEDS AUTHENTICATION";
  return null;
}

export function EvidenceBadge({
  kind,
  className = "",
}: {
  kind?: string | null;
  className?: string;
}) {
  if (!kind) return null;
  const label = resolve(kind);
  if (!label) return null;
  return <ClaimChip label={label} className={className} />;
}
