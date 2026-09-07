// Map Room standard applied to /case/nexus and /case/geography at 390 and 1440:
// controls >= 44px, one finger on the graph pans without scrolling the page,
// one finger off it scrolls, wheel over the graph zooms without page scroll,
// HTML weight and longest path attribute, geography paths render on the client.
//
// Usage (from website/): BASE=https://realryannichols.com node scripts/qa/verify-nexus.mjs
import path from "node:path";
import { chromium } from "playwright";
import { BASE, launchOptions, outDir, reporter } from "./_env.mjs";

const OUT = outDir();
const { rec, finish } = reporter();

async function raw(p) {
  const res = await fetch(`${BASE}${p}`, { headers: { "user-agent": "Mozilla/5.0 verify" } });
  const html = await res.text();
  const ds = [...html.matchAll(/\sd="([^"]*)"/g)].map((m) => m[1].length);
  return { status: res.status, bytes: Buffer.byteLength(html), dAttrs: ds.length, longest: ds.length ? Math.max(...ds) : 0 };
}

for (const p of ["/case/nexus", "/case/geography"]) {
  const r = await raw(p);
  rec(`${p} HTML < 250,000 bytes`, r.status === 200 && r.bytes < 250_000, `${r.bytes.toLocaleString()} bytes (status ${r.status})`);
  rec(`${p} no d= over 120,000`, r.longest <= 120_000, `${r.dAttrs} d attributes, longest ${r.longest.toLocaleString()}`);
}
const browser = await chromium.launch(launchOptions());
for (const width of [390, 1440]) {
  const mobile = width < 600;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, hasTouch: mobile, isMobile: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/case/nexus`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-nexus-map]", { timeout: 30_000 });
  await page.waitForTimeout(2500);
  const svg = page.locator("[data-nexus-map]");
  const box = await svg.boundingBox();
  await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 40)), box.y);
  await page.waitForTimeout(300);
  const box2 = await svg.boundingBox();

  const buttons = page.locator("[data-nexus-controls] button");
  const n = await buttons.count();
  let minW = 999;
  let minH = 999;
  for (let i = 0; i < n; i++) {
    const b = await buttons.nth(i).boundingBox();
    if (!b || b.width === 0) continue;
    minW = Math.min(minW, b.width);
    minH = Math.min(minH, b.height);
  }
  rec(`nexus @${width} map controls >= 44x44`, n > 0 && minW >= 44 && minH >= 44, `${n} controls, smallest ${minW.toFixed(1)}x${minH.toFixed(1)}`);

  const getT = () => page.evaluate(() => document.querySelector("[data-nexus-map] > g")?.getAttribute("transform") ?? "");
  const scrollY = () => page.evaluate(() => window.scrollY);
  const cx = box2.x + box2.width / 2;
  const cy = box2.y + box2.height / 2;

  if (mobile) {
    const client = await ctx.newCDPSession(page);
    const t0 = await getT();
    const s0 = await scrollY();
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy }] });
    for (let i = 1; i <= 8; i++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy - i * 15 }] });
      await page.waitForTimeout(16);
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(300);
    rec(`nexus @${width} one finger on the graph pans`, (await getT()) !== t0, `${t0} -> ${await getT()}`);
    rec(`nexus @${width} one finger on the graph does not scroll the page`, (await scrollY()) === s0, `scrollY ${s0} -> ${await scrollY()}`);
    const s1 = await scrollY();
    const offY = Math.min(box2.y + box2.height + 60, 820);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: offY }] });
    for (let i = 1; i <= 10; i++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: offY - i * 20 }] });
      await page.waitForTimeout(16);
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(500);
    rec(`nexus @${width} one finger off the graph scrolls the page`, (await scrollY()) > s1, `scrollY ${s1} -> ${await scrollY()}`);
  } else {
    const t0 = await getT();
    const s0 = await scrollY();
    await page.mouse.move(cx, cy);
    await page.mouse.wheel(0, -240);
    await page.waitForTimeout(300);
    const scale = (t) => Number((t || "").match(/scale\(([\d.]+)\)/)?.[1] ?? 1);
    rec(`nexus @${width} wheel over the graph zooms`, scale(await getT()) > scale(t0), `${t0} -> ${await getT()}`);
    rec(`nexus @${width} wheel over the graph does not scroll the page`, (await scrollY()) === s0, `scrollY ${s0} -> ${await scrollY()}`);
    const t1 = await getT();
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 80, cy + 30, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    rec(`nexus @${width} mouse drag pans`, (await getT()) !== t1);
  }
  rec(`nexus @${width} no page errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
  await page.screenshot({ path: path.join(OUT, `nexus-${width}.png`) });

  await page.goto(`${BASE}/case/geography`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-geo-map] path", { timeout: 30_000 });
  const paths = await page.locator("[data-geo-map] path").count();
  rec(`geography @${width} state paths render on the client`, paths >= 50, `${paths} paths`);
  await ctx.close();
}
await browser.close();
process.exit(finish());
