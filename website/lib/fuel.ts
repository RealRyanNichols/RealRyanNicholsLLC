// The Token Fund ("Fuel the Machine").
//
// Every article, filing summary, map, and archive page on this site is built
// with AI tokens. Ryan pays the subscriptions himself (Claude Max, ChatGPT
// Pro, X Premium: the ledger rows with fuel_role = 'subscription') and is not
// asking anyone to cover them. What runs dry is the included usage, usually
// by the middle of the week. Past that, the only lane either vendor sells is
// usage credits billed at published API rates. The fund buys those credits.
// The ledger row with fuel_role = 'overage' is the monthly target, never a
// number typed here.
//
// Money moves through the same Stripe Checkout the store uses, into Ryan's
// account; he buys the credits. No vendor sells a link that puts tokens
// straight into his account, and this page never pretends one does.
//
// Every "what a dollar buys" figure is arithmetic on two things: the rates
// Anthropic publishes and the token mix measured off Ryan's own machine
// (docs/usage-receipts-2026-09.md). Nobody has metered one article yet, so
// the site calls these estimates, out loud, until a month runs on credits.
//
// Ryan retired open-ended donations in 2026 because a $1 pledge that eats a
// $15 chargeback fee is a losing trade. The floor below exists for that
// reason. Amounts and rewards are Ryan's call: change them here, nowhere
// else.
//
// This module is pure (no server imports) so client components can read the
// tiers. Server-side reads live in lib/fuel-server.ts.

export const FUEL_CAMPAIGN = "fuel";

// support_intents.purpose is CHECK-constrained to six legacy values; "site"
// ("Keep the site alive") is the honest fit. Fuel intents are recognised by
// the message prefix below, so no schema change was needed.
export const FUEL_PURPOSE = "site";
export const FUEL_MESSAGE_PREFIX = "Token Fund";

// $5 floor: Stripe's card fee on $5 is well under a dollar, so nine dollars
// in ten still reach the machine. Below that the fee starts winning.
export const FUEL_FLOOR_CENTS = 500;
export const FUEL_MAX_CENTS = 500_000;

export type FuelCadence = "once" | "monthly";

export type FuelTier = {
  slug: string;
  // null = "one month of overage", resolved from the ledger at runtime.
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
    amountCents: 500,
    title: "A spark",
    blurb: "Keeps the faucet open a little longer.",
    gets: ["Your name on the Fuel wall, or stay anonymous"],
    askLabel: "Anything you want me to know (optional)",
  },
  {
    slug: "charge",
    amountCents: 1_000,
    title: "A charge",
    blurb: "The first real push into the week.",
    gets: ["My thanks, in writing"],
    askLabel: "Anything you want me to know (optional)",
  },
  {
    slug: "research",
    amountCents: 2_500,
    title: "A research run",
    blurb: "Enough credits to pull and read a stack of records.",
    gets: ["A line on the wall saying what your fuel went into, once it has"],
    askLabel: "Anything you want me to know (optional)",
  },
  {
    slug: "day",
    amountCents: 5_000,
    title: "A question, answered",
    blurb: "My time starts here.",
    gets: ["Send me one question. I answer it in a public post."],
    askLabel: "Your question",
  },
  {
    slug: "founding",
    amountCents: 10_000,
    title: "Founding fuel",
    blurb: "The people who kept the lights on when it counted.",
    gets: ["A personal letter from me, on paper, in the mail", "The Founding mark next to your name on the wall"],
    askLabel: "Where to send the letter, and anything you want me to know",
  },
  {
    slug: "article",
    amountCents: 50_000,
    title: "Commission an article",
    blurb: "You pick the topic. I do the work and publish it here.",
    gets: [
      "You pick the topic. I do the research, pull the records and the pictures, and go back and forth with you until it is right, under this site's rules: public records, public actors, no minors, no private data",
      "You read it first, before it goes live",
      "Then it is published here, indexed, and wired with the links, buttons, and call to action you want readers to follow",
    ],
    askLabel: "The topic, and any records or links you already have",
    askRequired: true,
    featured: true,
  },
  {
    slug: "month",
    amountCents: null,
    title: "A month of overage",
    blurb: "The whole month's overage line in the ledger, covered.",
    gets: ["You pick the next investigation topic and get updates as it builds"],
    askLabel: "The investigation you want next",
    askRequired: true,
  },
];

// The monthly lane. One recurring amount, billed by Stripe every month until
// the supporter stops it. It is not in FUEL_TIERS because it is a cadence,
// not a size; the checkout route resolves it by slug.
export const FUEL_MONTHLY: ResolvedFuelTier = {
  slug: "keeper",
  amountCents: 5_000,
  title: "Keeper",
  blurb: "Overage credits every month, until you say stop.",
  gets: [
    "Your name pinned in the Keepers row at the top of the Fuel wall, every month you keep it running",
    "Everything a question gets: one question, answered in public",
  ],
  askLabel: "Your question, or anything you want me to know",
};

// $50 and up buys Ryan's time: a question answered, a letter, an article.
// Under it, fuel keeps the machine running and the name goes on the wall.
// Ryan set this floor himself: the research, the pictures, and the back and
// forth take hours, and he will not pretend otherwise for five dollars.
export const FUEL_TIME_FLOOR_CENTS = 5_000;

export function timeTiers(tiers: ResolvedFuelTier[]): ResolvedFuelTier[] {
  return tiers.filter((t) => t.amountCents >= FUEL_TIME_FLOOR_CENTS);
}

// ── The ledger ──────────────────────────────────────────────────────────

export type FuelRole = "subscription" | "overage";

export type FundingItem = {
  label: string;
  blurb?: string | null;
  amount_cents: number;
  cadence: string;
  is_active: boolean;
  fuel_role?: FuelRole | null;
};

function activeMonthly(items: FundingItem[], role: FuelRole): FundingItem[] {
  return items.filter((i) => i.is_active && i.cadence === "monthly" && i.fuel_role === role);
}

// What Ryan pays himself. Context on the page, never part of the ask.
export function fuelSubscriptionItems(items: FundingItem[]): FundingItem[] {
  return activeMonthly(items, "subscription");
}

export function fuelSubscriptionCents(items: FundingItem[]): number {
  return fuelSubscriptionItems(items).reduce((s, i) => s + (i.amount_cents ?? 0), 0);
}

// The ask: overage credits. One row is expected; the sum is the target.
export function fuelOverageItems(items: FundingItem[]): FundingItem[] {
  return activeMonthly(items, "overage");
}

export function fuelOverageCents(items: FundingItem[]): number {
  return fuelOverageItems(items).reduce((s, i) => s + (i.amount_cents ?? 0), 0);
}

// Fill in the ledger-derived tier. When the ledger has no overage line (or
// the target is below the largest fixed tier) the month tier is dropped
// rather than shown with a made-up number.
export function resolveTiers(targetCents: number): ResolvedFuelTier[] {
  const out: ResolvedFuelTier[] = [];
  const largestFixed = Math.max(...FUEL_TIERS.map((t) => t.amountCents ?? 0));
  for (const t of FUEL_TIERS) {
    if (t.amountCents !== null) {
      out.push({ ...t, amountCents: t.amountCents });
    } else if (targetCents > largestFixed && targetCents <= FUEL_MAX_CENTS) {
      out.push({ ...t, amountCents: targetCents });
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

// ── What a dollar buys ──────────────────────────────────────────────────
//
// Two inputs, both with a source, and nothing else:
//
// 1. Anthropic's published prices for Claude Fable 5.1, per million tokens,
//    read from platform.claude.com/docs/en/about-claude/pricing on the date
//    below. Usage credits are billed at exactly these rates (support.claude.com,
//    "Manage usage credits for paid Claude plans").
export const FABLE_RATES = {
  model: "Claude Fable 5.1",
  input: 10,
  cacheRead: 0.25,
  output: 50,
  checkedOn: "September 7, 2026",
} as const;

// The other faucet. OpenAI sells Codex overage as credits. The base rate is
// off Ryan's own ChatGPT desktop app (Settings, Usage & billing, Auto-reload)
// on the date below: $5.00 is 125 credits, so a credit is four cents. The
// packs and their badges are quoted as the screen shows them; what the
// badges do to the price is not stated there, so nothing here assumes it.
export const OPENAI_CREDITS = {
  usdPerCredit: 5 / 125,
  minBalanceUsd: 5,
  minBalanceCredits: 125,
  packs: [
    { usd: 100, credits: 2_500, badge: "20% off" },
    { usd: 200, credits: 5_000, badge: "30% off" },
    { usd: 1_000, credits: 25_000, badge: "40% off" },
  ],
  checkedOn: "September 8, 2026",
  source: "Ryan's ChatGPT desktop app, Usage & billing",
} as const;

// Credits per million tokens for the Codex model Ryan runs, from
// learn.chatgpt.com/docs/pricing on September 7, 2026.
export const CODEX_RATES = {
  model: "GPT-6 Astra",
  creditsPerMTok: { input: 250, cached: 25, output: 1_250 },
  checkedOn: "September 7, 2026",
} as const;

// Dollars per million tokens on the OpenAI side: credits times the credit
// price. At four cents a credit that is $10 in, $1 cached, $50 out, the
// same sticker as Claude Fable 5.1 for input and output.
export function codexUsdPerMTok(): { input: number; cached: number; output: number } {
  const c = CODEX_RATES.creditsPerMTok;
  const p = OPENAI_CREDITS.usdPerCredit;
  return { input: c.input * p, cached: c.cached * p, output: c.output * p };
}

// 2. The token mix Ryan's own work burns: for every output token, the input
//    and cache-read tokens that travel with it. Read with ccusage off his Mac
//    for Aug 19 to Sep 7, 2026 (20 active days; docs/usage-receipts-2026-09.md).
//    Those are Codex and Hermes logs, because Claude Code in Cowork and
//    claude.ai keep no local log. It is the best measured mix there is, and
//    every number built on it says "estimate" until a month runs on credits.
export const MEASURED_MIX = {
  inputPerOutput: 15.9,
  cacheReadPerOutput: 291.4,
  window: "Aug 19 to Sep 7, 2026",
  activeDays: 20,
} as const;

// Measured working days from the same log, priced at the Fable 5.1 rates.
export const MEASURED_DAY_CENTS = {
  light: 4_713,
  average: 15_620,
  heavy: 27_742,
  heaviest: 61_100,
} as const;

// Ryan's stated working day for the time estimate (same report, item 14).
export const WORKING_DAY_HOURS = 8;

// Anthropic's rule of thumb: one token is about 0.75 English words.
export const WORDS_PER_TOKEN = 0.75;

// One output token with its share of input and cache reads, in dollars.
export function costPerOutputTokenUsd(): number {
  return (
    (FABLE_RATES.output +
      MEASURED_MIX.inputPerOutput * FABLE_RATES.input +
      MEASURED_MIX.cacheReadPerOutput * FABLE_RATES.cacheRead) /
    1_000_000
  );
}

export type TokenBuy = {
  outputTokens: number;
  inputTokens: number;
  cacheReadTokens: number;
  words: number;
};

export function tokensFor(amountCents: number): TokenBuy {
  const out = amountCents > 0 ? amountCents / 100 / costPerOutputTokenUsd() : 0;
  return {
    outputTokens: Math.round(out),
    inputTokens: Math.round(out * MEASURED_MIX.inputPerOutput),
    cacheReadTokens: Math.round(out * MEASURED_MIX.cacheReadPerOutput),
    words: Math.round(out * WORDS_PER_TOKEN),
  };
}

// Hours of the machine a gift buys at the measured average day.
export function machineHours(amountCents: number): number {
  return (amountCents / MEASURED_DAY_CENTS.average) * WORKING_DAY_HOURS;
}

export function machineTimeLabel(amountCents: number): string | null {
  if (!(amountCents > 0)) return null;
  const h = machineHours(amountCents);
  if (h < 1) {
    const min = Math.max(5, Math.round((h * 60) / 5) * 5);
    return `about ${min} minutes of the machine`;
  }
  if (h < WORKING_DAY_HOURS * 1.5) {
    const half = Math.round(h * 2) / 2;
    return `about ${half} ${half === 1 ? "hour" : "hours"} of the machine`;
  }
  const days = Math.max(2, Math.round(h / WORKING_DAY_HOURS));
  return `about ${days} working days of the machine`;
}

// 17,740 -> "17,700"; 5,200,000 -> "5.2M". For tables that must scan fast.
export function compactTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 100) * 100}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return Math.round(n).toLocaleString("en-US");
}

// Round words to the nearest thousand for headlines: 13,305 -> "13,000".
export function roundWords(n: number): string {
  if (n >= 10_000) return (Math.round(n / 1000) * 1000).toLocaleString("en-US");
  if (n >= 1_000) return (Math.round(n / 100) * 100).toLocaleString("en-US");
  return Math.round(n).toLocaleString("en-US");
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
