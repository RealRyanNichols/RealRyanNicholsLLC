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
  const manualCents = Number(snap?.manual_cents ?? settings.manual_raised_cents ?? 0);

  // Donations only — straight from the donations table (native checkout, kind
  // "donation") via funding_snapshot. This DELIBERATELY excludes store orders,
  // the $997 builds, and supporter subscriptions, so the public meter never
  // represents merch or membership revenue as donations to the support goal.
  const donatedMonthCents = Number(snap?.donated_month_cents ?? 0);
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
