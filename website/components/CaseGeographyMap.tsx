"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { geoPath, geoIdentity } from "d3-geo";
import { feature } from "topojson-client";
import statesAlbersJson from "us-atlas/states-albers-10m.json";
import type { Topology, GeometryCollection } from "topojson-specification";
import type {
  Feature,
  GeometryObject,
  FeatureCollection,
} from "geojson";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PALETTE } from "@/lib/palette";

// ─── Wire types from case_geo_aggregate / case_geo_state ─────────────
type StateRow = {
  name: string;
  defendants: number;
  sentenced: number;
  verified: number;
};
export type GeoPayload = {
  states: StateRow[];
  totals: {
    with_location: number;
    distinct_states: number;
    all_j6: number;
  };
};
type StateDrawerRow = {
  id: string;
  slug: string;
  name: string;
  case_number: string | null;
  city: string | null;
  claim_status: string;
  sentence_summary: string | null;
  arrest_date: string | null;
  sentence_date: string | null;
};
type StateDrawer = {
  state: string;
  rows: StateDrawerRow[];
  count: number;
};

// ─── Pre-projected geometry: us-atlas/states-albers-10m is already in
// Albers USA coordinates with viewBox 975×610, so we just consume it. ─
const W = 975;
const H = 610;
const topo = statesAlbersJson as unknown as Topology<{
  states: GeometryCollection<{ name: string }>;
}>;
const statesFC = feature(topo, topo.objects.states) as FeatureCollection<
  GeometryObject,
  { name: string }
>;
// geoIdentity = "the geometry is already projected, pass through" — that's
// what us-atlas/states-albers gives us.
const PATH_GEN = geoPath(geoIdentity());

// ─── Choropleth color ramp (terminal-greens to keep it on-brand) ─────
// The ramp is mixed numerically, so it cannot read a CSS variable: both
// endpoints come from PALETTE, which mirrors styles/tokens.css. A state
// with nobody on the record keeps the panel's own navy.
const RAMP_LOW = rgbOf(PALETTE.greenDeep);
const RAMP_HIGH = rgbOf(PALETTE.live);

function rgbOf(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function colorFor(count: number, maxCount: number): string {
  if (count === 0) return "var(--color-surface-2)";
  // Map 1..maxCount to t in [0,1] using a sqrt so the smaller states
  // still get visible color, otherwise the FL/TX dominate.
  const t = Math.sqrt(count / Math.max(1, maxCount));
  const r = Math.round(RAMP_LOW[0] + (RAMP_HIGH[0] - RAMP_LOW[0]) * t);
  const g = Math.round(RAMP_LOW[1] + (RAMP_HIGH[1] - RAMP_LOW[1]) * t);
  const b = Math.round(RAMP_LOW[2] + (RAMP_HIGH[2] - RAMP_LOW[2]) * t);
  return `rgb(${r},${g},${b})`;
}

// ─── Component ─────────────────────────────────────────────────────────
export function CaseGeographyMap({ data }: { data: GeoPayload }) {
  const countByState = useMemo(() => {
    const m = new Map<string, StateRow>();
    for (const s of data.states) m.set(s.name.toLowerCase(), s);
    return m;
  }, [data.states]);
  const maxCount = useMemo(
    () => data.states.reduce((mx, s) => Math.max(mx, s.defendants), 1),
    [data.states],
  );

  const [hover, setHover] = useState<{
    name: string;
    row: StateRow | null;
    x: number;
    y: number;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<StateDrawer | null>(null);
  const [loadingDrawer, setLoadingDrawer] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  // The 56 state outlines are ~210KB of path data. Draw them only after
  // hydration so the HTML carries the headline, the table, and the frame,
  // never the geometry (same rule as the Map Room radar).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function openState(stateName: string) {
    setSelected(stateName);
    setDrawer(null);
    setLoadingDrawer(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.rpc("case_geo_state", {
        p_state: stateName,
      });
      if (data) setDrawer(data as StateDrawer);
    } finally {
      setLoadingDrawer(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <svg
          ref={svgRef}
          data-geo-map
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full h-auto select-none"
          role="img"
          aria-label="Choropleth map of January 6 defendant counts by state. Click a state to see its defendant list."
        >
          {/* States — client-only, see `mounted`. */}
          {mounted && statesFC.features.map((f) => {
            const nm = f.properties?.name ?? "";
            const row = countByState.get(nm.toLowerCase()) ?? null;
            const ct = row?.defendants ?? 0;
            const fill = colorFor(ct, maxCount);
            const isSelected = selected === nm;
            const d = PATH_GEN(f as Feature<GeometryObject>) ?? "";
            return (
              <path
                key={nm}
                d={d}
                fill={fill}
                stroke={isSelected ? "var(--color-cream)" : "var(--color-paper)"}
                strokeWidth={isSelected ? 1.5 : 0.5}
                onMouseEnter={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setHover({
                    name: nm,
                    row,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseMove={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setHover({
                    name: nm,
                    row,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => {
                  if (ct > 0) void openState(nm);
                }}
                style={{ cursor: ct > 0 ? "pointer" : "default" }}
              >
                {/* One string child: React hydrates a multi-child <title>
                    as separate text nodes and the browser's parser merges
                    them, which is a deterministic hydration mismatch. */}
                <title>{`${nm}: ${ct} defendant${ct === 1 ? "" : "s"}`}</title>
              </path>
            );
          })}
        </svg>

        {/* Top-left header */}
        <div className="absolute top-3 left-3 z-10 max-w-[16rem]">
          <p className="eyebrow flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-gold-bright)] animate-pulse" />
            Geography · J6 defendants
          </p>
          <p
            data-count={data.totals.with_location > 0 ? data.totals.with_location : undefined}
            className="display mt-1 text-4xl sm:text-5xl tabular-nums text-[var(--color-gold)] drop-shadow"
          >
            {data.totals.with_location.toLocaleString()}
          </p>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
            defendants with a known home state
          </p>
        </div>

        {/* Color ramp legend */}
        <div className="absolute bottom-3 right-3 z-10 bg-[var(--color-surface)]/95 border border-[var(--color-line-soft)] rounded-md px-3 py-2 text-[10px] font-mono text-[var(--color-muted)]">
          <p className="mb-1 uppercase tracking-wider font-bold text-[var(--color-muted)]">
            defendants per state
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--color-muted)]">0</span>
            <div className="flex h-2 w-32">
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    background: colorFor(((i + 1) / 12) * maxCount, maxCount),
                  }}
                  className="flex-1"
                />
              ))}
            </div>
            <span className="text-[var(--color-gold-bright)] font-bold">{maxCount}</span>
          </div>
        </div>

        {/* Hover chip */}
        {hover ? (
          <div
            className="absolute z-10 pointer-events-none bg-[var(--color-surface-2)] text-[var(--color-cream)] border border-[var(--color-line)] rounded-md px-3 py-2 text-[11px] font-mono shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
            style={{
              left: Math.min(hover.x + 10, W - 200),
              top: Math.max(hover.y - 60, 10),
            }}
          >
            <p className="text-[var(--color-cream)] font-bold tracking-tight">
              {hover.name}
            </p>
            <p className="text-[var(--color-muted)] mt-0.5">
              {hover.row?.defendants ?? 0} defendant
              {(hover.row?.defendants ?? 0) === 1 ? "" : "s"}
            </p>
            {hover.row && hover.row.sentenced > 0 ? (
              <p className="text-[var(--color-gold-bright)] mt-0.5">
                {hover.row.sentenced} sentenced
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="absolute bottom-2 left-3 text-[9px] text-[var(--color-muted)] font-mono uppercase tracking-wider z-10 select-none pointer-events-none">
          click a state to see its defendants
        </p>
      </div>

      {/* Top-15 states ranked list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <p className="eyebrow">Top states by defendants</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] border-b border-[var(--color-line-soft)]">
                <th className="text-left py-1.5 font-bold">State</th>
                <th className="text-right py-1.5 font-bold">Defendants</th>
                <th className="text-right py-1.5 font-bold">Sentenced</th>
              </tr>
            </thead>
            <tbody>
              {data.states.slice(0, 15).map((s) => (
                <tr
                  key={s.name}
                  className="border-b border-[var(--color-line-soft)] last:border-0 cursor-pointer hover:bg-[var(--color-surface-2)]"
                  onClick={() => void openState(s.name)}
                >
                  <td className="py-2 font-bold text-[var(--color-ink)]">
                    {s.name}
                  </td>
                  <td className="py-2 text-right tabular-nums font-mono text-[var(--color-ink)]">
                    {s.defendants.toLocaleString()}
                  </td>
                  <td className="py-2 text-right tabular-nums font-mono text-[var(--color-muted)]">
                    {s.sentenced > 0 ? s.sentenced : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected state drawer */}
        {selected ? (
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
              <h3 className="text-lg font-bold tracking-tight text-[var(--color-cream)]">
                {selected}
                {drawer ? (
                  <span className="ml-2 text-sm font-mono text-[var(--color-muted)]">
                    · {drawer.count} defendant
                    {drawer.count === 1 ? "" : "s"}
                  </span>
                ) : null}
              </h3>
              <button
                type="button"
                data-geo-close
                onClick={() => {
                  setSelected(null);
                  setDrawer(null);
                }}
                className="-mr-3 -mt-2 grid min-h-11 min-w-11 place-items-center rounded-full px-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-cream)] font-bold"
              >
                Close ×
              </button>
            </div>
            {loadingDrawer ? (
              <p className="text-sm text-[var(--color-muted)] italic">Loading defendants…</p>
            ) : !drawer || drawer.rows.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)] italic">
                No matched defendants from this state.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-96 overflow-auto">
                {drawer.rows.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-baseline justify-between gap-2 text-xs font-mono border-b border-[var(--color-line-soft)] pb-1.5 last:border-0"
                  >
                    <Link
                      href={`/case/people/${r.slug}`}
                      className="text-[var(--color-cream)] hover:text-[var(--color-gold-bright)] truncate flex-1"
                    >
                      {r.claim_status === "verified" ? "★ " : ""}
                      {r.name}
                    </Link>
                    {r.city ? (
                      <span className="text-[var(--color-muted)] tabular-nums whitespace-nowrap">
                        {toTitleCase(r.city)}
                      </span>
                    ) : null}
                    {r.case_number ? (
                      <span className="text-[var(--color-blue-ink)] tabular-nums whitespace-nowrap">
                        {r.case_number}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-soft)] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-center min-h-[8rem]">
            <p className="italic">
              Click a state on the map (or in the table) to see every
              defendant from there.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export type { StateRow };
