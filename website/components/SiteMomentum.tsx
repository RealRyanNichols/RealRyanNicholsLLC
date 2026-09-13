import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { EMPTY_SITE_TOTALS, fetchSiteTotals } from "@/lib/site-totals";

// Live momentum panel used above the feed and on the J6 mission page.
// Each tile drills into a real list — if you can show a number, you can
// show what's behind it.
export async function SiteMomentum({ variant = "wide" }: { variant?: "wide" | "compact" }) {
  const supabase = getSupabaseStaticClient();

  // Server-side aggregation (site_totals RPC) — accurate past PostgREST's
  // 1000-row fetch cap. Counting/summing rows in JS undercounted once
  // case_people (1571) and case_documents (1044) passed 1000.
  const t = (await fetchSiteTotals(supabase)) ?? EMPTY_SITE_TOTALS;
  const profilesReady = t.defendants_unclaimed;
  const profilesClaimed = t.defendants_verified;
  const documents = t.documents;
  const grievances = t.grievances;
  const totalViews = t.total_views;
  const totalShares = t.total_shares;
  const daysSincePardon = t.days_since_pardon;

  type Tile = {
    label: string;
    value: number;
    tone: "ink" | "gold" | "blue";
    href?: string;
  };

  const tiles: Tile[] =
    variant === "compact"
      ? [
          { label: "Profiles ready", value: profilesReady ?? 0, tone: "blue", href: "/case?view=people&filter=unclaimed" },
          { label: "Documents", value: documents ?? 0, tone: "ink", href: "/case?view=documents" },
          { label: "Total reach", value: totalViews, tone: "gold", href: "/?sort=trending" },
          { label: "Days since pardon", value: daysSincePardon, tone: "ink" },
        ]
      : [
          { label: "Profiles ready to claim", value: profilesReady ?? 0, tone: "blue", href: "/case?view=people&filter=unclaimed" },
          { label: "Profiles verified", value: profilesClaimed ?? 0, tone: "ink", href: "/case?view=people&filter=verified" },
          { label: "Documents on file", value: documents ?? 0, tone: "ink", href: "/case?view=documents" },
          // t.grievances counts DOCUMENTED PATTERNS (34), not the 267 forms
          // Ryan filed — label it as what it is so the number reads true.
          { label: "Grievance patterns", value: grievances ?? 0, tone: "ink", href: "/case?view=grievances" },
          // Same counter /about/numbers documents as "Total reach": every
          // successful load, humans and bots alike. The label says so.
          { label: "Total reach", value: totalViews, tone: "gold", href: "/?sort=trending" },
          { label: "Total shares", value: totalShares, tone: "gold", href: "/?sort=trending" },
        ];

  return (
    <section
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6"
      aria-label="Site momentum"
      data-reveal
    >
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <p className="eyebrow">
          The J6 Case · live
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          updated continuously · tap any number
        </p>
      </div>
      <div
        className={`grid gap-3 ${
          variant === "compact"
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3"
        }`}
      >
        {tiles.map((t, i) => (
          <TileCard key={t.label} d={i} {...t} />
        ))}
      </div>
    </section>
  );
}

function TileCard({
  label,
  value,
  tone,
  href,
  d,
}: {
  label: string;
  value: number;
  tone: "ink" | "gold" | "blue";
  href?: string;
  // Reveal stagger index.
  d: number;
}) {
  const valueCls =
    tone === "gold"
      ? "text-[var(--color-gold)]"
      : tone === "blue"
      ? "text-[var(--color-blue-ink)]"
      : "text-[var(--color-ink)]";

  const inner = (
    <>
      <div
        className={`display text-4xl sm:text-5xl tabular-nums ${valueCls}`}
        data-count={value > 0 ? value : undefined}
      >
        {value.toLocaleString()}
      </div>
      <div className="mt-2 text-[11px] sm:text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold leading-tight">
        {label}
      </div>
      {href ? (
        <div className="mt-2 text-[11px] sm:text-xs text-[var(--color-gold)] font-bold">
          View →
        </div>
      ) : null}
    </>
  );

  const baseCls =
    "block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4 sm:p-5 min-h-[112px] sm:min-h-[128px]";

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseCls} hover:border-[var(--color-gold)] transition`}
        data-reveal
        style={{ "--d": d } as React.CSSProperties}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className={baseCls} data-reveal style={{ "--d": d } as React.CSSProperties}>
      {inner}
    </div>
  );
}
