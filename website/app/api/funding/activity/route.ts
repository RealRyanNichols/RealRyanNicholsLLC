import { NextResponse } from "next/server";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

export const dynamic = "force-dynamic";

type ActivityRow = { amount_cents: number; target_label: string; created_at: string };
type StatsRow = { supporter_count: number | string; total_cents: number | string; last_gift_at: string | null };

// Public read for the funding momentum strip. REAL data only — no fabricated
// counts or fake urgency. Returns recent gifts (no names/PII, just amount band +
// target + timestamp) and this month's true supporter count / total.
export async function GET() {
  const supabase = getSupabaseStaticClient();

  const [actRes, statRes] = await Promise.all([
    supabase.rpc("funding_recent_activity", { p_limit: 8 }),
    supabase.rpc("funding_month_stats"),
  ]);

  const activity = ((actRes.data ?? []) as ActivityRow[]).map((a) => ({
    amount_cents: Number(a.amount_cents ?? 0),
    target_label: a.target_label,
    created_at: a.created_at,
  }));

  const sRaw = statRes.data as StatsRow[] | StatsRow | null;
  const s = Array.isArray(sRaw) ? sRaw[0] : sRaw;
  const stats = s
    ? {
        supporter_count: Number(s.supporter_count ?? 0),
        total_cents: Number(s.total_cents ?? 0),
        last_gift_at: s.last_gift_at,
      }
    : { supporter_count: 0, total_cents: 0, last_gift_at: null };

  return NextResponse.json({ activity, stats });
}
