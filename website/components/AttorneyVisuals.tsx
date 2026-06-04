// Visual toolkit for the attorney brief (/admin/attorney-brief).
// Pure server components — SVG + CSS only, no client JS and no chart
// dependency — so the dossier renders instantly and prints cleanly.
// Every figure here is fed from the brief's existing source-labeled data;
// nothing is computed into a legal conclusion.
import type { ReactNode } from "react";

export type Tone = "red" | "gold" | "green" | "navy";
export type BarItem = { label: string; valueText: string; tone?: Tone };

const TONE_HEX: Record<Tone, string> = {
  red: "#b32419",
  gold: "#c89b2f",
  green: "#2d6a4f",
  navy: "#1d3a6b",
};

// Tone colors tuned for TEXT on light backgrounds. Gold is darkened so it
// stays legible on the cream surface; use TONE_HEX for fills/bars/bands.
const TONE_TEXT_HEX: Record<Tone, string> = {
  red: "#b32419",
  gold: "#8f6b16",
  green: "#2d6a4f",
  navy: "#1d3a6b",
};

const INK = "#1a1410";
const MUTED = "#7a6a52";

// Pull the largest concrete dollar magnitude out of a label such as "$45-50M",
// "$411,501.15", "$750K-1.5M", or "$10,300 lead". Returns null when there is no
// hard number (e.g. "multi-million") so the chart can flag it as pending.
function parseMoney(input: string): number | null {
  const cleaned = input.toLowerCase().replace(/[$,+]/g, " ");
  const re = /(\d+(?:\.\d+)?)\s*(m|k)?/g;
  let match: RegExpExecArray | null;
  let max: number | null = null;
  while ((match = re.exec(cleaned)) !== null) {
    let value = parseFloat(match[1]);
    if (match[2] === "m") value *= 1_000_000;
    else if (match[2] === "k") value *= 1_000;
    if (max === null || value > max) max = value;
  }
  return max;
}

export function ChartCard({
  eyebrow,
  title,
  hint,
  children,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
        {eyebrow}
      </p>
      <h3 className="mt-1 font-sans text-lg font-black leading-tight text-[var(--color-ink)]">
        {title}
      </h3>
      {hint ? (
        <p className="mt-1 text-[11px] font-semibold leading-5 text-[var(--color-ink-soft)]">
          {hint}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function KpiStat({
  value,
  label,
  tone = "navy",
}: {
  value: string;
  label: string;
  tone?: Tone;
}) {
  return (
    <div className="border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
      <p
        className="font-sans text-2xl font-black leading-none sm:text-3xl"
        style={{ color: TONE_TEXT_HEX[tone] }}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] font-bold leading-5 text-[var(--color-ink-soft)]">
        {label}
      </p>
    </div>
  );
}

// Horizontal labeled bars, sorted by magnitude. scale="log" copes with many
// orders of magnitude (damages span $1.6K to $50M); scale="linear" is for
// comparable figures (payroll / 1099 records).
export function MoneyBars({
  items,
  scale = "linear",
}: {
  items: BarItem[];
  scale?: "log" | "linear";
}) {
  const rows = items
    .map((item) => ({ item, mag: parseMoney(item.valueText) }))
    .sort((a, b) => (b.mag ?? -1) - (a.mag ?? -1));
  const known = rows
    .map((r) => r.mag)
    .filter((m): m is number => m !== null && m > 0);
  const max = known.length ? Math.max(...known) : 1;
  const min = known.length ? Math.min(...known) : 1;
  const span = Math.log10(max) - Math.log10(Math.max(min, 1)) || 1;

  return (
    <div className="grid gap-3">
      {rows.map(({ item, mag }) => {
        let pct: number;
        if (mag === null || mag <= 0) {
          pct = 14;
        } else if (scale === "log") {
          pct = 10 + ((Math.log10(mag) - Math.log10(Math.max(min, 1))) / span) * 90;
        } else {
          pct = Math.max(6, (mag / max) * 100);
        }
        const tone = item.tone ?? "navy";
        const pending = mag === null;
        return (
          <div key={item.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-bold leading-5 text-[var(--color-ink-soft)]">
                {item.label}
              </span>
              <span
                className="font-sans text-sm font-black tabular-nums"
                style={{ color: TONE_TEXT_HEX[tone] }}
              >
                {item.valueText}
              </span>
            </div>
            <div className="mt-1 h-3 w-full overflow-hidden border border-[var(--color-line)] bg-[var(--color-paper)]">
              <div
                className="h-full rounded-r-sm"
                style={{
                  width: `${Math.min(100, pct)}%`,
                  backgroundColor: TONE_HEX[tone],
                  opacity: pending ? 0.45 : 1,
                  backgroundImage: pending
                    ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.55) 0 4px, transparent 4px 8px)"
                    : undefined,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// SVG donut for a status / readiness mix.
export function ReadinessDonut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { label: string; value: number; tone: Tone }[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = 52;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
      <svg
        viewBox="0 0 140 140"
        className="h-36 w-36 shrink-0"
        role="img"
        aria-label={`${centerValue} ${centerLabel}`}
      >
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-paper)" strokeWidth="16" />
        {segments.map((seg) => {
          const dash = (seg.value / total) * circ;
          const node = (
            <circle
              key={seg.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={TONE_HEX[seg.tone]}
              strokeWidth="16"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += dash;
          return node;
        })}
        <text
          x="70"
          y="66"
          textAnchor="middle"
          style={{ fontSize: 26, fontWeight: 900, fill: INK }}
        >
          {centerValue}
        </text>
        <text
          x="70"
          y="86"
          textAnchor="middle"
          style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 1, fill: MUTED }}
        >
          {centerLabel}
        </text>
      </svg>
      <ul className="grid w-full gap-2">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0"
              style={{ backgroundColor: TONE_HEX[seg.tone] }}
            />
            <span className="text-xs font-bold leading-5 text-[var(--color-ink-soft)]">
              <span className="font-black tabular-nums">{seg.value}</span> {seg.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChargeStatusList({
  items,
}: {
  items: { title: string; status: string; tone: Tone }[];
}) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li
          key={item.title}
          className="flex items-center justify-between gap-3 border border-[var(--color-line)] bg-[var(--color-paper)] p-2.5"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: TONE_HEX[item.tone] }}
            />
            <span className="truncate text-sm font-black text-[var(--color-ink)]">
              {item.title}
            </span>
          </span>
          <span
            className="shrink-0 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em]"
            style={{
              backgroundColor: TONE_HEX[item.tone],
              color: item.tone === "gold" ? INK : "#ffffff",
            }}
          >
            {item.status}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Vertical timeline rail. Red nodes mark the disputed church allegation and the
// next court setting; everything else is background / source-request history.
export function BriefTimeline({
  items,
}: {
  items: { date: string; title: string; body: string }[];
}) {
  return (
    <ol className="grid gap-4 border-l-2 border-[var(--color-line)] pl-5">
      {items.map((item) => {
        const urgent = /arraignment|church-parking|church parking/i.test(
          `${item.title} ${item.date}`,
        );
        const tone: Tone = urgent ? "red" : "navy";
        return (
          <li key={`${item.date}-${item.title}`} className="relative">
            <span
              className="absolute -left-[1.6rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--color-surface)]"
              style={{ backgroundColor: TONE_HEX[tone] }}
            />
            <p
              className="text-[11px] font-black uppercase tracking-[0.14em]"
              style={{ color: TONE_TEXT_HEX[tone] }}
            >
              {item.date}
            </p>
            <h4 className="mt-0.5 font-sans text-sm font-black text-[var(--color-ink)]">
              {item.title}
            </h4>
            <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
              {item.body}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export type MatterMoney = { label: string; value: string };
export type Matter = {
  id: string;
  name: string;
  kind: string;
  tone: Tone;
  statute: string;
  headline: string;
  firstMove: string;
  whatItIs: string;
  disputed: string;
  evidence: string[];
  people: string[];
  redFlags?: string[];
  money?: MatterMoney[];
  exposure: string;
  href: string;
};

// A row of color-coded chips that jump to each matter block.
export function MatterNav({ matters }: { matters: Matter[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {matters.map((m) => (
        <a
          key={m.id}
          href={`#${m.id}`}
          className="inline-flex items-center gap-2 border bg-[var(--color-surface)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.06em] transition hover:bg-[var(--color-paper)]"
          style={{ borderColor: TONE_HEX[m.tone], color: TONE_TEXT_HEX[m.tone] }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: TONE_HEX[m.tone] }}
          />
          {m.name}
        </a>
      ))}
    </div>
  );
}

// One self-contained matter: a color-banded dossier the attorney can read on
// its own — what it is, what is disputed, the packet to pull, the people, and
// the dollar exposure.
export function MatterDossier({ matter }: { matter: Matter }) {
  const fill = TONE_HEX[matter.tone];
  const text = TONE_TEXT_HEX[matter.tone];
  const onBand = matter.tone === "gold" ? "#1a1410" : "#ffffff";
  return (
    <section
      id={matter.id}
      className="scroll-mt-24 overflow-hidden border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm"
      style={{ borderTop: `4px solid ${fill}` }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
        style={{ backgroundColor: fill }}
      >
        <span
          className="text-[10px] font-black uppercase tracking-[0.16em]"
          style={{ color: onBand }}
        >
          {matter.kind}
        </span>
        <span
          className="border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.06em]"
          style={{
            color: onBand,
            borderColor:
              onBand === "#ffffff" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)",
          }}
        >
          {matter.statute}
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="font-sans text-2xl font-black leading-tight text-[var(--color-ink)] sm:text-3xl">
          {matter.name}
        </h3>
        <p className="mt-1 text-sm font-bold" style={{ color: text }}>
          {matter.headline}
        </p>
        <div
          className="mt-3 flex flex-col gap-0.5 p-2.5 sm:flex-row sm:items-baseline sm:gap-2"
          style={{ backgroundColor: fill }}
        >
          <span
            className="text-[10px] font-black uppercase tracking-[0.16em]"
            style={{ color: onBand, opacity: 0.85 }}
          >
            Start here
          </span>
          <span
            className="text-sm font-bold leading-5"
            style={{ color: onBand }}
          >
            {matter.firstMove}
          </span>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
          {matter.whatItIs}
        </p>

        <div
          className="mt-3 border-l-4 bg-[var(--color-paper)] p-3"
          style={{ borderColor: fill }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
            The fight
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-ink)]">
            {matter.disputed}
          </p>
        </div>

        {matter.redFlags && matter.redFlags.length > 0 ? (
          <div className="mt-3 border-l-4 border-[#b32419] bg-[#f6dad2] p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8d1b13]">
              Rights / red flags
            </p>
            <ul className="mt-1 grid gap-1">
              {matter.redFlags.map((flag) => (
                <li
                  key={flag}
                  className="flex gap-2 text-sm font-bold leading-5 text-[#8d1b13]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#b32419]" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {matter.money ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {matter.money.map((m) => (
              <div
                key={m.label}
                className="border border-[var(--color-line)] bg-[var(--color-paper)] p-2.5"
              >
                <p
                  className="font-sans text-lg font-black tabular-nums"
                  style={{ color: text }}
                >
                  {m.value}
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
              Packet to pull
            </p>
            <ul className="mt-2 grid gap-1.5">
              {matter.evidence.map((e) => (
                <li
                  key={e}
                  className="flex gap-2 text-xs font-semibold leading-5 text-[var(--color-ink-soft)]"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0"
                    style={{ backgroundColor: fill }}
                  />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
              Key people
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matter.people.map((p) => (
                <span
                  key={p}
                  className="border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-[11px] font-bold text-[var(--color-ink-soft)]"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-line)] pt-3">
          <p className="text-xs font-bold leading-5 text-[var(--color-ink)]">
            <span className="text-[var(--color-ink-soft)]">Exposure: </span>
            {matter.exposure}
          </p>
          <a
            href={matter.href}
            className="text-[11px] font-black uppercase tracking-[0.08em]"
            style={{ color: text }}
          >
            Full detail
          </a>
        </div>
      </div>
    </section>
  );
}
