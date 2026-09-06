"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  LAND_PATHS,
  RADAR_H as H,
  RADAR_W as W,
  STATE_SHAPES,
  pingLabel,
  projectLngLat,
  projectPing,
  sanitizePings,
  type RadarPing,
} from "@/lib/radar-geo";

// The map layer of the live radar. Mounts on the client only (see
// MapRoomLive / SituationRoom, which load it with next/dynamic and ssr:false
// inside a RadarFrame that already carries the server-rendered headline).
//
// Public surface rules, in code:
//   - a ping is a dot at city/state resolution, never a person
//   - tapping a dot shows city and state only — no path, no page count,
//     no session detail — and there is no drawer
//   - one finger on the map pans the map, not the page; two fingers pinch;
//     the wheel zooms; every control is at least 44×44 CSS px

type RadarView = { x: number; y: number; scale: number };

const WORLD_VIEW: RadarView = { x: 0, y: 0, scale: 1 };
const US_CENTER = projectLngLat(-98.5795, 39.8283);
const US_VIEW: RadarView = US_CENTER
  ? {
      x: -((US_CENTER[0] - W / 2) * 2.45),
      y: -((US_CENTER[1] - H / 2) * 2.45),
      scale: 2.45,
    }
  : WORLD_VIEW;

const MIN_SCALE = 0.9;
const MAX_SCALE = 8;

type Gesture =
  | { kind: "pan"; startX: number; startY: number; initX: number; initY: number }
  | {
      kind: "pinch";
      startDist: number;
      startMidX: number;
      startMidY: number;
      init: RadarView;
    };

export function LiveVisitorRadar({ initial }: { initial: RadarPing[] }) {
  const [pings, setPings] = useState<RadarPing[]>(() => sanitizePings(initial));
  const [selected, setSelected] = useState<RadarPing | null>(null);

  // Live poll every 10s. Only the fields the map needs are kept.
  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();
    async function pull() {
      const { data } = await supabase.rpc("live_visitor_pings");
      if (!mounted) return;
      if (Array.isArray(data)) setPings(sanitizePings(data));
    }
    void pull();
    const id = window.setInterval(pull, 10_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  // Drop the selection if that visitor has left.
  useEffect(() => {
    if (selected && !pings.some((p) => p.ping_id === selected.ping_id)) {
      setSelected(null);
    }
  }, [pings, selected]);

  // ── pan + zoom ─────────────────────────────────────────────────────
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState<RadarView>(US_VIEW);
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);

  const clamp = useCallback((next: RadarView): RadarView => {
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next.scale));
    // Keep a good share of the map on screen so nobody can pan into the void.
    const maxPan = ((scale - 1) * W) / 2 + W * 0.3;
    const x = Math.max(-maxPan, Math.min(maxPan, next.x));
    const y = Math.max(-maxPan / 2, Math.min(maxPan / 2, next.y));
    return { x, y, scale };
  }, []);

  // Client px → viewBox units, measured from the centre of the map.
  const toViewBox = useCallback((clientX: number, clientY: number): [number, number] => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return [0, 0];
    return [
      ((clientX - rect.left) / rect.width) * W - W / 2,
      ((clientY - rect.top) / rect.height) * H - H / 2,
    ];
  }, []);

  // Zoom by `factor` keeping the viewBox point (sx, sy) fixed under the cursor.
  const zoomAt = useCallback(
    (factor: number, sx: number, sy: number) => {
      setView((v) => {
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor));
        const ratio = newScale / v.scale;
        return clamp({
          x: sx - (sx - v.x) * ratio,
          y: sy - (sy - v.y) * ratio,
          scale: newScale,
        });
      });
    },
    [clamp],
  );

  // Wheel zoom needs a non-passive listener: React registers wheel as
  // passive, so preventDefault (which stops the page scrolling) only works
  // when we attach the handler ourselves.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      const [sx, sy] = toViewBox(e.clientX, e.clientY);
      zoomAt(factor, sx, sy);
    };
    // Belt and braces for browsers that ignore touch-action on SVG: block
    // the page from scrolling while a gesture is in progress on the map.
    const onTouchMove = (e: TouchEvent) => {
      if (gesture.current) e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [toViewBox, zoomAt]);

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    svgRef.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const active = Array.from(pointers.current.values());
    if (active.length >= 2) {
      const [a, b] = active;
      gesture.current = {
        kind: "pinch",
        startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        startMidX: (a.x + b.x) / 2,
        startMidY: (a.y + b.y) / 2,
        init: view,
      };
    } else {
      gesture.current = {
        kind: "pan",
        startX: e.clientX,
        startY: e.clientY,
        initX: view.x,
        initY: view.y,
      };
    }
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!g || !rect) return;
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;

    if (g.kind === "pan") {
      setView((v) =>
        clamp({
          ...v,
          x: g.initX + (e.clientX - g.startX) * scaleX,
          y: g.initY + (e.clientY - g.startY) * scaleY,
        }),
      );
      return;
    }

    const active = Array.from(pointers.current.values());
    if (active.length < 2) return;
    const [a, b] = active;
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, g.init.scale * (dist / g.startDist)));
    const ratio = newScale / g.init.scale;
    // Keep the point that was under the pinch midpoint under the midpoint.
    const [sx0, sy0] = toViewBox(g.startMidX, g.startMidY);
    const [sx1, sy1] = toViewBox(midX, midY);
    setView(
      clamp({
        x: sx1 - (sx0 - g.init.x) * ratio,
        y: sy1 - (sy0 - g.init.y) * ratio,
        scale: newScale,
      }),
    );
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    const active = Array.from(pointers.current.values());
    if (active.length === 0) {
      gesture.current = null;
      setDragging(false);
    } else if (active.length === 1) {
      // Pinch ended with one finger still down: continue as a pan from here.
      const [a] = active;
      gesture.current = {
        kind: "pan",
        startX: a.x,
        startY: a.y,
        initX: view.x,
        initY: view.y,
      };
    }
  }

  function showWorld() {
    setView(WORLD_VIEW);
  }
  function showUnitedStates() {
    setView(US_VIEW);
  }

  // Project every ping once.
  const projected = useMemo(
    () =>
      pings
        .map((p) => {
          const xy = projectPing(p);
          if (!xy) return null;
          return { p, x: xy[0], y: xy[1] };
        })
        .filter((p): p is { p: RadarPing; x: number; y: number } => p !== null),
    [pings],
  );
  const usCount = useMemo(
    () => pings.filter((p) => p.country?.toUpperCase() === "US").length,
    [pings],
  );

  // Scale the dot radius INVERSELY to zoom so dots stay readable.
  const dotR = 4 / view.scale;
  const ringR = 7 / view.scale;
  const strokeW = 1 / view.scale;
  const isUsView = view.scale > 1.2;

  // The radar's transform: scale around center, then pan.
  const transform = `translate(${W / 2 + view.x} ${H / 2 + view.y}) scale(${view.scale}) translate(${-W / 2} ${-H / 2})`;

  const controlBtn =
    "grid h-11 w-11 place-items-center rounded-md border border-[#3a557c] bg-[#0a1429] text-[#cfd9ea] hover:bg-[#1c2a4a] font-bold text-lg";

  return (
    <>
      <svg
        ref={svgRef}
        data-radar-map
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 block h-full w-full select-none"
        style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label="Live map of active visitors. Each dot is one visitor at city and state resolution. Drag to pan, pinch or scroll to zoom, tap a dot to see its city and state."
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
            @media (prefers-reduced-motion: reduce) {
              .ping-ring { animation: none; opacity: 0.35; }
            }
          `}</style>
        </defs>

        <g transform={transform}>
          {/* Land, one path per polygon. */}
          {LAND_PATHS.map((d, i) => (
            <path key={i} d={d} fill="#1c2a4a" stroke="#3a557c" strokeWidth={0.5} />
          ))}

          {/* US state outlines, so a dot reads as "in Texas" at a glance. */}
          <g opacity={isUsView ? 1 : 0.55}>
            {STATE_SHAPES.map((s) => (
              <path
                key={s.code}
                data-state={s.code}
                d={s.path}
                fill="none"
                stroke="#3a557c"
                strokeWidth={0.4}
              />
            ))}
          </g>

          {/* Individual visitor pings. */}
          {projected.map(({ p, x, y }) => {
            const isSel = selected?.ping_id === p.ping_id;
            const color = isSel ? "#fff" : "var(--color-live)";
            const label = pingLabel(p);
            return (
              <g
                key={p.ping_id}
                data-ping
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((cur) => (cur?.ping_id === p.ping_id ? null : p));
                }}
                style={{ cursor: "pointer" }}
              >
                {/* Generous invisible hit target so a fingertip can land it. */}
                <circle cx={x} cy={y} r={Math.max(ringR * 2, 22 / view.scale)} fill="transparent" />
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
                  stroke={isSel ? "var(--color-live)" : "#0e1a36"}
                  strokeWidth={strokeW}
                />
                <title>{label}</title>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Controls: 44px targets, top-right. */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
        <div className="flex overflow-hidden rounded-md border border-[#3a557c] bg-[#0a1429]">
          <button
            type="button"
            onClick={showUnitedStates}
            className="h-11 min-w-11 px-3 text-[10px] font-black uppercase tracking-wider text-[var(--color-live)] hover:bg-[#1c2a4a]"
            aria-label="Focus radar on the United States"
            aria-pressed={isUsView}
          >
            US
          </button>
          <button
            type="button"
            onClick={showWorld}
            className="h-11 min-w-11 border-l border-[#3a557c] px-3 text-[10px] font-black uppercase tracking-wider text-[#cfd9ea] hover:bg-[#1c2a4a]"
            aria-label="Show the whole world"
            aria-pressed={!isUsView}
          >
            World
          </button>
        </div>
        <button
          type="button"
          onClick={() => zoomAt(1.4, 0, 0)}
          className={controlBtn}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomAt(1 / 1.4, 0, 0)}
          className={controlBtn}
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Selected ping: city and state only. Tap anywhere on it to dismiss. */}
      {selected ? (
        <button
          type="button"
          data-ping-chip
          onClick={() => setSelected(null)}
          className="absolute bottom-3 left-3 z-10 flex min-h-11 max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-[var(--color-live)] bg-[#0a1429]/95 px-4 text-left text-sm font-bold text-[var(--color-paper)] shadow-lg"
          aria-label={`Visitor reading from ${pingLabel(selected)}. Tap to dismiss.`}
        >
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--color-live)]" aria-hidden />
          <span className="truncate">{pingLabel(selected)}</span>
          <span className="text-xs font-normal text-[#7c8aa6]" aria-hidden>
            ×
          </span>
        </button>
      ) : (
        <p className="pointer-events-none absolute bottom-2 left-3 z-10 select-none text-[9px] font-mono uppercase tracking-wider text-[#7c8aa6]">
          {projected.length.toLocaleString()} plotted · {usCount.toLocaleString()} U.S. · drag to pan · pinch or scroll to zoom · tap a dot
        </p>
      )}
    </>
  );
}
