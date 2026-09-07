import type { ClaimLabel } from "@/lib/officials";

// The one evidence-classification chip for the case files. FACT / RECORD /
// RYAN STATEMENT / DOCUMENTED INFERENCE / NEEDS AUTHENTICATION are the
// labels the archive publishes under (lib/officials.ts). Every chip on
// /case — the detention chapter, the official dossiers — renders through
// this component with token colors, so one label always looks one way.

// Ink color per label, for callers that draw a rule or a border in the
// label's color (the dossier's claim cards).
// Each label gets its own ink so a fact card and a statement card still
// read differently at the rule, not just at the chip.
export const CLAIM_INK: Record<ClaimLabel, string> = {
  FACT: "var(--color-navy)",
  RECORD: "var(--color-blue)",
  "RYAN STATEMENT": "var(--color-ink-soft)",
  "DOCUMENTED INFERENCE": "var(--color-support-strong)",
  "NEEDS AUTHENTICATION": "var(--color-muted)",
};

// Filled navy = documented fact; outlined navy = his own account; blue =
// stated on the court record; gold = inference from disclosed facts; muted
// = real and load-bearing, not yet verified. The gold and muted chips keep
// their border and fill for identity but set their text in ink-soft: at
// 10–11px the lighter inks fall under 4.5:1 on their own tints.
const CHIP: Record<ClaimLabel, string> = {
  FACT: "border-[var(--color-navy)] bg-[var(--color-navy)] text-[var(--color-paper)]",
  RECORD: "border-[var(--color-blue)] bg-[var(--color-blue-soft)] text-[var(--color-blue)]",
  "RYAN STATEMENT": "border-[var(--color-navy)] bg-transparent text-[var(--color-navy)]",
  "DOCUMENTED INFERENCE":
    "border-[var(--color-support-strong)] bg-[var(--color-support-soft)] text-[var(--color-ink-soft)]",
  "NEEDS AUTHENTICATION":
    "border-[var(--color-muted)] bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]",
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
