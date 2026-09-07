import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getSupabaseServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { fetchSiteTotals } from "@/lib/site-totals";
import { getPublishedSupporters } from "@/lib/supporters";
import {
  FUEL_CAMPAIGN,
  FUEL_PURPOSE,
  fuelBillCents,
  fuelBillItems,
  parseFuelMessage,
  resolveTiers,
  type FundingItem,
  type ResolvedFuelTier,
} from "@/lib/fuel";

export type FuelBill = {
  items: FundingItem[];
  billCents: number;
  tiers: ResolvedFuelTier[];
};

// The AI bill as recorded in the funding ledger, plus the tiers it implies.
// Public read (RLS exposes active line items to anon).
export async function getFuelBill(): Promise<FuelBill> {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("funding_line_items")
    .select("label, amount_cents, cadence, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const all = (data ?? []) as FundingItem[];
  const items = fuelBillItems(all);
  const billCents = fuelBillCents(all);
  return { items, billCents, tiers: resolveTiers(billCents) };
}

// What the machine produced, for the receipts block on /fuel. Only real
// counts: published posts in the last 30 days and the site_totals snapshot
// (defendant profiles, documents, total reach). Anything that cannot be read
// comes back null or 0 and the page leaves that tile out.
export type MachineOutput = {
  posts30: number | null;
  defendants: number;
  documents: number;
  totalViews: number;
};

export async function getMachineOutput(): Promise<MachineOutput> {
  const supabase = getSupabaseStaticClient();
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const [posts, totals] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .lte("published_at", now.toISOString())
      .gte("published_at", since),
    fetchSiteTotals(supabase),
  ]);
  return {
    posts30: posts.error ? null : (posts.count ?? 0),
    defendants: totals?.defendants ?? 0,
    documents: totals?.documents ?? 0,
    totalViews: totals?.total_views ?? 0,
  };
}

export type FuelRaised = {
  monthCents: number;
  monthCount: number;
  allTimeCents: number;
  allTimeCount: number;
  // Recurring gifts that landed this month (the Keepers).
  keepers: number;
  lastGiftAt: string | null;
};

// Money in for this campaign. The donations table is admin-read, so this
// needs the service role; without it the page simply hides the meter rather
// than showing zeros that might be wrong.
export async function getFuelRaised(): Promise<FuelRaised | null> {
  if (!isSupabaseServiceConfigured()) return null;
  try {
    const supabase = getSupabaseServiceClient();
    const { data } = await supabase
      .from("donations")
      .select("amount_cents, created_at, refunded_at, recurring")
      .eq("campaign", FUEL_CAMPAIGN)
      .is("refunded_at", null)
      .order("created_at", { ascending: false })
      .limit(1000);
    const rows = (data ?? []) as { amount_cents: number; created_at: string; recurring: boolean | null }[];
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    let monthCents = 0;
    let monthCount = 0;
    let allTimeCents = 0;
    let keepers = 0;
    for (const r of rows) {
      allTimeCents += r.amount_cents ?? 0;
      if (new Date(r.created_at) >= monthStart) {
        monthCents += r.amount_cents ?? 0;
        monthCount += 1;
        if (r.recurring) keepers += 1;
      }
    }
    return {
      monthCents,
      monthCount,
      allTimeCents,
      allTimeCount: rows.length,
      keepers,
      lastGiftAt: rows[0]?.created_at ?? null,
    };
  } catch {
    return null;
  }
}

// One snapshot for the live meter: the bill, the month, the room, and the
// last few published fuelers. Served by /api/fuel/status and used as the
// meter's first render on /fuel so the numbers never flash from zero.
export type FuelStatus = {
  at: string;
  billCents: number;
  raised: FuelRaised | null;
  liveNow: number;
  recent: { name: string; tier: string; amount: string | null; at: string }[];
};

export async function getFuelStatus(): Promise<FuelStatus> {
  const supabase = getSupabaseStaticClient();
  const [bill, raised, totals, published] = await Promise.all([
    getFuelBill(),
    getFuelRaised(),
    fetchSiteTotals(supabase),
    getPublishedSupporters(24),
  ]);
  const recent = published
    .map((s) => ({ s, fuel: parseFuelMessage(s.message) }))
    .filter((x) => x.fuel !== null)
    .slice(0, 6)
    .map(({ s, fuel }) => ({
      name: s.display_name ?? "Anonymous",
      tier: fuel!.tier,
      amount: s.amount,
      at: s.created_at,
    }));
  return {
    at: new Date().toISOString(),
    billCents: bill.billCents,
    raised,
    liveNow: totals?.live_now ?? 0,
    recent,
  };
}

// Flip the support intent created at checkout to "paid" once Stripe says
// the session is paid. Idempotent; safe from the webhook and the thank-you
// page alike. Best-effort: never throws.
export async function markFuelIntentPaid(
  session: Stripe.Checkout.Session,
  client?: SupabaseClient,
): Promise<void> {
  try {
    if (session.metadata?.campaign !== FUEL_CAMPAIGN) return;
    if (session.payment_status !== "paid") return;
    const intentId = session.metadata?.intent_id;
    if (!intentId) return;
    const supabase = client ?? (isSupabaseServiceConfigured() ? getSupabaseServiceClient() : null);
    if (!supabase) return;
    await supabase
      .from("support_intents")
      .update({ status: "paid" })
      .eq("id", intentId)
      .eq("purpose", FUEL_PURPOSE)
      .eq("status", "started");
  } catch {
    /* best-effort */
  }
}
