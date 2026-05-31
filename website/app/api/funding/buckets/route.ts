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

// Public read for the gamified fund allocator: each active monthly bucket with
// its goal and how much has been designated to it this month. Aggregates only.
export async function GET() {
  const supabase = getSupabaseStaticClient();
  const { data, error } = await supabase.rpc("funding_buckets");
  if (error) return NextResponse.json({ buckets: [] });
  const buckets = ((data ?? []) as BucketRow[]).map((b) => ({
    id: b.id,
    label: b.label,
    blurb: b.blurb,
    goal_cents: Number(b.goal_cents ?? 0),
    raised_cents: Number(b.raised_cents ?? 0),
  }));
  return NextResponse.json({ buckets });
}
