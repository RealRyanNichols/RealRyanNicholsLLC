"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import landJson from "world-atlas/land-50m.json";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, GeometryObject } from "geojson";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { COUNTRY_COORDS, flagFor, nameFor } from "@/lib/country-coords";
import { formatDistanceToNowStrict } from "date-fns";

// ─── Map geometry: pre-computed at module load, reused across renders ──
const W = 1000;
const H = 500;
const topology = landJson as unknown as Topology<{
  land: GeometryCollection;
}>;
const land = feature(topology, topology.objects.land) as
  | Feature<GeometryObject>
  | { features: Feature<GeometryObject>[] };
const PROJECTION = geoEqualEarth().fitExtent(
  [
    [4, 4],
    [W - 4, H - 4],
  ],
  "features" in land
    ? { type: "FeatureCollection", features: land.features }
    : land,
);
const PATH_GEN = geoPath(PROJECTION);
const LAND_PATH =
  "features" in land
    ? land.features
        .map((f) => PATH_GEN(f as Feature<GeometryObject>))
        .filter((p): p is string => !!p)
        .join(" ")
    : PATH_GEN(land as Feature<GeometryObject>) ?? "";

type RadarView = { x: number; y: number; scale: number };

const WORLD_VIEW: RadarView = { x: 0, y: 0, scale: 1 };
const US_CENTER = PROJECTION([-98.5795, 39.8283]);
const US_VIEW: RadarView = US_CENTER
  ? {
      x: -((US_CENTER[0] - W / 2) * 2.45),
      y: -((US_CENTER[1] - H / 2) * 2.45),
      scale: 2.45,
    }
  : WORLD_VIEW;

// ─── Types ─────────────────────────────────────────────────────────────
type Ping = {
  ping_id: string;
  country: string | null;
  region: string | null;
  city: string | null;
  path: string;
  last_seen: string;
  pages_in_session: number;
};

type SessionPage = {
  path: string;
  viewed_at: string;
  dwell_seconds: number;
};

// ─── Helpers ───────────────────────────────────────────────────────────

// Deterministic small jitter so multiple sessions from the same country
// don't stack on a single pixel. Uses the ping_id as a stable seed.
function jitterFor(pingId: string, magnitudeDeg = 6): [number, number] {
  let h = 0;
  for (let i = 0; i < pingId.length; i++) {
    h = (h * 31 + pingId.charCodeAt(i)) >>> 0;
  }
  const a = (h % 10_000) / 10_000;
  const b = ((h >>> 7) % 10_000) / 10_000;
  return [(a - 0.5) * 2 * magnitudeDeg, (b - 0.5) * 2 * magnitudeDeg];
}

function projectPing(p: Ping): [number, number] | null {
  const meta = p.country ? COUNTRY_COORDS[p.country.toUpperCase()] : null;
  if (!meta) return null;
  const [dLng, dLat] = jitterFor(p.ping_id);
  return PROJECTION([meta.lng + dLng, meta.lat + dLat]) ?? null;
}

// ─── Component ─────────────────────────────────────────────────────────
export function LiveVisitorRadar({ initial }: { initial: Ping[] }) {
  const [pings, setPings] = useState<Ping[]>(initial);
  const [selected, setSelected] = useState<Ping | null>(null);
  const [trail, setTrail] = useState<SessionPage[] | null>(null);
  const [loadingTrail, setLoadingTrail] = useState(false);

  // Live poll every 10s.
  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();
    async function pull() {
      const { data } = await supabase.rpc("live_visitor_pings");
      if (!mounted) return;
      if (Array.isArray(data)) setPings(data as Ping[]);
    }
    void pull();
    const id = window.setInterval(pull, 10_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  // ── pan + zoom state ───────────────────────────────────────────────
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState<RadarView>(US_VIEW);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

  const clamp = useCallback((next: RadarView) => {
    const minScale = 0.9;
    const maxScale = 8;
    const scale = Math.max(minScale, Math.min(maxScale, next.scale));
    // Keep at least 20% of map on screen so user can't get fully lost.
    const maxPan = ((scale - 1) * W) / 2 + W * 0.3;
    const x = Math.max(-maxPan, Math.min(maxPan, next.x));
    const y = Math.max(-maxPan / 2, Math.min(maxPan / 2, next.y));
    return { x, y, scale };
  }, []);

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    // Don't hijack the page scroll: only zoom when ⌘/Ctrl is held.
    // Plain wheel falls through so the page scrolls normally; the
    // +/− buttons remain the primary zoom control.
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
    // Zoom toward the cursor.
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const sx = (cx / rect.width) * W - W / 2;
    const sy = (cy / rect.height) * H - H / 2;
    setView((v) => {
      const newScale = v.scale * factor;
      // Move the map so the point under the cursor stays put.
      const dx = sx - (sx - v.x) * (newScale / v.scale);
      const dy = sy - (sy - v.y) * (newScale / v.scale);
      return clamp({ x: dx, y: dy, scale: newScale });
    });
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0) return;
    // Only the mouse drags-to-pan. On touch we let the browser handle
    // the gesture (vertical scroll) so the page never gets trapped;
    // touch users zoom/pan via the on-screen buttons.
    if (e.pointerType !== "mouse") return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      initX: view.x,
      initY: view.y,
    };
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = dragRef.current;
    if (!d?.active || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    setView((v) =>
      clamp({
        ...v,
        x: d.initX + (e.clientX - d.startX) * scaleX,
        y: d.initY + (e.clientY - d.startY) * scaleY,
      }),
    );
  }
  function onPointerUp() {
    if (dragRef.current) dragRef.current.active = false;
  }
  function showWorld() {
    setView(WORLD_VIEW);
  }

  function showUnitedStates() {
    setView(US_VIEW);
  }

  // ── Selecting a ping ───────────────────────────────────────────────
  const handleSelect = useCallback(
    async (ping: Ping) => {
      setSelected(ping);
      setTrail(null);
      setLoadingTrail(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.rpc("live_visitor_session_detail", {
          p_ping_id: ping.ping_id,
        });
        setTrail((data as SessionPage[]) ?? []);
      } finally {
        setLoadingTrail(false);
      }
    },
    [],
  );

  // Project every ping once.
  const projected = useMemo(
    () =>
      pings
        .map((p) => {
          const xy = projectPing(p);
          if (!xy) return null;
          return { p, x: xy[0], y: xy[1] };
        })
        .filter((p): p is { p: Ping; x: number; y: number } => p !== null),
    [pings],
  );
  const usPings = useMemo(
    () => pings.filter((p) => p.country?.toUpperCase() === "US"),
    [pings],
  );
  const countryCount = useMemo(() => {
    const countries = new Set(
      pings
        .map((p) => p.country?.toUpperCase())
        .filter((country): country is string => !!country),
    );
    return countries.size;
  }, [pings]);

  // Scale the dot radius INVERSELY to zoom so dots stay readable.
  const dotR = 4 / view.scale;
  const ringR = 7 / view.scale;
  const strokeW = 1 / view.scale;

  // The radar's transform: scale around center, then pan.
  const transform = `translate(${W / 2 + view.x} ${H / 2 + view.y}) scale(${view.scale}) translate(${-W / 2} ${-H / 2})`;

  return (
    <div className="relative">
      {/* Map surface */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--color-blue)] bg-[#0e1a36]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full h-auto select-none touch-pan-y"
          style={{ cursor: dragRef.current?.active ? "grabbing" : "grab" }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onPointerCancel={onPointerUp}
          role="img"
          aria-label="Live map focused on the United States first, showing each active visitor as an individual ping. Drag to pan, use the controls to zoom or view the world, click a ping to see its activity."
        >
          <defs>
            <style>{`
              @keyframes ping-pulse {
                0%   { transform: scale(1);   opacity: 0.7; }
                70%  { transform: scale(3);   opacity: 0;   }
                100% { transform: scale(3);   opacity: 0;   }
              }
              .ping-ring {
                transform-origin: center;
                transform-box: fill-box;
                animation: ping-pulse 2s ease-out infinite;
              }
            `}</style>
          </defs>

          <g transform={transform}>
            {/* Land. */}
            <path
              d={LAND_PATH}
              fill="#1c2a4a"
              stroke="#3a557c"
              strokeWidth="0.5"
            />

            {/* Individual visitor pings. */}
            {projected.map(({ p, x, y }) => {
              const isSel = selected?.ping_id === p.ping_id;
              const color = isSel ? "#fff" : "#7fe3a9";
              return (
                <g
                  key={p.ping_id}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleSelect(p);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={ringR}
                    className="ping-ring"
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeW * 1.5}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={dotR}
                    fill={color}
                    stroke={isSel ? "#7fe3a9" : "#0e1a36"}
                    strokeWidth={strokeW}
                  />
                  <title>
                    {flagFor(p.country)}{" "}
                    {p.city ?? nameFor(p.country)}
                    {p.region ? `, ${p.region}` : ""} — {p.path} (
                    {formatDistanceToNowStrict(new Date(p.last_seen), {
                      addSuffix: true,
                    })}
                    )
                  </title>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Overlay controls (zoom + count) */}
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#7fe3a9]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#7fe3a9] animate-pulse" />
            U.S. live radar
          </div>
          <div className="mt-1 text-3xl sm:text-5xl font-bold tabular-nums tracking-tight font-display text-[var(--color-paper)] leading-none drop-shadow">
            {pings.length}
          </div>
          <div className="text-[11px] text-[#a9b7d0] leading-snug">
            visitors right now · {usPings.length} U.S. · {countryCount}{" "}
            {countryCount === 1 ? "country" : "countries"}
          </div>
        </div>
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <div className="flex overflow-hidden rounded-md border border-[#3a557c] bg-[#0a1429]">
            <button
              type="button"
              onClick={showUnitedStates}
              className="h-9 px-2.5 text-[10px] font-black uppercase tracking-wider text-[#7fe3a9] hover:bg-[#1c2a4a]"
              aria-label="Focus radar on the United States"
            >
              US
            </button>
            <button
              type="button"
              onClick={showWorld}
              className="h-9 border-l border-[#3a557c] px-2.5 text-[10px] font-black uppercase tracking-wider text-[#cfd9ea] hover:bg-[#1c2a4a]"
              aria-label="Show the whole world"
            >
              World
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              setView((v) => clamp({ ...v, scale: v.scale * 1.4 }))
            }
            className="w-9 h-9 rounded-md border border-[#3a557c] bg-[#0a1429] text-[#cfd9ea] hover:bg-[#1c2a4a] font-bold text-lg"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() =>
              setView((v) => clamp({ ...v, scale: v.scale / 1.4 }))
            }
            className="w-9 h-9 rounded-md border border-[#3a557c] bg-[#0a1429] text-[#cfd9ea] hover:bg-[#1c2a4a] font-bold text-lg"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
        <p className="absolute bottom-2 left-3 text-[9px] text-[#7c8aa6] font-mono uppercase tracking-wider z-10 select-none">
          U.S. first · world available · click a ping
        </p>
      </div>

      {/* Drawer: selected visitor's activity */}
      {selected ? (
        <div className="mt-3 rounded-2xl border-2 border-[#7fe3a9] bg-[#0e1a36] text-[#cfd9ea] p-5">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl leading-none" aria-hidden>
                {flagFor(selected.country)}
              </span>
              <h3 className="text-lg font-bold tracking-tight text-[var(--color-paper)]">
                Visitor #{selected.ping_id}
              </h3>
              <span className="text-xs text-[#7c8aa6] font-mono">
                · {selected.city ?? "—"}
                {selected.region ? `, ${selected.region}` : ""}
                {selected.country ? ` · ${nameFor(selected.country)}` : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-[10px] uppercase tracking-wider text-[#7c8aa6] hover:text-[var(--color-paper)] font-bold"
            >
              Close ×
            </button>
          </div>

          <p className="text-xs text-[#a9b7d0] font-mono mb-3">
            Last seen{" "}
            {formatDistanceToNowStrict(new Date(selected.last_seen), {
              addSuffix: true,
            })}{" "}
            · {selected.pages_in_session}{" "}
            {selected.pages_in_session === 1 ? "page" : "pages"} in this session
          </p>

          <p className="text-[10px] uppercase tracking-wider font-bold text-[#7fe3a9] mb-1.5">
            What&apos;s keeping their attention
          </p>
          {loadingTrail ? (
            <p className="text-sm text-[#7c8aa6] italic">Loading trail…</p>
          ) : !trail || trail.length === 0 ? (
            <p className="text-sm text-[#7c8aa6] italic">
              Just {selected.path} so far.
            </p>
          ) : (
            <ol className="space-y-1.5">
              {trail.map((t, i) => (
                <li
                  key={`${t.path}-${t.viewed_at}-${i}`}
                  className="flex items-baseline gap-2 text-xs font-mono"
                >
                  <span className="text-[#7c8aa6] tabular-nums w-5 text-right">
                    {i + 1}.
                  </span>
                  <span className="text-[var(--color-paper)] flex-1 truncate">
                    {t.path}
                  </span>
                  <span className="text-[#7fe3a9] tabular-nums whitespace-nowrap">
                    {t.dwell_seconds}s
                  </span>
                  <span className="text-[#7c8aa6] tabular-nums whitespace-nowrap">
                    ·{" "}
                    {formatDistanceToNowStrict(new Date(t.viewed_at), {
                      addSuffix: true,
                    })}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </div>
  );
}
