import { differenceInDays } from "date-fns";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// One-off momentum tile used above the feed and on the J6 mission page.
// Pulls live counts: profiles ready to claim, documents on file, total
// views across all posts + case items, total shares, and days since
// pardon. Reads only — no writes.
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

  const tiles =
    variant === "compact"
      ? [
          { label: "Profiles ready", value: profilesReady ?? 0, tone: "blue" as const },
          { label: "Documents", value: documents ?? 0, tone: "ink" as const },
          { label: "Total views", value: totalViews, tone: "accent" as const },
          { label: "Days since pardon", value: daysSincePardon, tone: "ink" as const },
        ]
      : [
          { label: "Profiles ready to claim", value: profilesReady ?? 0, tone: "blue" as const },
          { label: "Profiles verified", value: profilesClaimed ?? 0, tone: "ink" as const },
          { label: "Documents on file", value: documents ?? 0, tone: "ink" as const },
          { label: "Grievances filed", value: grievances ?? 0, tone: "ink" as const },
          { label: "Total views", value: totalViews, tone: "accent" as const },
          { label: "Total shares", value: totalShares, tone: "accent" as const },
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
          updated continuously
        </p>
      </div>
      <div
        className={`grid gap-3 ${
          variant === "compact"
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
        }`}
      >
        {tiles.map((t) => (
          <Tile key={t.label} {...t} />
        ))}
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ink" | "accent" | "blue";
}) {
  const valueCls =
    tone === "accent"
      ? "text-[var(--color-accent)]"
      : tone === "blue"
      ? "text-[var(--color-blue)]"
      : "text-[var(--color-ink)]";
  return (
    <div className="rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-paper)] p-3">
      <div
        className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${valueCls}`}
      >
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-[10px] sm:text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold leading-tight">
        {label}
      </div>
    </div>
  );
}
