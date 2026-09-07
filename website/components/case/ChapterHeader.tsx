import type { ReactNode } from "react";

// The one eyebrow every section of the case page uses: 11px, uppercase,
// tracked, navy. Before this there were a dozen hand-copied versions of the
// same three classes across the page; change it here, it changes everywhere.
export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-navy)] ${className}`}
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
    <header>
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
