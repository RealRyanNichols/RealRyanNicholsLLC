import Link from "next/link";
import { differenceInDays } from "date-fns";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// Live momentum panel used above the feed and on the J6 mission page.
// Each tile drills into a real list — if you can show a number, you can
// show what's behind it.
export async function SiteMomentum({ variant = "wide" }: { variant?: "wide" | "compact" }) {
  const supabase = getSupabaseStaticClient();

  const [
    { count: profilesReady },
    { count: profilesClaimed },
    { count: documents },
    { count: grievances },
    { data: postSums },
    { data: caseGrievanceSums },
    { data: caseEventSums },
    { data: caseDocSums },
    { data: casePersonSums },
  ] = await Promise.all([
    supabase
      .from("case_people")
      .select("id", { count: "exact", head: true })
      .eq("is_j6_defendant", true)
      .eq("claim_status", "unclaimed"),
    supabase
      .from("case_people")
      .select("id", { count: "exact", head: true })
      .eq("is_j6_defendant", true)
      .eq("claim_status", "verified"),
    supabase
      .from("case_documents")
      .select("id", { count: "exact", head: true })
      .eq("visibility", "public")
      .eq("archived", false),
    supabase
      .from("case_grievances")
      .select("id", { count: "exact", head: true })
      .eq("visibility", "public"),
    supabase.from("posts").select("views_count, shares_count").eq("status", "published"),
    supabase.from("case_grievances").select("views_count, shares_count").eq("visibility", "public"),
    supabase.from("case_events").select("views_count, shares_count").eq("visibility", "public"),
    supabase
      .from("case_documents")
      .select("views_count, shares_count")
      .eq("visibility", "public")
      .eq("archived", false),
    supabase.from("case_people").select("views_count, shares_count").eq("visibility", "public"),
  ]);

  const sumViews = (rows: { views_count: number | null }[] | null) =>
    (rows ?? []).reduce((s, r) => s + (r.views_count ?? 0), 0);
  const sumShares = (rows: { shares_count: number | null }[] | null) =>
    (rows ?? []).reduce((s, r) => s + (r.shares_count ?? 0), 0);

  const totalViews =
    sumViews(postSums) +
    sumViews(caseGrievanceSums) +
    sumViews(caseEventSums) +
    sumViews(caseDocSums) +
    sumViews(casePersonSums);
  const totalShares =
    sumShares(postSums) +
    sumShares(caseGrievanceSums) +
    sumShares(caseEventSums) +
    sumShares(caseDocSums) +
    sumShares(casePersonSums);

  const pardon = new Date("2025-01-20");
  const daysSincePardon = Math.max(0, differenceInDays(new Date(), pardon));

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
          { label: "Grievances filed", value: grievances ?? 0, tone: "ink", href: "/case?view=grievances" },
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
