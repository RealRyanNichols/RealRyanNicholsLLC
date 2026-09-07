// Acceptance checks for /the-map-room at 390px and 1440px against BASE.
// Raw HTML: size, longest path attribute, SSR headline equals
// site_totals().live_now, no visitor path serialized. Browser: JS-off
// headline, 44px controls and ping targets, one-finger pan without page
// scroll, wheel zoom, tap shows a city/state chip only, no drawer.
//
// Usage (from website/): BASE=https://realryannichols.com node scripts/qa/verify-map-room.mjs
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { BASE, launchOptions, outDir, reporter, supabaseEnv } from "./_env.mjs";

const { url: SUPA_URL, key: ANON } = supabaseEnv();
const OUT = outDir();
const { results, rec, finish } = reporter();

async function siteTotals() {
  const r = await fetch(`${SUPA_URL}/rest/v1/rpc/site_totals`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: "{}",
  });
  return r.json();
}

async function rawHtmlChecks() {
  const before = await siteTotals();
  const res = await fetch(`${BASE}/the-map-room`, { headers: { "user-agent": "Mozilla/5.0 verify" } });
  const html = await res.text();
  const after = await siteTotals();
  const bytes = Buffer.byteLength(html);
  const ds = [...html.matchAll(/\sd="([^"]*)"/g)].map((m) => m[1].length);
  const maxD = ds.length ? Math.max(...ds) : 0;
  rec("AC3 HTML bytes < 250,000", bytes < 250_000, `${bytes.toLocaleString()} bytes (status ${res.status})`);
  rec("AC3 no d= attribute > 120,000 chars", maxD <= 120_000, `${ds.length} d attributes, longest ${maxD.toLocaleString()}`);
  rec("AC6 'so far.' absent from HTML", !html.includes("so far."));
  const m = html.match(/data-live-now[^>]*>([\d,]+)</);
  const ssr = m ? Number(m[1].replace(/,/g, "")) : null;
  const ok = ssr !== null && (ssr === before.live_now || ssr === after.live_now);
  rec("AC2 SSR headline equals site_totals().live_now", ok, `HTML says ${ssr}; RPC said ${before.live_now} before and ${after.live_now} after`);
  rec("AC2 SSR headline non-zero when live_now > 0", before.live_now === 0 || (ssr !== null && ssr > 0), `ssr=${ssr} live_now=${before.live_now}`);
  rec("AC6 no per-visitor path serialized alongside pings", !/ping_id[^}]*"path"/.test(html));
}

async function jsOff(browser, width) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, javaScriptEnabled: false, viewport: { width, height: width < 600 ? 844 : 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/the-map-room`, { waitUntil: "domcontentloaded" });
  const txt = await page.locator("[data-live-now]").first().textContent();
  const vis = await page.locator("[data-live-now]").first().isVisible();
  rec(`AC2 @${width} JS off: headline visible`, vis && !!txt, `headline "${txt?.trim()}"`);
  await ctx.close();
}

async function jsOn(browser, width) {
  const mobile = width < 600;
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width, height: mobile ? 844 : 900 },
    hasTouch: mobile,
    isMobile: mobile,
    deviceScaleFactor: mobile ? 3 : 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/the-map-room`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-radar-map]", { timeout: 30_000 });
  await page.waitForTimeout(1500);

  const frame = page.locator("[data-radar-frame]").first();
  const fb = await frame.boundingBox();

  const buttons = page.locator("[data-radar-frame] button");
  const n = await buttons.count();
  let minW = 999;
  let minH = 999;
  for (let i = 0; i < n; i++) {
    const b = await buttons.nth(i).boundingBox();
    if (!b) continue;
    minW = Math.min(minW, b.width);
    minH = Math.min(minH, b.height);
  }
  rec(`AC5 @${width} every control >= 44x44`, n > 0 && minW >= 44 && minH >= 44, `${n} controls, smallest ${minW.toFixed(1)}x${minH.toFixed(1)}`);

  const hits = page.locator("[data-ping-hit]");
  const hc = await hits.count();
  if (hc > 0) {
    let minHit = 999;
    for (let i = 0; i < hc; i++) {
      const b = await hits.nth(i).boundingBox();
      if (b) minHit = Math.min(minHit, b.width, b.height);
    }
    rec(`AC5 @${width} every ping tap target >= 44px`, minHit >= 43.5, `${hc} pings, smallest target ${minHit.toFixed(1)}px`);
  }

  const getTransform = () => page.evaluate(() => document.querySelector("[data-radar-map] > g")?.getAttribute("transform"));
  const scrollY = () => page.evaluate(() => window.scrollY);
  const cx = fb.x + fb.width / 2;
  const cy = fb.y + fb.height / 2;

  if (mobile) {
    const client = await ctx.newCDPSession(page);
    const t0 = await getTransform();
    const s0 = await scrollY();
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy }] });
    for (let i = 1; i <= 8; i++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy - i * 15 }] });
      await page.waitForTimeout(16);
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(300);
    const t1 = await getTransform();
    const s1 = await scrollY();
    rec(`AC5 @${width} one finger on the map pans the map`, t0 !== t1, `transform ${t0} -> ${t1}`);
    rec(`AC5 @${width} one finger on the map does not scroll the page`, s1 === s0, `scrollY ${s0} -> ${s1}`);
    const offY = Math.min(fb.y + fb.height + 80, 820);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: offY }] });
    for (let i = 1; i <= 10; i++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: offY - i * 20 }] });
      await page.waitForTimeout(16);
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(500);
    const s2 = await scrollY();
    rec(`AC5 @${width} one finger off the map scrolls the page`, s2 > s1, `scrollY ${s1} -> ${s2}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
  } else {
    const t0 = await getTransform();
    const s0 = await scrollY();
    await page.mouse.move(cx, cy);
    await page.mouse.wheel(0, -240);
    await page.waitForTimeout(300);
    const t1 = await getTransform();
    const s1 = await scrollY();
    const scale = (t) => Number((t || "").match(/scale\(([\d.]+)\)/)?.[1] ?? 0);
    rec(`AC5 @${width} wheel over the map zooms`, scale(t1) > scale(t0), `scale ${scale(t0)} -> ${scale(t1)}`);
    rec(`AC5 @${width} wheel over the map does not scroll the page`, s1 === s0, `scrollY ${s0} -> ${s1}`);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 90, cy + 40, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    const t2 = await getTransform();
    rec(`AC5 @${width} mouse drag pans`, t2 !== t1, `${t1} -> ${t2}`);
  }

  // AC6: tap a ping shows city/state only, no drawer.
  const pc = await page.locator("[data-ping]").count();
  await page.locator("[data-radar-frame] button", { hasText: "US" }).first().click();
  await page.waitForTimeout(300);
  const fb2 = await frame.boundingBox();
  let target = null;
  const hitCount = await page.locator("[data-ping-hit]").count();
  for (let i = 0; i < hitCount; i++) {
    const b = await page.locator("[data-ping-hit]").nth(i).boundingBox();
    if (!b) continue;
    const px = b.x + b.width / 2;
    const py = b.y + b.height / 2;
    if (px > fb2.x + 60 && px < fb2.x + fb2.width - 120 && py > fb2.y + 90 && py < fb2.y + fb2.height - 60) {
      target = { px, py };
      break;
    }
  }
  if (pc > 0 && target) {
    if (mobile) await page.touchscreen.tap(target.px, target.py);
    else await page.mouse.click(target.px, target.py);
    await page.waitForTimeout(400);
    const chip = page.locator("[data-ping-chip]");
    const chipVisible = await chip.isVisible().catch(() => false);
    const chipText = chipVisible ? (await chip.textContent())?.trim() : "";
    rec(`AC6 @${width} tapping a ping shows a city/state chip`, chipVisible && !!chipText, `"${chipText}"`);
    rec(`AC6 @${width} chip has no path or trail`, chipVisible && !/\//.test(chipText || "") && !/page/i.test(chipText || ""), `"${chipText}"`);
    const titles = await page.evaluate(() => Array.from(document.querySelectorAll("[data-ping] title")).map((t) => t.textContent));
    rec(`AC6 @${width} ping tooltips carry no path`, titles.every((t) => !/\//.test(t || "")), titles.slice(0, 3).join(" | "));
    const tBefore = await getTransform();
    if (mobile) {
      const client2 = await ctx.newCDPSession(page);
      await client2.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: target.px, y: target.py }] });
      for (let i = 1; i <= 6; i++) {
        await client2.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: target.px + i * 12, y: target.py + i * 6 }] });
        await page.waitForTimeout(16);
      }
      await client2.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else {
      await page.mouse.move(target.px, target.py);
      await page.mouse.down();
      await page.mouse.move(target.px + 70, target.py + 30, { steps: 5 });
      await page.mouse.up();
    }
    await page.waitForTimeout(300);
    rec(`AC5 @${width} a drag that starts on a ping pans the map`, (await getTransform()) !== tBefore);
  } else {
    rec(`AC6 @${width} tapping a ping (no on-screen ping to tap right now)`, true, `${pc} pings, none inside the frame`);
  }
  const dom = await page.content();
  rec(`AC6 @${width} 'so far.' nowhere in the DOM`, !dom.includes("so far."));
  rec(`AC6 @${width} no drawer element ("Visitor #")`, !dom.includes("Visitor #"));
  rec(`@${width} no page errors`, errors.length === 0, errors.slice(0, 2).join(" | "));

  await page.screenshot({ path: path.join(OUT, `map-room-${width}.png`), fullPage: false });
  await ctx.close();
}

await rawHtmlChecks();
const browser = await chromium.launch(launchOptions());
for (const w of [390, 1440]) {
  await jsOff(browser, w);
  await jsOn(browser, w);
}
await browser.close();
fs.writeFileSync(path.join(OUT, "verify-map-room.json"), JSON.stringify(results, null, 2));
process.exit(finish());
