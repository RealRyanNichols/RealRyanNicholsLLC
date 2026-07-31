import { jsonString } from "@/lib/shortcodes";

// {{chart: {...}}} — real numbers only. Hand-rolled SVG, server-rendered,
// zero client JS and zero new dependencies. Navy plot area, gold series,
// cream gridlines at low opacity. A chart without a source string does not
// render in production: charts are proof, and an unsourced chart is a lie
// with axes. Horizontal scroll on phones, never squashed.

type Datum = { label: string; value?: number; series?: Record<string, number> };

const SERIES_COLORS = ["#e1bd5b", "#7fa9e3", "#9df0c0", "#cfd9ea"];

function parseData(value: Record<string, unknown>): Datum[] {
  const raw = value.data;
  if (!Array.isArray(raw)) return [];
  const out: Datum[] = [];
  for (const item of raw) {
    if (item === null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label : null;
    if (!label) continue;
    if (typeof o.value === "number" && Number.isFinite(o.value)) {
      out.push({ label, value: o.value });
    } else if (o.series && typeof o.series === "object" && !Array.isArray(o.series)) {
      const series: Record<string, number> = {};
      for (const [k, v] of Object.entries(o.series as Record<string, unknown>)) {
        if (typeof v === "number" && Number.isFinite(v)) series[k] = v;
      }
      if (Object.keys(series).length > 0) out.push({ label, series });
    }
  }
  return out.slice(0, 24);
}

function fmt(n: number): string {
  return Math.abs(n) >= 1000 ? n.toLocaleString("en-US") : String(n);
}

export function ArticleChart({ value }: { value: Record<string, unknown> }) {
  const type = jsonString(value, "type") ?? "bar";
  const title = jsonString(value, "title");
  const caption = jsonString(value, "caption");
  const source = jsonString(value, "source");
  const sourceUrl = jsonString(value, "source_url");
  const data = parseData(value);

  if (!source || data.length === 0) {
    // No source, no chart. Loud in dev so the writer sees it; silent in prod.
    if (process.env.NODE_ENV !== "production") {
      return (
        <div className="not-prose my-7 rounded-md border-2 border-dashed border-[#8a6d1f] bg-[#f4efe4] p-4 text-sm font-bold text-[#8a6d1f]">
          Chart blocked: {!source ? "missing source. " : ""}
          {data.length === 0 ? "missing or invalid data." : ""} Charts are
          proof; an unsourced chart does not ship.
        </div>
      );
    }
    return null;
  }

  const seriesKeys =
    data[0]?.series !== undefined
      ? Array.from(new Set(data.flatMap((d) => Object.keys(d.series ?? {})))).slice(0, 4)
      : [];
  const isMulti = seriesKeys.length > 0;

  const totals = data.map((d) =>
    isMulti
      ? type === "stacked"
        ? seriesKeys.reduce((s, k) => s + (d.series?.[k] ?? 0), 0)
        : Math.max(...seriesKeys.map((k) => d.series?.[k] ?? 0))
      : d.value ?? 0,
  );
  const max = Math.max(1, ...totals);

  // Geometry. Width scales with data so dense charts scroll, never squash.
  const plotH = 220;
  const padL = 56;
  const padB = 40;
  const padT = 12;
  const slot = isMulti && type !== "stacked" ? Math.max(64, seriesKeys.length * 22 + 20) : 64;
  const width = padL + data.length * slot + 16;
  const height = plotH + padT + padB;
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <figure className="not-prose my-8">
      <div className="overflow-hidden rounded-lg border border-[#0b1b34]/20 bg-[#0b1b34]">
        {title ? (
          <p className="border-b border-[#f4efe4]/10 px-4 py-3 text-sm font-black uppercase tracking-wider text-[#e1bd5b]">
            {title}
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            role="img"
            aria-label={title ?? "Chart"}
            style={{ display: "block", minWidth: Math.min(width, 640) }}
          >
            {/* gridlines + axis labels */}
            {gridLines.map((g) => (
              <g key={g}>
                <line
                  x1={padL}
                  x2={width - 8}
                  y1={y(max * g)}
                  y2={y(max * g)}
                  stroke="#f4efe4"
                  strokeOpacity={0.12}
                />
                <text
                  x={padL - 8}
                  y={y(max * g) + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="#a9b7d0"
                >
                  {fmt(Math.round(max * g))}
                </text>
              </g>
            ))}
            <line x1={padL} x2={width - 8} y1={y(0)} y2={y(0)} stroke="#f4efe4" strokeOpacity={0.35} />

            {/* series */}
            {type === "line" && !isMulti ? (
              <polyline
                fill="none"
                stroke="#e1bd5b"
                strokeWidth={3}
                points={data
                  .map((d, i) => `${padL + i * slot + slot / 2},${y(d.value ?? 0)}`)
                  .join(" ")}
              />
            ) : null}
            {type === "line" && !isMulti
              ? data.map((d, i) => (
                  <circle
                    key={d.label}
                    cx={padL + i * slot + slot / 2}
                    cy={y(d.value ?? 0)}
                    r={4}
                    fill="#e1bd5b"
                  />
                ))
              : null}

            {type !== "line" && !isMulti
              ? data.map((d, i) => {
                  const h = ((d.value ?? 0) / max) * plotH;
                  return (
                    <rect
                      key={d.label}
                      x={padL + i * slot + 12}
                      y={y(d.value ?? 0)}
                      width={slot - 24}
                      height={Math.max(2, h)}
                      rx={3}
                      fill="#e1bd5b"
                    />
                  );
                })
              : null}

            {isMulti && type === "stacked"
              ? data.map((d, i) => {
                  let acc = 0;
                  return seriesKeys.map((k, si) => {
                    const v = d.series?.[k] ?? 0;
                    const yTop = y(acc + v);
                    const h = (v / max) * plotH;
                    acc += v;
                    return (
                      <rect
                        key={`${d.label}-${k}`}
                        x={padL + i * slot + 12}
                        y={yTop}
                        width={slot - 24}
                        height={Math.max(0, h)}
                        fill={SERIES_COLORS[si % SERIES_COLORS.length]}
                      />
                    );
                  });
                })
              : null}

            {isMulti && type !== "stacked"
              ? data.map((d, i) =>
                  seriesKeys.map((k, si) => {
                    const v = d.series?.[k] ?? 0;
                    const bw = Math.max(10, (slot - 24) / seriesKeys.length);
                    return (
                      <rect
                        key={`${d.label}-${k}`}
                        x={padL + i * slot + 12 + si * bw}
                        y={y(v)}
                        width={bw - 3}
                        height={Math.max(2, (v / max) * plotH)}
                        rx={2}
                        fill={SERIES_COLORS[si % SERIES_COLORS.length]}
                      />
                    );
                  }),
                )
              : null}

            {/* x labels */}
            {data.map((d, i) => (
              <text
                key={d.label}
                x={padL + i * slot + slot / 2}
                y={height - 14}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill="#cfd9ea"
              >
                {d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label}
              </text>
            ))}
          </svg>
        </div>

        {isMulti ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-2">
            {seriesKeys.map((k, si) => (
              <span key={k} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#cfd9ea]">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: SERIES_COLORS[si % SERIES_COLORS.length] }}
                  aria-hidden
                />
                {k}
              </span>
            ))}
          </div>
        ) : null}

        <p className="border-t border-[#f4efe4]/10 px-4 py-2.5 text-xs text-[#a9b7d0]">
          <span className="font-bold uppercase tracking-wider text-[10px] text-[#e1bd5b]">
            Source:
          </span>{" "}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline decoration-[#e1bd5b] underline-offset-2"
            >
              {source} <span aria-hidden>↗</span>
            </a>
          ) : (
            source
          )}
        </p>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
