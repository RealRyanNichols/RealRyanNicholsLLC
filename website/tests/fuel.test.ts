import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FUEL_FLOOR_CENTS,
  FUEL_MAX_CENTS,
  FUEL_MONTHLY,
  FUEL_TIME_FLOOR_CENTS,
  MEASURED_DAY_CENTS,
  WORKING_DAY_HOURS,
  compactTokens,
  costPerOutputTokenUsd,
  daysLeftInMonth,
  formatFuelMessage,
  fuelOverageCents,
  fuelOverageItems,
  fuelSubscriptionCents,
  fuelSubscriptionItems,
  machineHours,
  machineTimeLabel,
  monthName,
  parseFuelMessage,
  resolveFuelAmount,
  resolveTiers,
  roundWords,
  tierForAmount,
  timeTiers,
  tokensFor,
} from "../lib/fuel";

// The ledger as it stands after 20260908010000_fuel_ledger_overage.sql.
const LEDGER = [
  { label: "Rent", amount_cents: 140000, cadence: "monthly", is_active: true, fuel_role: null },
  { label: "Claude Max 20x", amount_cents: 21000, cadence: "monthly", is_active: true, fuel_role: "subscription" as const },
  { label: "ChatGPT Pro 20x", amount_cents: 21280, cadence: "monthly", is_active: true, fuel_role: "subscription" as const },
  { label: "X Premium Plus (Grok)", amount_cents: 4000, cadence: "monthly", is_active: true, fuel_role: "subscription" as const },
  { label: "Overage usage credits", amount_cents: 170000, cadence: "monthly", is_active: true, fuel_role: "overage" as const },
  { label: "Legal war chest — civil + criminal", amount_cents: 1000000, cadence: "one_time", is_active: true, fuel_role: null },
  // Retired: the old subscription-shaped lines, and a label that mentions
  // Claude without a role. Neither may leak into either total.
  { label: "Build tools — Claude Code, Cowork & Grok", amount_cents: 60000, cadence: "monthly", is_active: false, fuel_role: null },
  { label: "Claude credits, someday", amount_cents: 99999, cadence: "monthly", is_active: true, fuel_role: null },
];

test("subscriptions and the overage ask are split by fuel_role, never by label", () => {
  assert.equal(fuelSubscriptionItems(LEDGER).length, 3);
  assert.equal(fuelSubscriptionCents(LEDGER), 46280);
  assert.equal(fuelOverageItems(LEDGER).length, 1);
  assert.equal(fuelOverageCents(LEDGER), 170000);
});

test("the month tier is the overage target and disappears without one", () => {
  const withTarget = resolveTiers(170000);
  const month = withTarget.find((t) => t.slug === "month");
  assert.ok(month);
  assert.equal(month.amountCents, 170000);
  assert.ok(!resolveTiers(0).some((t) => t.slug === "month"));
  assert.ok(!resolveTiers(FUEL_MAX_CENTS + 1).some((t) => t.slug === "month"));
});

test("the ladder starts at $5 and $10 and a custom amount resolves to the highest tier it reaches", () => {
  const tiers = resolveTiers(170000);
  assert.deepEqual(
    tiers.map((t) => t.amountCents),
    [500, 1000, 2500, 5000, 10000, 50000, 170000],
  );
  assert.equal(tierForAmount(tiers, 499), null);
  assert.equal(tierForAmount(tiers, 999)?.slug, "spark");
  assert.equal(tierForAmount(tiers, 1999)?.slug, "charge");
  assert.equal(tierForAmount(tiers, 2500)?.slug, "research");
  const r = resolveFuelAmount(tiers, { amountCents: 7500 });
  assert.ok(r.ok);
  assert.equal(r.tier?.slug, "day");
  const big = resolveFuelAmount(tiers, { amountCents: 200000 });
  assert.ok(big.ok);
  assert.equal(big.tier?.slug, "month");
});

test("the monthly lane is a fixed amount outside the size ladder", () => {
  assert.equal(FUEL_MONTHLY.slug, "keeper");
  assert.equal(FUEL_MONTHLY.amountCents, 5000);
  assert.ok(!resolveTiers(170000).some((t) => t.slug === "keeper"));
});

test("the floor and ceiling hold, and unknown tiers are refused", () => {
  const tiers = resolveTiers(170000);
  assert.equal(resolveFuelAmount(tiers, { amountCents: FUEL_FLOOR_CENTS - 1 }).ok, false);
  assert.equal(resolveFuelAmount(tiers, { amountCents: FUEL_MAX_CENTS + 100 }).ok, false);
  assert.equal(resolveFuelAmount(tiers, { amountCents: 25.5 as unknown as number }).ok, false);
  assert.equal(resolveFuelAmount(tiers, { tier: "platinum" }).ok, false);
  const byTier = resolveFuelAmount(tiers, { tier: "article" });
  assert.ok(byTier.ok);
  assert.equal(byTier.amountCents, 50000);
});

test("one output token costs what the rate card times the measured mix says", () => {
  // $50/M out + 15.9 x $10/M in + 291.4 x $0.25/M cached = $0.00028185.
  assert.ok(Math.abs(costPerOutputTokenUsd() - 0.00028185) < 1e-8);
});

test("a dollar becomes tokens by arithmetic, never by a typed figure", () => {
  const five = tokensFor(500);
  assert.ok(five.outputTokens > 17_600 && five.outputTokens < 17_900, `${five.outputTokens}`);
  assert.ok(five.words > 13_200 && five.words < 13_400, `${five.words}`);
  assert.ok(five.inputTokens > 280_000 && five.inputTokens < 283_000);
  assert.ok(five.cacheReadTokens > 5_150_000 && five.cacheReadTokens < 5_200_000);
  const fifty = tokensFor(5000);
  assert.ok(Math.abs(fifty.outputTokens - five.outputTokens * 10) <= 5, `${fifty.outputTokens}`);
  assert.equal(tokensFor(0).outputTokens, 0);
  assert.equal(roundWords(five.words), "13,000");
  assert.equal(roundWords(tokensFor(5000).words), "133,000");
  assert.equal(compactTokens(five.cacheReadTokens), "5.2M");
  assert.equal(compactTokens(five.outputTokens), "17,700");
  assert.equal(compactTokens(950), "950");
});

test("machine time is the gift against the measured average day", () => {
  assert.equal(machineHours(MEASURED_DAY_CENTS.average), WORKING_DAY_HOURS);
  assert.equal(machineTimeLabel(500), "about 15 minutes of the machine");
  assert.equal(machineTimeLabel(1000), "about 30 minutes of the machine");
  assert.equal(machineTimeLabel(2500), "about 1.5 hours of the machine");
  assert.equal(machineTimeLabel(5000), "about 2.5 hours of the machine");
  assert.equal(machineTimeLabel(10000), "about 5 hours of the machine");
  assert.equal(machineTimeLabel(50000), "about 3 working days of the machine");
  assert.equal(machineTimeLabel(170000), "about 11 working days of the machine");
  assert.equal(machineTimeLabel(0), null);
});

test("$50 is the floor for anything that costs Ryan's time", () => {
  assert.equal(FUEL_TIME_FLOOR_CENTS, 5_000);
  const time = timeTiers(resolveTiers(170_000));
  assert.ok(time.length > 0);
  assert.ok(time.every((t) => t.amountCents >= FUEL_TIME_FLOOR_CENTS));
  assert.ok(time.some((t) => t.slug === "day"));
  assert.ok(time.some((t) => t.slug === "article"));
  assert.ok(!time.some((t) => t.slug === "spark"));
  assert.ok(!time.some((t) => t.slug === "charge"));
  assert.ok(!time.some((t) => t.slug === "research"));
  assert.ok(FUEL_MONTHLY.amountCents >= FUEL_TIME_FLOOR_CENTS);
});

test("the month meter counts the days left in UTC", () => {
  assert.equal(daysLeftInMonth(new Date("2026-09-07T12:00:00Z")), 23);
  assert.equal(daysLeftInMonth(new Date("2026-02-28T12:00:00Z")), 0);
  assert.equal(daysLeftInMonth(new Date("2028-02-28T12:00:00Z")), 1);
  assert.equal(monthName(new Date("2026-09-07T12:00:00Z")), "September");
});

test("fuel notes round-trip through the support_intents message field", () => {
  const msg = formatFuelMessage("Commission an article", "  The July 13 bodycam comparison  ");
  assert.equal(msg, "Token Fund (Commission an article): The July 13 bodycam comparison");
  assert.deepEqual(parseFuelMessage(msg), { tier: "Commission an article", ask: "The July 13 bodycam comparison" });
  assert.deepEqual(parseFuelMessage(formatFuelMessage("Spark", "")), { tier: "Spark", ask: "" });
  assert.equal(parseFuelMessage("Keep going, Ryan."), null);
  assert.equal(parseFuelMessage(null), null);
});
