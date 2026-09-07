// Load one page at 390px and print every console error and warning. Against
// `next dev` the React hydration diff is printed in full instead of the
// minified #418, which is how the /case/timeline SVG <title> bug was found.
//
// Usage: BASE=http://localhost:3001 node scripts/qa/hydration.mjs /case/timeline
import { chromium } from "playwright";
import { BASE, UA, launchOptions } from "./_env.mjs";

const target = process.argv[2] || "/case/timeline";
const browser = await chromium.launch(launchOptions());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, userAgent: UA });
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") logs.push(`[${m.type()}] ${m.text().slice(0, 1800)}`);
});
page.on("pageerror", (e) => logs.push(`[pageerror] ${String(e).slice(0, 1800)}`));
await page.goto(`${BASE}${target}`, { waitUntil: "domcontentloaded", timeout: 180_000 });
await page.waitForTimeout(6000);
// The Vercel insights and speed-insights scripts 404 on localhost, and Next
// preloads a stylesheet it may not use right away; none of that is a page bug.
const real = logs.filter((l) => !/_vercel\/|404 \(Not Found\)|was preloaded using link preload/.test(l));
console.log(real.length ? real.join("\n\n") : "no console errors/warnings");
await browser.close();
process.exit(real.length ? 1 : 0);
