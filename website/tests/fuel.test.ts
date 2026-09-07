import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FUEL_FLOOR_CENTS,
  FUEL_MAX_CENTS,
  FUEL_MONTHLY,
  FUEL_TIME_FLOOR_CENTS,
  timeTiers,
  articlesLabel,
  daysLeftInMonth,
  fuelArticlesAtPace,
  formatFuelMessage,
  fuelBillCents,
  fuelBillItems,
  fuelDuration,
  monthName,
  parseFuelMessage,
  resolveFuelAmount,
  resolveTiers,
  tierForAmount,
} from "../lib/fuel";

const LEDGER = [
  { label: "Rent", amount_cents: 140000, cadence: "monthly", is_active: true },
  { label: "Build tools — Claude Code, Cowork & Grok", amount_cents: 60000, cadence: "monthly", is_active: true },
  { label: "Research — ChatGPT & Codex", amount_cents: 50000, cadence: "monthly", is_active: true },
  { label: "Extra Claude credits + buffer", amount_cents: 20000, cadence: "monthly", is_active: true },
  { label: "Legal war chest — civil + criminal", amount_cents: 1000000, cadence: "one_time", is_active: true },
  { label: "Old Claude line", amount_cents: 99999, cadence: "monthly", is_active: false },
];

test("the AI bill is the sum of the active monthly AI line items in the ledger", () => {
  assert.equal(fuelBillItems(LEDGER).length, 3);
  assert.equal(fuelBillCents(LEDGER), 130000);
});

test("the month tier takes its amount from the ledger and disappears without one", () => {
  const withBill = resolveTiers(130000);
  const month = withBill.find((t) => t.slug === "month");
  assert.ok(month);
  assert.equal(month.amountCents, 130000);
  assert.ok(!resolveTiers(0).some((t) => t.slug === "month"));
  assert.ok(!resolveTiers(FUEL_MAX_CENTS + 1).some((t) => t.slug === "month"));
});

test("a custom amount resolves to the highest tier it reaches", () => {
  const tiers = resolveTiers(130000);
  const r = resolveFuelAmount(tiers, { amountCents: 7500 });
  assert.ok(r.ok);
  assert.equal(r.tier?.slug, "day");
  const big = resolveFuelAmount(tiers, { amountCents: 200000 });
  assert.ok(big.ok);
  assert.equal(big.tier?.slug, "month");
  assert.equal(tierForAmount(tiers, 1999)?.slug, "spark");
  assert.equal(tierForAmount(tiers, 499), null);
});

test("the monthly lane is a fixed amount outside the size ladder", () => {
  assert.equal(FUEL_MONTHLY.slug, "keeper");
  assert.equal(FUEL_MONTHLY.amountCents, 5000);
  assert.ok(!resolveTiers(130000).some((t) => t.slug === "keeper"));
});

test("articles at pace come from the real bill and the real post count", () => {
  // 227 posts on a $1,300 bill: about $5.73 an article.
  assert.equal(articlesLabel(fuelArticlesAtPace(500, 130000, 227)), "about 1 article");
  assert.equal(articlesLabel(fuelArticlesAtPace(2000, 130000, 227)), "about 3 articles");
  assert.equal(articlesLabel(fuelArticlesAtPace(50000, 130000, 227)), "about 87 articles");
  assert.equal(fuelArticlesAtPace(2000, 130000, null), null);
  assert.equal(fuelArticlesAtPace(2000, 0, 227), null);
  assert.equal(articlesLabel(fuelArticlesAtPace(100, 130000, 227)), "part of an article");
});

test("the floor and ceiling hold, and unknown tiers are refused", () => {
  const tiers = resolveTiers(130000);
  assert.equal(resolveFuelAmount(tiers, { amountCents: FUEL_FLOOR_CENTS - 1 }).ok, false);
  assert.equal(resolveFuelAmount(tiers, { amountCents: FUEL_MAX_CENTS + 100 }).ok, false);
  assert.equal(resolveFuelAmount(tiers, { amountCents: 25.5 as unknown as number }).ok, false);
  assert.equal(resolveFuelAmount(tiers, { tier: "platinum" }).ok, false);
  const byTier = resolveFuelAmount(tiers, { tier: "article" });
  assert.ok(byTier.ok);
  assert.equal(byTier.amountCents, 50000);
});

test("a gift is measured in machine time against the real bill, never a typed number", () => {
  const bill = 130000; // $1,300 a month => $43.33 a day
  assert.equal(fuelDuration(500, bill), "about 3 hours of the machine");
  assert.equal(fuelDuration(2000, bill), "about 11 hours of the machine");
  assert.equal(fuelDuration(5000, bill), "about a day of the machine");
  assert.equal(fuelDuration(10000, bill), "about 2 days of the machine");
  assert.equal(fuelDuration(50000, bill), "about 12 days of the machine");
  assert.equal(fuelDuration(130000, bill), "a full month of the machine");
  assert.equal(fuelDuration(2000, 0), null);
  assert.equal(fuelDuration(0, bill), null);
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

test("$50 is the floor for anything that costs Ryan's time", () => {
  assert.equal(FUEL_TIME_FLOOR_CENTS, 5_000);
  const tiers = resolveTiers(130_000);
  const time = timeTiers(tiers);
  assert.ok(time.length > 0);
  assert.ok(time.every((t) => t.amountCents >= FUEL_TIME_FLOOR_CENTS));
  assert.ok(time.some((t) => t.slug === "day"));
  assert.ok(time.some((t) => t.slug === "article"));
  assert.ok(!time.some((t) => t.slug === "spark"));
  assert.ok(!time.some((t) => t.slug === "shift"));
  assert.ok(FUEL_MONTHLY.amountCents >= FUEL_TIME_FLOOR_CENTS);
});
