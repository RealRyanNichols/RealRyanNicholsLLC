"use client";

import { useMemo, useRef, useState } from "react";
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
function colorFor(count: number, maxCount: number): string {
  if (count === 0) return "#1c2a4a";
  // Map 1..maxCount to t in [0,1] using a sqrt so the smaller states
  // still get visible color, otherwise the FL/TX dominate.
  const t = Math.sqrt(count / Math.max(1, maxCount));
  // Interpolate from navy → green
  const r1 = 0x28, g1 = 0x3d, b1 = 0x6e; // #283d6e
  const r2 = 0x7f, g2 = 0xe3, b2 = 0xa9; // #7fe3a9
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
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
      <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--color-blue)] bg-[#0a1429]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full h-auto select-none"
          role="img"
          aria-label="Choropleth map of January 6 defendant counts by state. Click a state to see its defendant list."
        >
          {/* States */}
          {statesFC.features.map((f) => {
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
                stroke={isSelected ? "#ffffff" : "#0a1429"}
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
                <title>
                  {nm}: {ct} defendant{ct === 1 ? "" : "s"}
                </title>
              </path>
            );
          })}
        </svg>

        {/* Top-left header */}
        <div className="absolute top-3 left-3 z-10 max-w-[16rem]">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7fe3a9] flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#7fe3a9] animate-pulse" />
            Geography · J6 defendants
          </p>
          <p className="mt-1 text-3xl sm:text-4xl font-bold tabular-nums tracking-tight font-display text-[var(--color-paper)] leading-none drop-shadow">
            {data.totals.with_location.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#a9b7d0] mt-0.5">
            defendants with a known home state
          </p>
        </div>

        {/* Color ramp legend */}
        <div className="absolute bottom-3 right-3 z-10 bg-[#0a1429]/95 border border-[#3a557c] rounded-md px-3 py-2 text-[10px] font-mono text-[#a9b7d0]">
          <p className="mb-1 uppercase tracking-wider font-bold text-[#7c8aa6]">
            defendants per state
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[#7c8aa6]">0</span>
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
            <span className="text-[#7fe3a9] font-bold">{maxCount}</span>
          </div>
        </div>

        {/* Hover chip */}
        {hover ? (
          <div
            className="absolute z-10 pointer-events-none bg-[#0e1a36] border border-[#7fe3a9] rounded-md px-3 py-2 text-[11px] font-mono shadow-lg"
            style={{
              left: Math.min(hover.x + 10, W - 200),
              top: Math.max(hover.y - 60, 10),
            }}
          >
            <p className="text-[var(--color-paper)] font-bold tracking-tight">
              {hover.name}
            </p>
            <p className="text-[#a9b7d0] mt-0.5">
              {hover.row?.defendants ?? 0} defendant
              {(hover.row?.defendants ?? 0) === 1 ? "" : "s"}
            </p>
            {hover.row && hover.row.sentenced > 0 ? (
              <p className="text-[#7fe3a9] mt-0.5">
                {hover.row.sentenced} sentenced
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="absolute bottom-2 left-3 text-[9px] text-[#7c8aa6] font-mono uppercase tracking-wider z-10 select-none pointer-events-none">
          click a state to see its defendants
        </p>
      </div>

      {/* Top-15 states ranked list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-5">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
            Top states by defendants
          </p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] border-b border-[var(--color-line)]">
                <th className="text-left py-1.5 font-bold">State</th>
                <th className="text-right py-1.5 font-bold">Defendants</th>
                <th className="text-right py-1.5 font-bold">Sentenced</th>
              </tr>
            </thead>
            <tbody>
              {data.states.slice(0, 15).map((s) => (
                <tr
                  key={s.name}
                  className="border-b border-[var(--color-line)] last:border-0 cursor-pointer hover:bg-[var(--color-surface)]"
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
          <div className="rounded-2xl border-2 border-[#7fe3a9] bg-[#0e1a36] text-[#cfd9ea] p-5">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
              <h3 className="text-lg font-bold tracking-tight text-[var(--color-paper)]">
                {selected}
                {drawer ? (
                  <span className="ml-2 text-sm font-mono text-[#a9b7d0]">
                    · {drawer.count} defendant
                    {drawer.count === 1 ? "" : "s"}
                  </span>
                ) : null}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setDrawer(null);
                }}
                className="text-[10px] uppercase tracking-wider text-[#7c8aa6] hover:text-[var(--color-paper)] font-bold"
              >
                Close ×
              </button>
            </div>
            {loadingDrawer ? (
              <p className="text-sm text-[#7c8aa6] italic">Loading defendants…</p>
            ) : !drawer || drawer.rows.length === 0 ? (
              <p className="text-sm text-[#7c8aa6] italic">
                No matched defendants from this state.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-96 overflow-auto">
                {drawer.rows.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-baseline justify-between gap-2 text-xs font-mono border-b border-[#1c2a4a] pb-1.5 last:border-0"
                  >
                    <Link
                      href={`/case/people/${r.slug}`}
                      className="text-[var(--color-paper)] hover:text-[#7fe3a9] truncate flex-1"
                    >
                      {r.claim_status === "verified" ? "★ " : ""}
                      {r.name}
                    </Link>
                    {r.city ? (
                      <span className="text-[#7c8aa6] tabular-nums whitespace-nowrap">
                        {toTitleCase(r.city)}
                      </span>
                    ) : null}
                    {r.case_number ? (
                      <span className="text-[#7fa9e3] tabular-nums whitespace-nowrap">
                        {r.case_number}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-soft)] flex items-center justify-center min-h-[8rem]">
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
