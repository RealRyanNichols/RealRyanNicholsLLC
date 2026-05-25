import { getSupabaseStaticClient } from "@/lib/supabase/static";

export type FundingLineItem = {
  id: string;
  label: string;
  blurb: string | null;
  amount_cents: number;
  cadence: "monthly" | "one_time";
  sort_order: number;
  is_active: boolean;
};

export type FundingSettings = {
  campaign_title: string;
  campaign_blurb: string | null;
  manual_raised_cents: number;
  manual_note: string | null;
  show_amounts: boolean;
};

export type FundingData = {
  settings: FundingSettings;
  monthlyItems: FundingLineItem[];
  oneTimeItems: FundingLineItem[];
  goalCents: number;
  raisedCents: number;
  donatedMonthCents: number;
  manualCents: number;
  remainingCents: number;
  pct: number;
};

export function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Authoritative money raised this calendar month, straight from Stripe — this
// captures payment-link donations (which never hit our donations table) as well
// as native checkout. Server-only: reads STRIPE_SECRET_KEY. Cached 60s so a
// busy /support doesn't hammer the Stripe API. Returns null if Stripe isn't
// configured or the call fails, so the caller can fall back to recorded data.
async function getStripeMonthlyChargesCents(): Promise<number | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const now = new Date();
  const startOfMonth = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000);
  try {
    const r = await fetch(
      `https://api.stripe.com/v1/charges?limit=100&created[gte]=${startOfMonth}`,
      { headers: { Authorization: `Bearer ${key}` }, next: { revalidate: 60 } },
    );
    if (!r.ok) return null;
    const json = (await r.json()) as {
      data?: { status: string; amount: number; amount_refunded?: number }[];
    };
    let cents = 0;
    for (const c of json.data ?? []) {
      if (c.status !== "succeeded") continue;
      cents += (c.amount ?? 0) - (c.amount_refunded ?? 0);
    }
    return cents;
  } catch {
    return null;
  }
}

// Public read: active line items + the public settings row + the aggregate
// snapshot (donated-this-month + manual offline). Returns null if the funding
// goal has not been configured yet (so the page can hide the whole section).
export async function getFundingData(): Promise<FundingData | null> {
  const supabase = getSupabaseStaticClient();
  const [itemsRes, settingsRes, snapRes] = await Promise.all([
    supabase
      .from("funding_line_items")
      .select("id,label,blurb,amount_cents,cadence,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("funding_settings")
      .select("campaign_title,campaign_blurb,manual_raised_cents,manual_note,show_amounts")
      .eq("id", "default")
      .maybeSingle(),
    supabase.rpc("funding_snapshot"),
  ]);

  if (!settingsRes.data) return null;
  const settings = settingsRes.data as FundingSettings;

  const items = (itemsRes.data ?? []) as FundingLineItem[];
  const monthlyItems = items.filter((i) => i.cadence === "monthly");
  const oneTimeItems = items.filter((i) => i.cadence === "one_time");
  const goalCents = monthlyItems.reduce((s, i) => s + i.amount_cents, 0);

  const snap = Array.isArray(snapRes.data) ? snapRes.data[0] : snapRes.data;
  const tableNonSpecialCents = Number(snap?.donated_month_cents ?? 0);
  const specialMonthCents = Number(snap?.special_month_cents ?? 0);
  const manualCents = Number(snap?.manual_cents ?? settings.manual_raised_cents ?? 0);

  // Prefer Stripe's authoritative monthly total (captures payment-link gifts);
  // subtract off-the-books "special" native gifts. Fall back to the recorded
  // (native, non-special) total if Stripe isn't configured/reachable.
  const stripeCents = await getStripeMonthlyChargesCents();
  const donatedMonthCents =
    stripeCents !== null ? Math.max(0, stripeCents - specialMonthCents) : tableNonSpecialCents;
  const raisedCents = donatedMonthCents + manualCents;

  const remainingCents = Math.max(goalCents - raisedCents, 0);
  const pct = goalCents > 0 ? Math.min(100, Math.round((raisedCents / goalCents) * 100)) : 0;

  return {
    settings,
    monthlyItems,
    oneTimeItems,
    goalCents,
    raisedCents,
    donatedMonthCents,
    manualCents,
    remainingCents,
    pct,
  };
}
