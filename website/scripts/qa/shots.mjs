// Screenshots (top of page and bottom of page) for a visual pass.
//
// Usage (from website/):
//   BASE=https://realryannichols.com node scripts/qa/shots.mjs / /fuel /case/timeline
//   WIDTH=1440 node scripts/qa/shots.mjs /
// PNGs land in .qa/shots/<width>/.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { BASE, UA, launchOptions, outDir } from "./_env.mjs";

const WIDTH = Number(process.env.WIDTH || 390);
const mobile = WIDTH < 600;
const OUT = path.join(outDir(), "shots", String(WIDTH));
fs.mkdirSync(OUT, { recursive: true });
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ["/", "/case/timeline", "/fuel", "/the-harassment"];

const browser = await chromium.launch(launchOptions());
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: mobile ? 844 : 900 },
  hasTouch: mobile,
  isMobile: mobile,
  deviceScaleFactor: mobile ? 2 : 1,
  userAgent: mobile ? UA : undefined,
});
for (const p of pages) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1500);
  const name = p === "/" ? "home" : p.replace(/^\//, "").replace(/\//g, "_");
  await page.screenshot({ path: `${OUT}/${name}-top.png`, fullPage: false });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}-bottom.png`, fullPage: false });
  console.log("shot", `${OUT}/${name}-{top,bottom}.png`);
  await page.close();
}
await browser.close();
