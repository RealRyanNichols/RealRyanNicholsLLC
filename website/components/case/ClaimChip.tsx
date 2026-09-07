import type { ClaimLabel } from "@/lib/officials";

// The one evidence-classification chip for the case files. FACT / RECORD /
// RYAN STATEMENT / DOCUMENTED INFERENCE / NEEDS AUTHENTICATION are the
// labels the archive publishes under (lib/officials.ts). Every chip on
// /case — the detention chapter, the official dossiers — renders through
// this component with token colors, so one label always looks one way.

// Ink color per label, for callers that draw a rule or a border in the
// label's color (the dossier's claim cards).
export const CLAIM_INK: Record<ClaimLabel, string> = {
  FACT: "var(--color-navy)",
  RECORD: "var(--color-blue)",
  "RYAN STATEMENT": "var(--color-navy)",
  "DOCUMENTED INFERENCE": "var(--color-support-strong)",
  "NEEDS AUTHENTICATION": "var(--color-muted)",
};

// Filled navy = documented fact; outlined navy = his own account; blue =
// stated on the court record; gold = inference from disclosed facts; muted
// = real and load-bearing, not yet verified.
const CHIP: Record<ClaimLabel, string> = {
  FACT: "border-[var(--color-navy)] bg-[var(--color-navy)] text-[var(--color-paper)]",
  RECORD: "border-[var(--color-blue)] bg-[var(--color-blue-soft)] text-[var(--color-blue)]",
  "RYAN STATEMENT": "border-[var(--color-navy)] bg-transparent text-[var(--color-navy)]",
  "DOCUMENTED INFERENCE":
    "border-[var(--color-support-strong)] bg-[var(--color-support-soft)] text-[var(--color-support-strong)]",
  "NEEDS AUTHENTICATION":
    "border-[var(--color-muted)] bg-[var(--color-surface-2)] text-[var(--color-muted)]",
};

export function ClaimChip({
  label,
  className = "",
}: {
  label: ClaimLabel;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${CHIP[label]} ${className}`}
    >
      {label}
    </span>
  );
}
