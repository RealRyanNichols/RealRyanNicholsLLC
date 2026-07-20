import Link from "next/link";

// The front door of /case. Two ways in, decided in one glance: this man's
// file, or everyone else's. It exists because "Case" was doing two jobs at
// once — the anchor case AND a 1,571-defendant archive — and a visitor had to
// read a paragraph to work out which one they'd landed on.
export function J6PathSplit({
  daysDetained,
  defendants,
}: {
  daysDetained: number;
  defendants: number;
}) {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-10">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--color-accent)]">
        The January 6 Files
      </p>
      <h1 className="mt-2 font-display text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
        Where do you
        <br />
        want to start?
      </h1>
      <p className="mt-3 text-base font-semibold text-[var(--color-ink-soft)]">
        Two ways in. Both free, both public.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <a
          href="#the-case"
          className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-[#0b1428] p-6 text-white transition hover:shadow-xl sm:p-7"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
              One man&rsquo;s case
            </p>
            <p className="mt-3 font-display text-5xl font-black leading-none tracking-tight">
              {daysDetained.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/55">
              days detained
            </p>
            <p className="mt-4 text-sm leading-snug text-white/75">
              Arrest to pardon. The filings, the grievances, the ten facilities
              &mdash; and the judge who said it out loud.
            </p>
          </div>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-black text-[var(--color-accent)]">
            Read Ryan&rsquo;s case
            <span aria-hidden className="transition group-hover:translate-x-1">
              &darr;
            </span>
          </span>
        </a>

        <Link
          href="/case?view=people"
          className="group flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-[var(--color-navy)]/25 bg-[var(--color-blue-soft)]/50 p-6 transition hover:border-[var(--color-navy)] hover:shadow-xl sm:p-7"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-navy)]">
              Everyone else
            </p>
            <p className="mt-3 font-display text-5xl font-black leading-none tracking-tight text-[var(--color-ink)]">
              {defendants.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              defendants indexed
            </p>
            <p className="mt-4 text-sm leading-snug text-[var(--color-ink-soft)]">
              Search every January 6 case on file. Find a name, claim a profile,
              or read the whole record.
            </p>
          </div>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-black text-[var(--color-navy)]">
            Search the archive
            <span aria-hidden className="transition group-hover:translate-x-1">
              &rarr;
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
