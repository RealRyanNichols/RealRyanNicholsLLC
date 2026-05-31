import { NextResponse } from "next/server";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

export const dynamic = "force-dynamic";

type BucketRow = {
  id: string;
  label: string;
  blurb: string | null;
  goal_cents: number | string;
  raised_cents: number | string;
};

type SnapshotRow = {
  donated_month_cents: number | string;
  special_month_cents: number | string;
  manual_cents: number | string;
  raised_cents: number | string;
};

// Public read for the gamified fund allocator. Returns:
//  - buckets: each active monthly bucket with its goal and the amount DESIGNATED
//    to it this month (donations with campaign = fund:<id>).
//  - total:   the REAL overall money in this month (general gifts + designated +
//    manual offline, excluding private "special" gifts) vs the sum of bucket
//    goals. This is what the "This month, total" bar shows, so undesignated
//    general gifts still make the meter move instead of leaving it stuck at $0.
// Aggregates only — no PII.
export async function GET() {
  const supabase = getSupabaseStaticClient();

  const [bucketsRes, snapshotRes] = await Promise.all([
    supabase.rpc("funding_buckets"),
    supabase.rpc("funding_snapshot"),
  ]);

  if (bucketsRes.error) return NextResponse.json({ buckets: [], total: null });

  const buckets = ((bucketsRes.data ?? []) as BucketRow[]).map((b) => ({
    id: b.id,
    label: b.label,
    blurb: b.blurb,
    goal_cents: Number(b.goal_cents ?? 0),
    raised_cents: Number(b.raised_cents ?? 0),
  }));

  const goalSum = buckets.reduce((s, b) => s + b.goal_cents, 0);

  // funding_snapshot returns a single aggregate row (as an array via RPC).
  const snap = (snapshotRes.data as SnapshotRow[] | SnapshotRow | null);
  const snapRow = Array.isArray(snap) ? snap[0] : snap;
  const overallRaised = snapRow ? Number(snapRow.raised_cents ?? 0) : null;

  const total =
    overallRaised === null
      ? null
      : { raised_cents: overallRaised, goal_cents: goalSum };

  return NextResponse.json({ buckets, total });
}
