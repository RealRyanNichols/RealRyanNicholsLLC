"use client";

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

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--color-line)",
  background: "var(--color-paper)",
  fontSize: 12,
  color: "var(--color-ink)",
};

// ─── Views + unique visitors trend ────────────────────────────────────────
export type TrendDay = {
  day: string;
  views: number;
  visitors: number;
  sessions: number;
};

export function VisitorTrendChart({ data }: { data: TrendDay[] }) {
  const rows = data.map((d) => ({ ...d, label: d.day.slice(5) }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            minTickGap={18}
          />
          <YAxis tick={{ fontSize: 10 }} width={44} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="views" name="Views" fill="#e1bd5b" radius={[3, 3, 0, 0]} maxBarSize={26} />
          <Line
            dataKey="visitors"
            name="Unique visitors"
            stroke="#2f7d54"
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
  if (source === "Facebook") return "#4267B2";
  if (source.startsWith("X")) return "#111827";
  if (source.includes("Google")) return "#34a853";
  if (source.startsWith("Direct")) return "#9ca3af";
  if (source === "Internal links") return "#d8c89e";
  if (source.includes("search")) return "#38bdf8";
  if (source === "Instagram") return "#E1306C";
  if (source === "Truth Social") return "#e1bd5b";
  if (source === "Gab") return "#28a745";
  return "#7fa9e3";
}

export function TrafficSourcesChart({ data }: { data: SourceRow[] }) {
  return (
    <div style={{ height: Math.max(200, data.length * 34) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="source" width={108} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
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
    <div className="overflow-x-auto">
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
              const bg =
                v === 0 ? "var(--color-surface)" : `rgba(225, 189, 91, ${0.16 + t * 0.84})`;
              return (
                <div
                  key={hour}
                  className="h-5 flex-1 rounded-[2px] border border-black/5"
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
