import { format } from "date-fns";

// One bar per day, server-rendered. The rules every daily-views chart on the
// site follows:
//   - on narrow screens (below Tailwind's `sm`, 640px) only the most recent
//     `mobileMax` days render; wider screens get every row
//   - every bar is at least `minPct` tall so a quiet day still reads as a day
//   - the exact value lives in each bar's title, so dropping the value labels
//     when the chart is dense loses nothing
export type DailyBarRow = { day: string; views: number };

export const DAILY_BARS_MOBILE_MAX = 14;
export const DAILY_BARS_MIN_PCT = 4;

export function DailyBars({
  rows,
  mobileMax = DAILY_BARS_MOBILE_MAX,
  minPct = DAILY_BARS_MIN_PCT,
  heightClass = "h-44",
  barClass = "bg-[var(--color-accent)]",
  unit = "views",
}: {
  rows: DailyBarRow[];
  mobileMax?: number;
  minPct?: number;
  heightClass?: string;
  barClass?: string;
  unit?: string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.views ?? 0), 0);
  // Rows arrive oldest-first; hide the oldest ones on phones.
  const hideBefore = Math.max(0, rows.length - mobileMax);
  const dense = rows.length > 16;

  return (
    <div
      data-daily-bars
      data-mobile-max={mobileMax}
      data-min-pct={minPct}
      className={`flex items-end gap-1 sm:gap-1.5 ${heightClass}`}
    >
      {rows.map((r, i) => {
        const views = r.views ?? 0;
        const h = max > 0 ? Math.max(minPct, Math.round((views / max) * 100)) : minPct;
        const d = new Date(`${r.day}T12:00:00`);
        const mobileHidden = i < hideBefore;
        const showDate = !dense || i % 3 === 0 || i === rows.length - 1;
        return (
          <div
            key={r.day}
            data-daily-bar
            data-day={r.day}
            className={`${mobileHidden ? "hidden sm:flex" : "flex"} h-full min-w-0 flex-1 flex-col items-center justify-end`}
          >
            {!dense ? (
              <span className="mb-1 text-[9px] sm:text-[10px] font-bold tabular-nums text-[var(--color-ink-soft)]">
                {views.toLocaleString()}
              </span>
            ) : null}
            <div
              data-daily-bar-fill
              className={`w-full rounded-t transition-all ${barClass}`}
              style={{ height: `${h}%` }}
              title={`${format(d, "EEE MMM d")}: ${views.toLocaleString()} ${unit}`}
            />
            <span
              className={`mt-1 whitespace-nowrap text-[9px] sm:text-[10px] tabular-nums text-[var(--color-muted)] ${showDate ? "" : "opacity-0"}`}
            >
              {format(d, "M/d")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
