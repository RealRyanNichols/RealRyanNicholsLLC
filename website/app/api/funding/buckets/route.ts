import { NextResponse } from "next/server";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

export const dynamic = "force-dynamic";

type BucketRow = {
  id: string;
  label: string;
  blurb: string | null;
  goal_cents: number | string;
  raised_cents: number | string;
  cadence: string;
  sort_order: number | string;
};

type SnapshotRow = {
  donated_month_cents: number | string;
  special_month_cents: number | string;
  manual_cents: number | string;
  raised_cents: number | string;
};

// Public read for the unified "Fund the Truth" tool. Returns:
//  - buckets:  every active line item (monthly + one_time) with its goal, the
//    amount designated to it (campaign = fund:<id>), and its cadence.
//  - monthly:  the REAL overall money in this month (general gifts + designated
//    + manual offline, excluding private "special" gifts) vs the $5k monthly
//    goal (sum of monthly bucket goals). This is the headline meter, so even
//    undesignated general gifts move it.
// Aggregates only — no PII.
export async function GET() {
  const supabase = getSupabaseStaticClient();

  const [bucketsRes, snapshotRes] = await Promise.all([
    supabase.rpc("funding_buckets"),
    supabase.rpc("funding_snapshot"),
  ]);

  if (bucketsRes.error) return NextResponse.json({ buckets: [], monthly: null });

  const buckets = ((bucketsRes.data ?? []) as BucketRow[]).map((b) => ({
    id: b.id,
    label: b.label,
    blurb: b.blurb,
    goal_cents: Number(b.goal_cents ?? 0),
    raised_cents: Number(b.raised_cents ?? 0),
    cadence: b.cadence === "one_time" ? "one_time" : "monthly",
    sort_order: Number(b.sort_order ?? 0),
  }));

  const monthlyGoal = buckets
    .filter((b) => b.cadence === "monthly")
    .reduce((s, b) => s + b.goal_cents, 0);

  const snap = snapshotRes.data as SnapshotRow[] | SnapshotRow | null;
  const snapRow = Array.isArray(snap) ? snap[0] : snap;
  const overallRaised = snapRow ? Number(snapRow.raised_cents ?? 0) : null;

  const monthly =
    overallRaised === null
      ? null
      : { raised_cents: overallRaised, goal_cents: monthlyGoal };

  return NextResponse.json({ buckets, monthly });
}
