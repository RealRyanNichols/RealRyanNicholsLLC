// PostgREST returns at most this many rows per request on this project,
// whatever `.limit()` asks for. Any panel that fetches rows and computes a
// percentage, a "top" list, or an average from them is working from a sample
// that may have hit that cap. Those panels render this strip so the reader
// never mistakes a sample for a total. Counts that use `head: true` with
// `count: "exact"` are not capped and do not need it.
export const POSTGREST_ROW_CAP = 1000;

export type CappedSample = {
  // What the rows are, e.g. "page views" or "events".
  label: string;
  // Rows actually returned.
  rows: number;
  // The ceiling for this sample when the query asked for fewer rows than
  // PostgREST's cap (e.g. `.limit(50)` on invoices).
  cap?: number;
};

export function CappedSampleStrip({
  samples,
  windowLabel,
  cap = POSTGREST_ROW_CAP,
  className = "",
}: {
  samples: CappedSample[];
  windowLabel: string;
  cap?: number;
  className?: string;
}) {
  const capFor = (s: CappedSample) => Math.min(s.cap ?? cap, cap);
  const hit = samples.some((s) => s.rows >= capFor(s));
  return (
    <div
      data-capped-sample
      data-cap-hit={hit ? "true" : "false"}
      role="note"
      className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 px-3 py-2 text-[11px] leading-snug text-[var(--color-amber)] ${className}`}
    >
      <span className="font-black uppercase tracking-wider">Capped sample · {windowLabel}</span>
      {samples.map((s) => (
        <span key={s.label} className="tabular-nums">
          {s.label}: {s.rows.toLocaleString()} of up to {capFor(s).toLocaleString()} rows
          {s.rows >= capFor(s) ? " (cap hit)" : ""}
        </span>
      ))}
      <span className="basis-full">
        {hit
          ? "At least one query hit the row cap, so the percentages, averages, and top lists in this panel are directional, not totals."
          : "Under the row cap, so this window is complete. Totals elsewhere on the page use exact counts."}
      </span>
    </div>
  );
}
