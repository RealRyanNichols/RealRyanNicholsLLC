import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { getSupabaseServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import {
  FUEL_CAMPAIGN,
  FUEL_PURPOSE,
  fuelBillCents,
  fuelBillItems,
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

export type FuelRaised = {
  monthCents: number;
  monthCount: number;
  allTimeCents: number;
  allTimeCount: number;
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
      .select("amount_cents, created_at, refunded_at")
      .eq("campaign", FUEL_CAMPAIGN)
      .is("refunded_at", null)
      .order("created_at", { ascending: false })
      .limit(1000);
    const rows = (data ?? []) as { amount_cents: number; created_at: string }[];
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    let monthCents = 0;
    let monthCount = 0;
    let allTimeCents = 0;
    for (const r of rows) {
      allTimeCents += r.amount_cents ?? 0;
      if (new Date(r.created_at) >= monthStart) {
        monthCents += r.amount_cents ?? 0;
        monthCount += 1;
      }
    }
    return { monthCents, monthCount, allTimeCents, allTimeCount: rows.length };
  } catch {
    return null;
  }
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
