import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// Live momentum panel used above the feed and on the J6 mission page.
// Each tile drills into a real list — if you can show a number, you can
// show what's behind it.
export async function SiteMomentum({ variant = "wide" }: { variant?: "wide" | "compact" }) {
  const supabase = getSupabaseStaticClient();

  // Server-side aggregation (site_totals RPC) — accurate past PostgREST's
  // 1000-row fetch cap. Counting/summing rows in JS undercounted once
  // case_people (1571) and case_documents (1044) passed 1000.
  const { data: rpc } = await supabase.rpc("site_totals");
  const t = (rpc ?? {}) as {
    defendants_unclaimed?: number;
    defendants_verified?: number;
    documents?: number;
    grievances?: number;
    total_views?: number;
    total_shares?: number;
    days_since_pardon?: number;
  };
  const profilesReady = t.defendants_unclaimed ?? 0;
  const profilesClaimed = t.defendants_verified ?? 0;
  const documents = t.documents ?? 0;
  const grievances = t.grievances ?? 0;
  const totalViews = t.total_views ?? 0;
  const totalShares = t.total_shares ?? 0;
  const daysSincePardon = t.days_since_pardon ?? 0;

  type Tile = {
    label: string;
    value: number;
    tone: "ink" | "accent" | "blue";
    href?: string;
  };

  const tiles: Tile[] =
    variant === "compact"
      ? [
          { label: "Profiles ready", value: profilesReady ?? 0, tone: "blue", href: "/case?view=people&filter=unclaimed" },
          { label: "Documents", value: documents ?? 0, tone: "ink", href: "/case?view=documents" },
          { label: "Total views", value: totalViews, tone: "accent", href: "/?sort=trending" },
          { label: "Days since pardon", value: daysSincePardon, tone: "ink" },
        ]
      : [
          { label: "Profiles ready to claim", value: profilesReady ?? 0, tone: "blue", href: "/case?view=people&filter=unclaimed" },
          { label: "Profiles verified", value: profilesClaimed ?? 0, tone: "ink", href: "/case?view=people&filter=verified" },
          { label: "Documents on file", value: documents ?? 0, tone: "ink", href: "/case?view=documents" },
          // t.grievances counts DOCUMENTED PATTERNS (34), not the 267 forms
          // Ryan filed — label it as what it is so the number reads true.
          { label: "Grievance patterns", value: grievances ?? 0, tone: "ink", href: "/case?view=grievances" },
          { label: "Total views", value: totalViews, tone: "accent", href: "/?sort=trending" },
          { label: "Total shares", value: totalShares, tone: "accent", href: "/?sort=trending" },
        ];

  return (
    <section
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6"
      aria-label="Site momentum"
    >
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
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
        {tiles.map((t) => (
          <TileCard key={t.label} {...t} />
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
}: {
  label: string;
  value: number;
  tone: "ink" | "accent" | "blue";
  href?: string;
}) {
  const valueCls =
    tone === "accent"
      ? "text-[var(--color-accent)]"
      : tone === "blue"
      ? "text-[var(--color-blue)]"
      : "text-[var(--color-ink)]";

  const inner = (
    <>
      <div
        className={`text-3xl sm:text-4xl font-bold tabular-nums tracking-tight leading-none ${valueCls}`}
      >
        {value.toLocaleString()}
      </div>
      <div className="mt-2 text-[11px] sm:text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold leading-tight">
        {label}
      </div>
      {href ? (
        <div className="mt-2 text-[10px] sm:text-xs text-[var(--color-accent)] font-bold">
          View →
        </div>
      ) : null}
    </>
  );

  const baseCls =
    "block rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-paper)] p-4 sm:p-5 min-h-[112px] sm:min-h-[128px]";

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseCls} hover:border-[var(--color-accent)] transition`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={baseCls}>{inner}</div>;
}
