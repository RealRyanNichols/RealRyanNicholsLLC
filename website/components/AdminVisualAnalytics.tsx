"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type VisualDailyPoint = {
  label: string;
  views: number;
  reach: number;
};

export type VisualSlice = {
  name: string;
  value: number;
  color: string;
};

export type VisualFunnelStep = {
  name: string;
  value: number;
  fill: string;
  hint: string;
};

export type VisualContentPoint = {
  name: string;
  views: number;
  actions: number;
};

export type VisualSystemLine = {
  name: string;
  value: string;
  detail: string;
  tone: "good" | "watch" | "bad" | "neutral";
};

type Props = {
  daily: VisualDailyPoint[];
  sourceMix: VisualSlice[];
  deviceMix: VisualSlice[];
  funnel: VisualFunnelStep[];
  content: VisualContentPoint[];
  systems: VisualSystemLine[];
  insight: string;
};

type TooltipPayload = {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

const COLORS = {
  green: "#7fe3a9",
  blue: "#7fa9e3",
  gold: "#e4c66a",
  red: "#ef6f61",
  cream: "#fdf8ea",
  muted: "#9fb0ca",
};

function CompactTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#071123]/95 px-3 py-2 text-xs text-[#fdf8ea] shadow-2xl">
      {label ? <div className="mb-1 font-black">{label}</div> : null}
      {payload.map((item, index) => (
        <div key={`${item.name ?? "value"}-${index}`} className="flex min-w-36 items-center justify-between gap-4 py-0.5">
          <span className="text-[#cfd9ea]">{item.name}</span>
          <span className="font-mono font-black tabular-nums" style={{ color: item.color ?? COLORS.cream }}>
            {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function LegendRow({ data }: { data: VisualSlice[] }) {
  return (
    <div className="mt-3 grid gap-1.5 text-xs">
      {data.map((slice) => (
        <div key={slice.name} className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-[#cfd9ea]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: slice.color }} />
            <span className="truncate">{slice.name}</span>
          </span>
          <span className="font-mono font-black tabular-nums text-[#fdf8ea]">{fmt(slice.value)}</span>
        </div>
      ))}
    </div>
  );
}

function toneClass(tone: VisualSystemLine["tone"]) {
  if (tone === "good") return "border-[#7fe3a9]/50 bg-[#7fe3a9]/10 text-[#7fe3a9]";
  if (tone === "watch") return "border-[#e4c66a]/50 bg-[#e4c66a]/10 text-[#e4c66a]";
  if (tone === "bad") return "border-[#ef6f61]/50 bg-[#ef6f61]/10 text-[#ef6f61]";
  return "border-white/10 bg-white/5 text-[#cfd9ea]";
}

export function AdminVisualAnalytics({
  daily,
  sourceMix,
  deviceMix,
  funnel,
  content,
  systems,
  insight,
}: Props) {
  const maxFunnel = funnel.reduce((max, row) => Math.max(max, row.value), 0);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[#2b3a5d] bg-[#071123] text-[#fdf8ea] shadow-2xl">
      <div className="border-b border-white/10 bg-[#0d1a33] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
              Visual intelligence wall
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[#fdf8ea] sm:text-2xl">
              Traffic, sources, action, money, and system health in one read.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#cfd9ea]">{insight}</p>
          </div>
          <Link
            href="/support#support-mission"
            className="btn-support inline-flex min-h-11 items-center rounded-full px-5 py-2 text-xs uppercase tracking-wider"
          >
            Fund the work
          </Link>
        </div>
      </div>

      <div className="grid gap-px bg-white/10 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="bg-[#071123] p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h3 className="text-sm font-black tracking-tight text-[#fdf8ea]">
                Views vs total reach
              </h3>
              <p className="mt-1 text-xs text-[#9fb0ca]">
                Browser page views compared with edge reach, including humans, search, AI, and previews.
              </p>
            </div>
            <span className="rounded-full bg-[#7fa9e3]/15 px-3 py-1 text-[10px] font-black uppercase text-[#7fa9e3]">
              14d
            </span>
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={COLORS.green} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="reachGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} minTickGap={22} />
                <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                <Tooltip content={<CompactTooltip />} cursor={{ stroke: "rgba(255,255,255,0.2)", strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="reach" name="Total reach" stroke={COLORS.blue} fill="url(#reachGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="views" name="Page views" stroke={COLORS.green} fill="url(#viewsGradient)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-1">
          <div className="bg-[#071123] p-4 sm:p-5">
            <h3 className="text-sm font-black tracking-tight text-[#fdf8ea]">Source mix</h3>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceMix} dataKey="value" nameKey="name" innerRadius="56%" outerRadius="82%" paddingAngle={2}>
                    {sourceMix.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CompactTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <LegendRow data={sourceMix} />
          </div>

          <div className="bg-[#071123] p-4 sm:p-5">
            <h3 className="text-sm font-black tracking-tight text-[#fdf8ea]">Device split</h3>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviceMix} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                  <Tooltip content={<CompactTooltip />} />
                  <Bar dataKey="value" name="Views" radius={[6, 6, 0, 0]}>
                    {deviceMix.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-white/10 lg:grid-cols-2">
        <div className="bg-[#071123] p-4 sm:p-5">
          <h3 className="text-sm font-black tracking-tight text-[#fdf8ea]">Attention to money path</h3>
          <p className="mt-1 text-xs text-[#9fb0ca]">
            Green means filled/healthy. Gold means money path. Red means leak.
          </p>
          <div className="mt-4 space-y-3">
            {funnel.map((step, index) => {
              const width = maxFunnel > 0 ? Math.max(4, Math.round((step.value / maxFunnel) * 100)) : 0;
              return (
                <div key={step.name}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-black text-[#fdf8ea]">
                      {index + 1}. {step.name}
                    </span>
                    <span className="font-mono font-black tabular-nums" style={{ color: step.fill }}>
                      {fmt(step.value)}
                    </span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full" style={{ width: `${width}%`, background: step.fill }} />
                  </div>
                  <p className="mt-1 text-[11px] text-[#9fb0ca]">{step.hint}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#071123] p-4 sm:p-5">
          <h3 className="text-sm font-black tracking-tight text-[#fdf8ea]">Top pages as a picture</h3>
          <p className="mt-1 text-xs text-[#9fb0ca]">
            Views show attention. Actions show where people do something with it.
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={content} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 18 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={88} stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip content={<CompactTooltip />} />
                <Bar dataKey="views" name="Views" fill={COLORS.blue} radius={[0, 6, 6, 0]} />
                <Bar dataKey="actions" name="Actions" fill={COLORS.gold} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-white/10 md:grid-cols-3">
        {systems.map((system) => (
          <div key={system.name} className="bg-[#071123] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black tracking-tight text-[#fdf8ea]">{system.name}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${toneClass(system.tone)}`}>
                {system.tone === "good" ? "live" : system.tone === "bad" ? "fix" : system.tone}
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-black tabular-nums text-[#fdf8ea]">{system.value}</p>
            <p className="mt-1 text-xs leading-snug text-[#9fb0ca]">{system.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
