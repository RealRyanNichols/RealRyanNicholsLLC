"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ReachDay = {
  day: string;
  human: number;
  ai: number;
  search: number;
  social: number;
  uptime: number;
  unknown: number;
  total: number;
};

const SERIES: { key: keyof ReachDay; label: string; color: string }[] = [
  { key: "human", label: "Humans", color: "#fb923c" },
  { key: "search", label: "Search bots", color: "#38bdf8" },
  { key: "ai", label: "AI agents", color: "#c084fc" },
  { key: "social", label: "Social previews", color: "#34d399" },
  { key: "uptime", label: "Uptime / tools", color: "#cbd5e1" },
  { key: "unknown", label: "Unclassified", color: "#94a3b8" },
];

type TooltipPayload = { dataKey: string; name: string; color: string; value: number };

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const rows = payload.filter((p) => p.dataKey !== "total" && p.value > 0);
  const total = payload.find((p) => p.dataKey === "total")?.value ?? 0;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b0b14]/95 px-3 py-2 text-xs shadow-2xl backdrop-blur">
      <div className="mb-1.5 font-bold text-white">{label}</div>
      {rows.length === 0 ? (
        <div className="text-white/50">No arrivals</div>
      ) : (
        rows.map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-white/70">
              <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-bold tabular-nums" style={{ color: p.color }}>
              {p.value.toLocaleString()}
            </span>
          </div>
        ))
      )}
      <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-white/10 pt-1.5">
        <span className="text-white/90 font-semibold">Total reach</span>
        <span className="font-bold tabular-nums text-white">{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function ReachLineChart({ data }: { data: ReachDay[] }) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  function toggle(key: string) {
    setHidden((h) => ({ ...h, [key]: !h[key] }));
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(120%_120%_at_50%_-10%,#15162b_0%,#0a0a12_55%,#06060c_100%)] p-4 sm:p-5">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[120%] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(124,58,237,0.35), transparent)" }}
        aria-hidden
      />
      <div className="relative flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold tracking-tight text-white">The strands</h3>
        <p className="text-[11px] text-white/45">
          Each line is a source of reach. Hover the timeline · click a strand to isolate it.
        </p>
      </div>

      <div className="relative mt-3 h-[320px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-white/45 [&_.recharts-line-curve]:[filter:drop-shadow(0_0_5px_rgba(255,255,255,0.22))]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="rgba(255,255,255,0.2)"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              stroke="rgba(255,255,255,0.2)"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              width={42}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "rgba(255,255,255,0.25)", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Legend
              onClick={(e) => toggle(String(e.dataKey))}
              wrapperStyle={{ fontSize: 11, cursor: "pointer", paddingTop: 6 }}
              iconType="plainline"
            />
            {SERIES.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                hide={!!hidden[s.key]}
                isAnimationActive
                animationBegin={i * 180}
                animationDuration={1400}
                animationEasing="ease-in-out"
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
