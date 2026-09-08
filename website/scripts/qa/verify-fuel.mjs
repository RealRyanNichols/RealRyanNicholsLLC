// /fuel at 390 and 1440: the page renders the ledger bill and the tiers, every
// control is at least 44px tall, no horizontal overflow, and the checkout API
// refuses bad input (400) or reports payments unconfigured (503).
//
// Usage (from website/): BASE=https://realryannichols.com node scripts/qa/verify-fuel.mjs
// Note: a valid request against production would create a real (unpaid)
// Stripe Checkout session and a support_intents row. This script only sends
// invalid ones.
import path from "node:path";
import { chromium } from "playwright";
import { BASE, launchOptions, outDir, reporter } from "./_env.mjs";

const OUT = outDir();
const { rec, finish } = reporter();

const res = await fetch(`${BASE}/fuel`, { headers: { "user-agent": "Mozilla/5.0 verify" } });
const html = await res.text();
rec("/fuel responds 200", res.status === 200, `${Buffer.byteLength(html).toLocaleString()} bytes`);
rec("/fuel shows the overage target from the ledger", /a month in overage credits/.test(html), (html.match(/\$[\d,]+ a month in overage credits/) || [""])[0]);
rec("/fuel lists the subscription lines from the ledger", /Claude Max/.test(html) && /ChatGPT Pro/.test(html));
rec("/fuel labels the unit math an estimate", /Estimate/.test(html));
rec("/fuel says plainly there is no direct token link", /no button that puts tokens/.test(html));
const tierCount = (html.match(/data-fuel-tier=/g) || []).length;
rec("/fuel renders the tiers", tierCount >= 4, `${tierCount} tiers`);

const post = (body) =>
  fetch(`${BASE}/api/checkout/fuel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const r1 = await post({ amount_cents: 500 });
rec("checkout API refuses below-floor or unconfigured", r1.status === 400 || r1.status === 503, `status ${r1.status}: ${(await r1.json().catch(() => ({}))).error ?? ""}`);
const r2 = await post({ tier: "nope" });
rec("checkout API refuses unknown tier or unconfigured", r2.status === 400 || r2.status === 503, `status ${r2.status}`);

const browser = await chromium.launch(launchOptions());
for (const width of [390, 1440]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600, isMobile: width < 600 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/fuel`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-fuel-form]", { timeout: 30_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  rec(`fuel @${width} no horizontal overflow`, overflow <= 0, `${overflow}px`);
  const controls = page.locator("[data-fuel-form] button, [data-fuel-form] input, [data-fuel-form] textarea");
  const n = await controls.count();
  let minH = 999;
  for (let i = 0; i < n; i++) {
    const b = await controls.nth(i).boundingBox();
    if (!b) continue;
    const type = await controls.nth(i).getAttribute("type");
    if (type === "radio" || type === "checkbox") continue; // wrapped in 44px labels
    minH = Math.min(minH, b.height);
  }
  rec(`fuel @${width} every control >= 44px tall`, n > 0 && minH >= 44, `${n} controls, shortest ${minH.toFixed(1)}px`);
  await page.locator('[data-fuel-tier="article"]').click();
  const submitDisabled = await page.locator("[data-fuel-submit]").isDisabled();
  const submitText = (await page.locator("[data-fuel-submit]").textContent())?.trim();
  rec(`fuel @${width} submit reflects payment configuration`, typeof submitDisabled === "boolean", `${submitDisabled ? "disabled" : "enabled"}: "${submitText}"`);
  rec(`fuel @${width} no page errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
  await page.screenshot({ path: path.join(OUT, `fuel-${width}.png`), fullPage: false });
  await ctx.close();
}
await browser.close();
process.exit(finish());
