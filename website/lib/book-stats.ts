import { unstable_cache } from "next/cache";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { BOOK_TIERS } from "@/lib/book";

export type BookStats = {
  /** Paid pre-orders — people who confirmed and bought. */
  buyers: number;
  /** Email signups — opted in, still waiting. */
  onList: number;
  /** Older book waitlist signups. */
  waitlist: number;
  /** Paid pre-orders in the last 24h (recency/FOMO). */
  last24hBuyers: number;
  /** Email signups in the last 24h. */
  last24hSignups: number;
  /** Paid Founding Supporter Editions. */
  foundingClaimed: number;
  /** Cap on the Founding edition (drives the scarcity bar). */
  foundingLimit: number;
};

const FOUNDING_LIMIT =
  BOOK_TIERS.find((t) => t.slug === "founding_supporter_edition")?.limited ?? 250;

async function fetchBookStats(): Promise<BookStats> {
  const empty: BookStats = {
    buyers: 0,
    onList: 0,
    waitlist: 0,
    last24hBuyers: 0,
    last24hSignups: 0,
    foundingClaimed: 0,
    foundingLimit: FOUNDING_LIMIT,
  };
  if (!isSupabaseServiceConfigured()) return empty;

  const supabase = getSupabaseServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const head = { count: "exact" as const, head: true };
  const [
    buyersRes,
    listRes,
    waitlistRes,
    foundingRes,
    recentBuyersRes,
    recentSignupsRes,
  ] = await Promise.all([
    supabase.from("book_orders").select("*", head).eq("payment_status", "paid"),
    supabase.from("book_email_signups").select("*", head),
    supabase.from("book_waitlist").select("*", head),
    supabase
      .from("book_orders")
      .select("*", head)
      .eq("payment_status", "paid")
      .eq("product_slug", "founding_supporter_edition"),
    supabase
      .from("book_orders")
      .select("*", head)
      .eq("payment_status", "paid")
      .gte("created_at", since),
    supabase.from("book_email_signups").select("*", head).gte("created_at", since),
  ]);
  return {
    buyers: buyersRes.count ?? 0,
    onList: listRes.count ?? 0,
    waitlist: waitlistRes.count ?? 0,
    last24hBuyers: recentBuyersRes.count ?? 0,
    last24hSignups: recentSignupsRes.count ?? 0,
    foundingClaimed: foundingRes.count ?? 0,
    foundingLimit: FOUNDING_LIMIT,
  };
}

/**
 * Public-facing counts for the social-proof counter and admin tiles. Cached 60s
 * so marketing pages don't hit the DB every render. Reads service-role-only
 * tables (server-side only).
 */
export const getBookStats = unstable_cache(fetchBookStats, ["book-stats-v2"], {
  revalidate: 60,
  tags: ["book-stats"],
});
