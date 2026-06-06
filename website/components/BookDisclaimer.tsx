// Small, professional trust/legal note used across the book pages.
export function BookDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm leading-relaxed text-[var(--color-ink-soft)] sm:p-5 ${className}`}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
        A note on the record
      </p>
      <p className="mt-2">
        <strong className="text-[var(--color-ink)]">Fighting Shadows</strong> is
        a first-person memoir and documented account. Some events are based on
        personal recollection; others draw on records, filings, transcripts,
        grievances, and supporting materials, which are referenced where
        available. Pre-order terms, the refund policy, and delivery updates are
        posted clearly as they are set.
      </p>
    </div>
  );
}
