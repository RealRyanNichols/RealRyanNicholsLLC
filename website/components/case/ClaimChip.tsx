import type { ClaimLabel } from "@/lib/officials";

// The one evidence-classification chip for the case files. FACT / RECORD /
// DOCUMENTED / RYAN STATEMENT / DOCUMENTED INFERENCE / NEEDS AUTHENTICATION
// are the labels the archive publishes under (lib/officials.ts). Every chip
// on /case — the detention chapter, the official dossiers — renders through
// this component with token colors, so one label always looks one way.

// Ink color per label, for callers that draw a rule or a border in the
// label's color (the dossier's claim cards).
// Each label gets its own ink so a fact card and a statement card still
// read differently at the rule, not just at the chip.
export const CLAIM_INK: Record<ClaimLabel, string> = {
  FACT: "var(--color-gold)",
  RECORD: "var(--color-blue)",
  DOCUMENTED: "var(--color-blue-ink)",
  "RYAN STATEMENT": "var(--color-line-soft)",
  "DOCUMENTED INFERENCE": "var(--color-tag-procedural)",
  "NEEDS AUTHENTICATION": "var(--color-muted)",
};

// One solid chip in the room: FACT, gold with navy type. Everything else is a
// hairline chip in its own tint on the dark floor, so the eye reads "proven"
// in one glance and everything else as a qualified claim: blue for what was
// said on the court record or preserved in a named exhibit, cream for his own
// account, procedural amber for an inference drawn from disclosed facts, muted
// for real and load-bearing but not yet verified.
const CHIP: Record<ClaimLabel, string> = {
  FACT: "border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-navy)]",
  RECORD: "border-[var(--color-blue)] bg-[var(--color-blue-soft)] text-[var(--color-blue-ink)]",
  DOCUMENTED: "border-[var(--color-blue)] bg-[var(--color-blue-soft)] text-[var(--color-blue-ink)]",
  "RYAN STATEMENT": "border-[var(--color-line-soft)] bg-transparent text-[var(--color-ink)]",
  "DOCUMENTED INFERENCE":
    "border-[var(--color-tag-procedural)] bg-[var(--color-support-soft)] text-[var(--color-tag-procedural)]",
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
