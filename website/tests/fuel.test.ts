import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FUEL_FLOOR_CENTS,
  FUEL_MAX_CENTS,
  daysLeftInMonth,
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
  assert.equal(tierForAmount(tiers, 1999), null);
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
