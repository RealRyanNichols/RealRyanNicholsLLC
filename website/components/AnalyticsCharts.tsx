"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DAILY_BARS_MOBILE_MAX } from "@/components/DailyBars";

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--color-line)",
  background: "var(--color-surface-2)",
  fontSize: 12,
  color: "var(--color-cream)",
};

// Axis ticks and legend read as quiet cream on the dark floor; grid lines and
// the hover cursor use the quiet in-panel divider.
const axisTick = { fontSize: 10, fill: "var(--color-muted)" };
const axisLine = { stroke: "var(--color-line-soft)" };
const legendStyle = { fontSize: 12, color: "var(--color-muted)" };
const cursorFill = { fill: "var(--color-line-soft)" };

// Same breakpoint as Tailwind's `sm`, so this chart and the server-rendered
// DailyBars agree on when a screen is "narrow".
function useNarrowScreen(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return narrow;
}

// ─── Views + unique visitors trend ────────────────────────────────────────
export type TrendDay = {
  day: string;
  views: number;
  visitors: number;
  sessions: number;
};

// The chart body is ~250px tall once axes and legend take their share; 10px
// is the 4% floor every daily bar on the site keeps, so a quiet day still
// reads as a day.
const MIN_BAR_PX = 10;

export function VisitorTrendChart({ data }: { data: TrendDay[] }) {
  const narrow = useNarrowScreen();
  // Phones get the most recent 14 days; wider screens get every row.
  const visible = narrow ? data.slice(-DAILY_BARS_MOBILE_MAX) : data;
  const rows = visible.map((d) => ({ ...d, label: d.day.slice(5) }));
  return (
    <div
      className="h-72 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
      data-visitor-trend
      data-bars={rows.length}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line-soft)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={axisLine}
            interval="preserveStartEnd"
            minTickGap={18}
          />
          <YAxis tick={axisTick} axisLine={axisLine} tickLine={axisLine} width={44} />
          <Tooltip contentStyle={tooltipStyle} cursor={cursorFill} />
          <Legend wrapperStyle={legendStyle} />
          <Bar
            dataKey="views"
            name="Views"
            fill="var(--color-gold-bright)"
            radius={[3, 3, 0, 0]}
            maxBarSize={26}
            minPointSize={MIN_BAR_PX}
          />
          <Line
            dataKey="visitors"
            name="Unique visitors"
            stroke="var(--color-green-deep)"
            strokeWidth={2.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Where traffic comes from ─────────────────────────────────────────────
export type SourceRow = { source: string; views: number; visitors: number };

function sourceColor(source: string): string {
  if (source === "Facebook") return "var(--color-brand-facebook)";
  // X's mark is black on light and cream on dark. This floor is dark.
  if (source.startsWith("X")) return "var(--color-cream)";
  if (source.includes("Google")) return "var(--color-brand-google)";
  if (source.startsWith("Direct")) return "var(--color-muted)";
  if (source === "Internal links") return "var(--color-blue-ink)";
  if (source.includes("search")) return "var(--color-sky)";
  if (source === "Instagram") return "var(--color-brand-instagram)";
  if (source === "Truth Social") return "var(--color-gold-bright)";
  if (source === "Gab") return "var(--color-success)";
  return "var(--color-violet)";
}

export function TrafficSourcesChart({ data }: { data: SourceRow[] }) {
  return (
    <div
      style={{ height: Math.max(200, data.length * 34) }}
      className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="source"
            width={108}
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            axisLine={axisLine}
            tickLine={axisLine}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={cursorFill} />
          <Bar dataKey="views" name="Views" radius={[0, 4, 4, 0]}>
            {data.map((d) => (
              <Cell key={d.source} fill={sourceColor(d.source)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Best time to post (day x hour heatmap) ───────────────────────────────
export type HeatCell = { dow: number; hour: number; views: number };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function hourLabel(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

export function ActivityHeatmap({ data }: { data: HeatCell[] }) {
  const grid = new Map<string, number>();
  let max = 1;
  for (const c of data) {
    grid.set(`${c.dow}-${c.hour}`, c.views);
    if (c.views > max) max = c.views;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
      <div className="min-w-[680px]">
        <div className="mb-1 flex items-center gap-0.5 pl-10">
          {Array.from({ length: 24 }).map((_, h) => (
            <span key={h} className="flex-1 text-center text-[8px] text-[var(--color-muted)]">
              {h % 3 === 0 ? (h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`) : ""}
            </span>
          ))}
        </div>
        {DAY_LABELS.map((label, dow) => (
          <div key={label} className="mb-0.5 flex items-center gap-0.5">
            <span className="w-10 text-[10px] font-bold text-[var(--color-ink-soft)]">
              {label}
            </span>
            {Array.from({ length: 24 }).map((_, hour) => {
              const v = grid.get(`${dow}-${hour}`) ?? 0;
              const t = v / max;
              const pct = Math.round((0.16 + t * 0.84) * 100);
              const bg =
                v === 0
                  ? "var(--color-surface-2)"
                  : `color-mix(in srgb, var(--color-gold-bright) ${pct}%, transparent)`;
              return (
                <div
                  key={hour}
                  className="h-5 flex-1 rounded-[2px] border border-[var(--color-line-soft)]"
                  style={{ background: bg }}
                  title={`${label} ${hourLabel(hour)} — ${v.toLocaleString()} views`}
                />
              );
            })}
          </div>
        ))}
        <p className="mt-2 text-[10px] text-[var(--color-muted)]">
          Darker = more page views in that hour (America/Chicago). Post just before
          your hot bands to ride them.
        </p>
      </div>
    </div>
  );
}
