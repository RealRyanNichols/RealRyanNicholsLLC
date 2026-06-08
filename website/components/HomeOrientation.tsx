import Link from "next/link";

// Above-the-feed orientation for cold visitors: what the site is for, the two
// primary CTAs, and four "which one are you?" doors. Keeps the feed below.
const AUDIENCES = [
  {
    href: "/support",
    label: "Supporter",
    desc: "Keep the record public and the fight funded.",
  },
  {
    href: "/case",
    label: "Journalist / Researcher",
    desc: "The documented record — filings, records, and video.",
  },
  {
    href: "/j6",
    label: "J6 Defendant / Source",
    desc: "Get on the record, or get free help with your claim.",
  },
  {
    href: "/services",
    label: "Client / Website Customer",
    desc: "Want a site like this, or paperwork help? Hire Ryan.",
  },
];

export function HomeOrientation() {
  return (
    <section className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
        What this site is for
      </p>
      <h2 className="mt-1.5 font-display text-xl font-black leading-snug tracking-tight text-[var(--color-ink)] sm:text-2xl">
        One pardoned J6 defendant&apos;s public record — the documents, the fight
        back home, and a place for others to tell theirs.
      </h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/start-here"
          className="btn-accent rounded-full px-5 py-2.5 text-sm font-bold"
        >
          Start Here
        </Link>
        <Link
          href="/support"
          className="btn-support rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          Support the Work
        </Link>
      </div>
      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
          Which one are you?
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3.5 transition hover:border-[var(--color-accent)]"
            >
              <p className="text-sm font-bold text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]">
                {a.label} →
              </p>
              <p className="mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">
                {a.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
