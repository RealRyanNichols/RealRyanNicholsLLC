import type { ReactNode } from "react";

// The one eyebrow every section of the case page uses: 11px, uppercase,
// tracked, gold. Before this there were a dozen hand-copied versions of the
// same three classes across the page; change it here, it changes everywhere.
const EYEBROW_TONE = {
  // The theater kicker: gold on the dark floor.
  navy: "text-[var(--color-gold)]",
  // The blue cards (recognition, attorney briefing) carry blue ink.
  blue: "text-[var(--color-blue-ink)]",
  // On the navy bands: the muted steel the site has always used there.
  cream: "text-[var(--color-muted)]",
} as const;

export function Eyebrow({
  children,
  tone = "navy",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof EYEBROW_TONE;
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] font-bold uppercase tracking-[0.2em] ${EYEBROW_TONE[tone]} ${className}`}
    >
      {children}
    </p>
  );
}

// Same treatment for every chapter: numbered eyebrow, title, one-line
// subtitle. The `id` and `scroll-mt` live on the <section> that wraps this,
// so the chapter nav and the hero's "Read the record" button can land on it.
export function ChapterHeader({
  n,
  label,
  title,
  subtitle,
}: {
  n?: string;
  label: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <header data-reveal>
      <Eyebrow>
        {n ? <>Chapter {n} · </> : null}
        {label}
      </Eyebrow>
      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-ink-soft)]">
        {subtitle}
      </p>
    </header>
  );
}
