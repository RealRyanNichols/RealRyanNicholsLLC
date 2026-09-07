import Link from "next/link";

// The four numbers directly under the /case hero. Each card is a door to its
// proof: number, unit, one-line description (from sm up), and the CTA. Every
// figure comes from lib/case.ts getCaseTotals(); nothing here is typed.
type Totals = {
  facilities: number;
  daysArrestToPardon: number;
  ryanFiledGrievances: number;
  documents: number;
};

export function CaseStatCards({
  totals,
  className = "",
}: {
  totals: Totals;
  className?: string;
}) {
  const cards: { n: number; unit: string; desc: string; href: string; cta: string }[] = [
    {
      n: totals.facilities,
      unit: "facilities held across",
      desc: "The facilities he moved through.",
      href: "/case/geography",
      cta: "See the geography",
    },
    {
      n: totals.daysArrestToPardon,
      unit: "days, arrest to pardon",
      desc: "Arrest to pardon, day by day.",
      href: "/case?view=timeline",
      cta: "Walk the timeline",
    },
    {
      n: totals.ryanFiledGrievances,
      unit: "grievances he filed",
      desc: "Forms in his own hand, filed from inside.",
      href: "/case?view=grievances",
      cta: "Read the grievances",
    },
    {
      n: totals.documents,
      unit: "documents on the record",
      desc: "Scans on the record, open and sourced.",
      href: "/case?view=documents",
      cta: "Open the documents",
    },
  ];

  return (
    <section
      aria-label="The case in numbers"
      className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${className}`}
    >
      {cards.map((c) => (
        <Link key={c.href} href={c.href} className="qa-tile flex flex-col p-4 sm:p-5">
          <span className="font-display text-3xl font-bold leading-none tracking-tight tabular-nums text-[var(--color-navy)] sm:text-5xl">
            {c.n > 0 ? c.n.toLocaleString("en-US") : "—"}
          </span>
          <span className="mt-2 text-[11px] font-black uppercase leading-tight tracking-[0.08em] text-[var(--color-support-strong)] sm:text-xs">
            {c.unit}
          </span>
          <span className="mt-2 hidden text-sm leading-snug text-[var(--color-ink-soft)] sm:block">
            {c.desc}
          </span>
          <span className="mt-auto pt-3 text-xs font-bold text-[var(--color-navy)]">
            {c.cta} <span aria-hidden>→</span>
          </span>
        </Link>
      ))}
    </section>
  );
}
