"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

// ─── Wire types straight from case_timeline_data() ────────────────────
type Row = {
  id: string;
  slug: string;
  name: string;
  case_number: string | null;
  arrest_date: string | null;
  plea_date: string | null;
  sentence_date: string | null;
  sentence_summary: string | null;
  disposition: string | null;
  claim_status: string;
  cluster_size: number;
  has_charges: boolean;
};
type HistBin = { y: number; m: number; n: number };
export type TimelinePayload = {
  rows: Row[];
  histograms: { sentencings: HistBin[]; arrests: HistBin[] };
  totals: {
    all_j6: number;
    with_arrest: number;
    with_plea: number;
    with_sentence: number;
  };
};

// Stable months from 2021-01 .. 2026-12 so the histogram has a fixed
// canvas regardless of which months have data.
const TIMELINE_START_Y = 2021;
const TIMELINE_END_Y = 2025;
const ALL_MONTHS: Array<{ y: number; m: number }> = (() => {
  const out: Array<{ y: number; m: number }> = [];
  for (let y = TIMELINE_START_Y; y <= TIMELINE_END_Y; y++) {
    for (let m = 1; m <= 12; m++) out.push({ y, m });
  }
  return out;
})();

// ─── Component ─────────────────────────────────────────────────────────
export function CaseTimeline({ data }: { data: TimelinePayload }) {
  const [activeYear, setActiveYear] = useState<number | "all">("all");
  const [filterCluster, setFilterCluster] = useState<"all" | "co" | "solo">(
    "all",
  );
  const [pivot, setPivot] = useState<"sentence_date" | "arrest_date">(
    "sentence_date",
  );

  // Filter the rows by the active pivot + year + cluster filters.
  const filteredRows = useMemo(() => {
    return data.rows.filter((r) => {
      const dateStr = r[pivot];
      if (!dateStr) return false;
      const d = parseISO(dateStr);
      if (Number.isNaN(d.getTime())) return false;
      if (activeYear !== "all" && d.getFullYear() !== activeYear) return false;
      if (filterCluster === "co" && r.cluster_size <= 1) return false;
      if (filterCluster === "solo" && r.cluster_size > 1) return false;
      return true;
    });
  }, [data.rows, pivot, activeYear, filterCluster]);

  // Group filtered rows by year-month for sticky headers.
  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of filteredRows) {
      const dateStr = r[pivot]!;
      const d = parseISO(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, rows]) => {
        // Sort rows within month by case_number then name
        rows.sort((a, b) =>
          (a.case_number ?? "z").localeCompare(b.case_number ?? "z") ||
          a.name.localeCompare(b.name),
        );
        return { key, rows };
      });
  }, [filteredRows, pivot]);

  // Histogram bin lookup — fold the right pivot's histogram into the
  // fixed month list so empty months render as zero-bars.
  const histByMonth = useMemo(() => {
    const src = pivot === "sentence_date"
      ? data.histograms.sentencings
      : data.histograms.arrests;
    const m = new Map<string, number>();
    for (const b of src) m.set(`${b.y}-${b.m}`, b.n);
    return m;
  }, [pivot, data.histograms]);
  const maxBin = Math.max(1, ...Array.from(histByMonth.values()));

  return (
    <div className="space-y-5">
      {/* ── Pivot + filters ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-1 bg-[#0a1429] rounded-full p-1 border border-[#3a557c]">
          <PivotButton
            active={pivot === "sentence_date"}
            onClick={() => setPivot("sentence_date")}
          >
            Sentencings ({data.totals.with_sentence})
          </PivotButton>
          <PivotButton
            active={pivot === "arrest_date"}
            onClick={() => setPivot("arrest_date")}
          >
            Arrests ({data.totals.with_arrest})
          </PivotButton>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="uppercase tracking-wider text-[#7c8aa6] font-bold">
            Filter
          </span>
          <FilterChip
            active={filterCluster === "all"}
            onClick={() => setFilterCluster("all")}
          >
            All
          </FilterChip>
          <FilterChip
            active={filterCluster === "co"}
            onClick={() => setFilterCluster("co")}
          >
            Co-defendant
          </FilterChip>
          <FilterChip
            active={filterCluster === "solo"}
            onClick={() => setFilterCluster("solo")}
          >
            Solo
          </FilterChip>
        </div>
      </div>

      {/* ── Histogram ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border-2 border-[var(--color-blue)] bg-[#0a1429] p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#7fe3a9] font-bold">
              The prosecution wave
            </p>
            <p className="mt-0.5 text-xs text-[#a9b7d0]">
              {pivot === "sentence_date" ? "Sentencings" : "Arrests"} per month,
              {" "}January {TIMELINE_START_Y} – December {TIMELINE_END_Y}. Click a
              year band to filter.
            </p>
          </div>
          <div className="text-xs font-mono text-[#7c8aa6]">
            showing <span className="text-[#7fe3a9]">{filteredRows.length}</span>{" "}
            of {pivot === "sentence_date" ? data.totals.with_sentence : data.totals.with_arrest}
          </div>
        </div>
        <Histogram
          months={ALL_MONTHS}
          binByMonth={histByMonth}
          maxBin={maxBin}
          activeYear={activeYear}
          onYearClick={(y) => setActiveYear(activeYear === y ? "all" : y)}
        />
      </div>

      {/* ── Chronological list ───────────────────────────────────── */}
      <div className="space-y-6">
        {grouped.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)] italic">
            No entries match this filter.
          </p>
        ) : (
          grouped.map(({ key, rows }) => {
            const [y, m] = key.split("-").map((n) => parseInt(n, 10));
            const monthLabel = format(new Date(y, m - 1, 1), "MMMM yyyy");
            return (
              <section key={key}>
                <header className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-[var(--color-paper)]/95 backdrop-blur-sm border-b border-[var(--color-line)] flex items-baseline justify-between">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight font-display text-[var(--color-ink)]">
                    {monthLabel}
                  </h2>
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-muted)] font-bold">
                    {rows.length} {pivot === "sentence_date" ? "sentenced" : "arrested"}
                  </span>
                </header>
                <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {rows.map((r) => (
                    <TimelineCard key={r.id} row={r} pivot={pivot} />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Histogram (SVG) ──────────────────────────────────────────────────
function Histogram({
  months,
  binByMonth,
  maxBin,
  activeYear,
  onYearClick,
}: {
  months: Array<{ y: number; m: number }>;
  binByMonth: Map<string, number>;
  maxBin: number;
  activeYear: number | "all";
  onYearClick: (y: number) => void;
}) {
  const W = 1000;
  const H = 130;
  const PAD_L = 30;
  const PAD_R = 8;
  const PAD_T = 8;
  const PAD_B = 24;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const barW = innerW / months.length;

  // Year label band positions
  const yearBands: Array<{ y: number; x0: number; x1: number }> = [];
  for (let i = 0; i < months.length; ) {
    const y = months[i].y;
    let j = i;
    while (j < months.length && months[j].y === y) j++;
    yearBands.push({
      y,
      x0: PAD_L + i * barW,
      x1: PAD_L + j * barW,
    });
    i = j;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full h-auto"
      role="img"
      aria-label="Monthly histogram"
    >
      {/* Y-axis ticks */}
      {[0, 0.5, 1].map((p) => {
        const y = PAD_T + innerH * (1 - p);
        const v = Math.round(maxBin * p);
        return (
          <g key={p}>
            <line
              x1={PAD_L}
              y1={y}
              x2={W - PAD_R}
              y2={y}
              stroke="#1f2f55"
              strokeWidth={0.5}
            />
            <text
              x={PAD_L - 4}
              y={y + 3}
              textAnchor="end"
              fontSize="8"
              fontFamily="ui-monospace, monospace"
              fill="#7c8aa6"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {months.map((mn, i) => {
        const key = `${mn.y}-${mn.m}`;
        const v = binByMonth.get(key) ?? 0;
        const h = v === 0 ? 0 : Math.max(1, (v / maxBin) * innerH);
        const x = PAD_L + i * barW;
        const y = PAD_T + innerH - h;
        const isActiveYear = activeYear === "all" || activeYear === mn.y;
        return (
          <g key={key}>
            <rect
              x={x + 0.5}
              y={y}
              width={Math.max(0.5, barW - 1)}
              height={h}
              fill={isActiveYear ? "#7fe3a9" : "#3a557c"}
              fillOpacity={isActiveYear ? 0.85 : 0.4}
            >
              <title>
                {format(new Date(mn.y, mn.m - 1, 1), "MMM yyyy")}: {v}
              </title>
            </rect>
          </g>
        );
      })}

      {/* Year band labels + click targets */}
      {yearBands.map((band) => (
        <g
          key={band.y}
          onClick={() => onYearClick(band.y)}
          style={{ cursor: "pointer" }}
        >
          <rect
            x={band.x0}
            y={H - PAD_B}
            width={band.x1 - band.x0}
            height={PAD_B}
            fill="transparent"
          />
          <text
            x={(band.x0 + band.x1) / 2}
            y={H - 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fontFamily="ui-monospace, monospace"
            fill={
              activeYear === "all" || activeYear === band.y
                ? "#cfd9ea"
                : "#5a7aa6"
            }
          >
            {band.y}
          </text>
          {activeYear === band.y ? (
            <line
              x1={band.x0}
              y1={H - PAD_B + 1}
              x2={band.x1}
              y2={H - PAD_B + 1}
              stroke="#7fe3a9"
              strokeWidth={2}
            />
          ) : null}
        </g>
      ))}
    </svg>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────
function TimelineCard({
  row,
  pivot,
}: {
  row: Row;
  pivot: "sentence_date" | "arrest_date";
}) {
  const dateStr = row[pivot];
  const d = dateStr ? parseISO(dateStr) : null;
  const verb = pivot === "sentence_date" ? "Sentenced" : "Arrested";
  return (
    <li className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3.5 hover:border-[var(--color-blue)] transition">
      <div className="flex items-baseline justify-between gap-3">
        <Link
          href={`/case/people/${row.slug}`}
          className="text-base font-bold text-[var(--color-ink)] hover:text-[var(--color-accent)] truncate"
        >
          {row.name}
        </Link>
        {d ? (
          <span className="text-[11px] font-mono text-[var(--color-muted)] whitespace-nowrap">
            {format(d, "MMM d")}
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-[11px] font-mono text-[var(--color-muted)]">
        {verb}
        {row.case_number ? ` · case ${row.case_number}` : ""}
        {row.cluster_size > 1
          ? ` · co-defendant of ${row.cluster_size - 1} other${row.cluster_size - 1 === 1 ? "" : "s"}`
          : ""}
      </p>
      {pivot === "sentence_date" && row.sentence_summary ? (
        <p className="mt-2 text-xs text-[var(--color-ink-soft)] leading-snug line-clamp-3">
          {row.sentence_summary}
        </p>
      ) : null}
      {row.claim_status === "verified" ? (
        <p className="mt-2 text-[10px] uppercase tracking-wider font-bold text-[#3aa672]">
          ★ Claimed by defendant
        </p>
      ) : null}
    </li>
  );
}

function PivotButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
        active
          ? "bg-[#7fe3a9] text-[#0a1429]"
          : "text-[#cfd9ea] hover:bg-[#1c2a4a]"
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold border transition ${
        active
          ? "border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-blue)]"
      }`}
    >
      {children}
    </button>
  );
}
