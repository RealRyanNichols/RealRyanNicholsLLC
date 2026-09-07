// The Token Fund ("Fuel the Machine").
//
// Every article, filing summary, map, and archive page on this site is built
// with AI tokens Ryan pays for. The fund lets readers pay for that fuel and
// get something back for it. Money moves through the same Stripe Checkout the
// store uses, into Ryan's account; he buys the credits. There is no link
// that puts tokens straight into a Claude or ChatGPT account, and this page
// never pretends there is.
//
// Ryan retired open-ended donations in 2026 because a $1 pledge that eats a
// $15 chargeback fee is a losing trade. The floor below exists for that
// reason. Amounts and rewards are Ryan's call: change them here, nowhere
// else. The "month" tier is not a number in this file; it is the AI bill as
// it sits in the funding ledger (funding_line_items), so it tracks reality.
//
// This module is pure (no server imports) so client components can read the
// tiers. Server-side reads live in lib/fuel-server.ts.

export const FUEL_CAMPAIGN = "fuel";

// support_intents.purpose is CHECK-constrained to six legacy values; "site"
// ("Keep the site alive") is the honest fit. Fuel intents are recognised by
// the message prefix below, so no schema change was needed.
export const FUEL_PURPOSE = "site";
export const FUEL_MESSAGE_PREFIX = "Token Fund";

export const FUEL_FLOOR_CENTS = 2_000;
export const FUEL_MAX_CENTS = 500_000;

export type FuelTier = {
  slug: string;
  // null = "one month of the AI bill", resolved from the ledger at runtime.
  amountCents: number | null;
  title: string;
  blurb: string;
  // What the supporter gets. Each tier includes everything above it.
  gets: string[];
  askLabel?: string;
  askRequired?: boolean;
  featured?: boolean;
};

export type ResolvedFuelTier = Omit<FuelTier, "amountCents"> & { amountCents: number };

export const FUEL_TIERS: FuelTier[] = [
  {
    slug: "spark",
    amountCents: 2_000,
    title: "Spark",
    blurb: "Keeps the machine running through a build session.",
    gets: ["Your name on the Fuel wall, or stay anonymous", "My thanks, in writing"],
    askLabel: "Anything you want me to know (optional)",
  },
  {
    slug: "day",
    amountCents: 5_000,
    title: "A day of builds",
    blurb: "A full day of articles, maps, and archive work.",
    gets: ["Send me one question. I answer it in a public post."],
    askLabel: "Your question",
  },
  {
    slug: "founding",
    amountCents: 10_000,
    title: "Founding fuel",
    blurb: "The people who kept the lights on when it counted.",
    gets: ["A personal letter from me, on paper, in the mail"],
    askLabel: "Where to send the letter, and anything you want me to know",
  },
  {
    slug: "article",
    amountCents: 50_000,
    title: "Commission an article",
    blurb: "You pick the topic. I do the work and publish it here.",
    gets: [
      "I research and publish an article on the topic you pick, under this site's rules: public records, public actors, no minors, no private data",
      "You read it first, before it goes live",
    ],
    askLabel: "The topic, and any records or links you already have",
    askRequired: true,
    featured: true,
  },
  {
    slug: "month",
    amountCents: null,
    title: "A full month of the machine",
    blurb: "Exactly one month of the AI bill in the ledger.",
    gets: ["You pick the next investigation topic and get updates as it builds"],
    askLabel: "The investigation you want next",
    askRequired: true,
  },
];

export type FundingItem = {
  label: string;
  amount_cents: number;
  cadence: string;
  is_active: boolean;
};

// The AI line items in the funding ledger. Matched by label so the fund
// follows whatever Ryan records there; the amounts are never typed here.
const AI_ITEM = /claude|chatgpt|codex|grok|credits|ai tool/i;

export function fuelBillItems(items: FundingItem[]): FundingItem[] {
  return items.filter((i) => i.is_active && i.cadence === "monthly" && AI_ITEM.test(i.label));
}

export function fuelBillCents(items: FundingItem[]): number {
  return fuelBillItems(items).reduce((s, i) => s + (i.amount_cents ?? 0), 0);
}

// Fill in the ledger-derived tier. When the ledger has no AI items (or the
// bill is below the largest fixed tier) the month tier is dropped rather
// than shown with a made-up number.
export function resolveTiers(billCents: number): ResolvedFuelTier[] {
  const out: ResolvedFuelTier[] = [];
  const largestFixed = Math.max(...FUEL_TIERS.map((t) => t.amountCents ?? 0));
  for (const t of FUEL_TIERS) {
    if (t.amountCents !== null) {
      out.push({ ...t, amountCents: t.amountCents });
    } else if (billCents > largestFixed && billCents <= FUEL_MAX_CENTS) {
      out.push({ ...t, amountCents: billCents });
    }
  }
  return out;
}

// Highest tier whose amount the gift reaches; null below the first tier.
export function tierForAmount(tiers: ResolvedFuelTier[], cents: number): ResolvedFuelTier | null {
  let best: ResolvedFuelTier | null = null;
  for (const t of tiers) if (cents >= t.amountCents && (!best || t.amountCents > best.amountCents)) best = t;
  return best;
}

export type FuelAmountInput = { tier?: string | null; amountCents?: number | null };

export function resolveFuelAmount(
  tiers: ResolvedFuelTier[],
  input: FuelAmountInput,
): { ok: true; amountCents: number; tier: ResolvedFuelTier | null } | { ok: false; error: string } {
  if (input.tier) {
    const t = tiers.find((x) => x.slug === input.tier);
    if (!t) return { ok: false, error: "That tier is not available." };
    return { ok: true, amountCents: t.amountCents, tier: t };
  }
  const cents = input.amountCents;
  if (typeof cents !== "number" || !Number.isInteger(cents)) {
    return { ok: false, error: "Enter a whole-dollar amount." };
  }
  if (cents < FUEL_FLOOR_CENTS) {
    return { ok: false, error: `The floor is ${usdWhole(FUEL_FLOOR_CENTS)}. Below that, card fees eat the gift.` };
  }
  if (cents > FUEL_MAX_CENTS) {
    return { ok: false, error: `For anything over ${usdWhole(FUEL_MAX_CENTS)}, write to me first.` };
  }
  return { ok: true, amountCents: cents, tier: tierForAmount(tiers, cents) };
}

// How long a gift keeps the machine running, from the real monthly bill:
// bill / 30 is a day of the machine. Hours below a day, days below a month.
// Null when there is no bill to measure against (never a made-up figure).
export function fuelDuration(amountCents: number, billCents: number): string | null {
  if (!(billCents > 0) || !(amountCents > 0)) return null;
  const days = amountCents / (billCents / 30);
  if (days >= 29.5) return "a full month of the machine";
  if (days >= 1.75) return `about ${Math.round(days)} days of the machine`;
  if (days >= 0.9) return "about a day of the machine";
  const hours = Math.max(1, Math.round(days * 24));
  return `about ${hours} hour${hours === 1 ? "" : "s"} of the machine`;
}

// Calendar helpers for the month meter (UTC, matching getFuelRaised).
export function daysLeftInMonth(now: Date = new Date()): number {
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  return Math.max(0, last - now.getUTCDate());
}

export function monthName(now: Date = new Date()): string {
  return now.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}

export function usdWhole(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// The note stored on the support intent. The prefix is how the admin ledger
// and the public wall tell fuel intents from the legacy support notes.
export function formatFuelMessage(tierTitle: string, ask: string | null | undefined): string {
  const body = (ask ?? "").trim();
  return body ? `${FUEL_MESSAGE_PREFIX} (${tierTitle}): ${body}` : `${FUEL_MESSAGE_PREFIX} (${tierTitle})`;
}

export function parseFuelMessage(message: string | null | undefined): { tier: string; ask: string } | null {
  if (!message) return null;
  const m = message.match(/^Token Fund \(([^)]*)\)(?::\s*([\s\S]*))?$/);
  if (!m) return null;
  return { tier: m[1] ?? "", ask: (m[2] ?? "").trim() };
}
