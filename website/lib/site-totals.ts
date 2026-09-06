import type { SupabaseClient } from "@supabase/supabase-js";

// The one definition of "live" on this site.
//
// `site_totals()` (a security-definer RPC, anon-callable) returns `live_now`:
// the number of DISTINCT sessions whose last activity is inside the last five
// minutes. Every surface that shows a live count — the header strip, the
// Situation Room, the Map Room headline, the admin dashboards — must read
// this field rather than counting page_views rows itself. Counting rows
// double-counts a visitor who opened two tabs; counting sessions does not.
export const LIVE_WINDOW_MINUTES = 5;

export type SiteTotals = {
  defendants: number;
  defendants_verified: number;
  defendants_pending: number;
  defendants_unclaimed: number;
  documents: number;
  grievances: number;
  events: number;
  total_views: number;
  total_shares: number;
  days_since_pardon: number;
  days_since_dismissal: number;
  live_now: number;
  countries_now: number;
};

export const EMPTY_SITE_TOTALS: SiteTotals = {
  defendants: 0,
  defendants_verified: 0,
  defendants_pending: 0,
  defendants_unclaimed: 0,
  documents: 0,
  grievances: 0,
  events: 0,
  total_views: 0,
  total_shares: 0,
  days_since_pardon: 0,
  days_since_dismissal: 0,
  live_now: 0,
  countries_now: 0,
};

function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

// Coerce the RPC's jsonb payload into a fully-populated SiteTotals. Missing
// or malformed fields read as 0 so a partial payload never crashes a page.
export function normalizeSiteTotals(raw: unknown): SiteTotals {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    defendants: num(r.defendants),
    defendants_verified: num(r.defendants_verified),
    defendants_pending: num(r.defendants_pending),
    defendants_unclaimed: num(r.defendants_unclaimed),
    documents: num(r.documents),
    grievances: num(r.grievances),
    events: num(r.events),
    total_views: num(r.total_views),
    total_shares: num(r.total_shares),
    days_since_pardon: num(r.days_since_pardon),
    days_since_dismissal: num(r.days_since_dismissal),
    live_now: num(r.live_now),
    countries_now: num(r.countries_now),
  };
}

// Returns null when the RPC errors so callers can distinguish "quiet site"
// (live_now = 0) from "could not read".
export async function fetchSiteTotals(
  client: Pick<SupabaseClient, "rpc">,
): Promise<SiteTotals | null> {
  const { data, error } = await client.rpc("site_totals");
  if (error || data == null) return null;
  return normalizeSiteTotals(data);
}
