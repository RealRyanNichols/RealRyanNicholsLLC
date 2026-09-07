import type { CasePerson } from "@/lib/case";

// The /case hero. One number tells the story: the days from arrest to
// pardon, straight from lib/case.ts. One line under it, one primary button
// into Chapter One, one text link for counsel. Navy surface, gold numerals,
// cream text — and the only flag-red element on the whole page is the
// primary button.
export function CaseHero({
  person,
  days,
  roleLine,
}: {
  person: CasePerson;
  days: number;
  roleLine: string;
}) {
  return (
    <header className="rounded-3xl bg-[var(--color-navy)] p-6 text-[var(--color-paper)] sm:p-9">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--color-gold-bright)]">
            Verified subject · United States v. Nichols
          </p>
          <p className="mt-1 font-display text-2xl font-bold leading-tight tracking-tight text-[var(--color-paper)] sm:text-3xl">
            {person.name}
          </p>
          <p className="mt-1 text-xs font-semibold leading-snug text-[var(--color-paper)]/70 sm:text-sm">
            {roleLine}
          </p>
        </div>
        {person.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photo_url}
            alt={person.name}
            className="h-24 w-24 shrink-0 rounded-2xl border-2 border-[var(--color-gold-bright)] object-cover sm:h-36 sm:w-36"
          />
        ) : null}
      </div>

      {/* The number is the headline. The unit lives inside the h1 so the
          heading reads as a sentence to a screen reader and a search engine. */}
      <h1 className="mt-6 font-display font-black leading-none tracking-tight">
        <span className="block text-6xl tabular-nums text-[var(--color-gold-bright)] sm:text-8xl">
          {days > 0 ? days.toLocaleString("en-US") : "—"}
        </span>
        <span className="mt-3 block font-sans text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-paper)]/75 sm:text-base">
          days from arrest to pardon
        </span>
      </h1>

      <p className="mt-6 max-w-xl font-display text-xl font-bold leading-snug text-[var(--color-paper)] sm:text-2xl">
        Arrested. Detained. Pardoned. Dismissed with prejudice.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <a
          href="#chapter-one"
          className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
        >
          Read the record <span aria-hidden>↓</span>
        </a>
        <a
          href="#attorney-briefing"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--color-gold-bright)] underline-offset-4 hover:underline sm:min-h-0"
        >
          Counsel evaluating this case, start here <span aria-hidden>→</span>
        </a>
      </div>
    </header>
  );
}
