// Phone audit at 390px across the public sitemap.
// For each page: horizontal overflow (scrollWidth > clientWidth), interactive
// controls smaller than 44x44 CSS px (visible ones only; inline links inside
// sentences are exempt), text under the 11px floor, form fields under 16px
// (iOS zooms the page when one is focused), and page errors.
//
// Usage (from website/):
//   BASE=http://localhost:3000 node scripts/qa/mobile-audit.mjs [maxPages]
//   BASE=https://realryannichols.com PATHS=/,/fuel node scripts/qa/mobile-audit.mjs
// Output: one line per page plus .qa/mobile-audit.json with the details.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { BASE, UA, launchOptions, outDir } from "./_env.mjs";

const MAX = Number(process.argv[2] || 80);
// Floors enforced by app/globals.css on phones: nothing under 11px, 44px targets.
const MIN_FONT = Number(process.env.MIN_FONT || 11);
const OUT = path.join(outDir(), "mobile-audit.json");

async function sitemapPaths() {
  if (process.env.PATHS) return process.env.PATHS.split(",").map((p) => p.trim()).filter(Boolean);
  const res = await fetch(`${BASE}/sitemap.xml`, { headers: { "user-agent": UA } });
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const paths = locs
    .map((u) => {
      try {
        return new URL(u).pathname;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  // One representative per dynamic family, all static pages.
  const seen = new Map();
  for (const p of paths) {
    const fam = p.replace(/\/[^/]+$/, (m) =>
      /^\/(posts|case\/people|case\/documents|case\/grievances|case\/events|j6|videos|store|services|fights|u|story)$/.test(
        p.slice(0, p.length - m.length),
      )
        ? "/*"
        : m,
    );
    if (!seen.has(fam)) seen.set(fam, p);
  }
  return Array.from(seen.values()).slice(0, MAX);
}

const paths = await sitemapPaths();
console.log(`auditing ${paths.length} pages at 390px against ${BASE}`);
const browser = await chromium.launch(launchOptions());
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
  userAgent: UA,
});
const report = [];
for (const p of paths) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  let status = 0;
  try {
    const resp = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    status = resp?.status() ?? 0;
    await page.waitForTimeout(1200);
  } catch (e) {
    report.push({ path: p, status, error: String(e).slice(0, 120) });
    await page.close();
    continue;
  }
  const data = await page.evaluate((minFont) => {
    const de = document.documentElement;
    const overflow = de.scrollWidth - de.clientWidth;
    const wide = [];
    if (overflow > 0) {
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > de.clientWidth + 1 && getComputedStyle(el).position !== "fixed") {
          wide.push(
            `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${String(el.className || "")
              .split(" ")
              .slice(0, 2)
              .join(".")} right=${Math.round(r.right)}`,
          );
          if (wide.length >= 5) break;
        }
      }
    }
    const small = [];
    const sel = "a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=radio], [role=tab], summary";
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.display === "none") continue;
      // Screen-reader-only and aria-hidden controls are not touch targets.
      if (el.classList.contains("sr-only") || el.getAttribute("aria-hidden") === "true") continue;
      // Native checkbox/radio inputs get their tap area from the wrapping label.
      if (el.tagName === "INPUT" && /^(checkbox|radio)$/.test(el.type) && el.closest("label")) continue;
      if (r.bottom < 0 || r.top > 4000) continue;
      // Inline text links inside sentences are exempt (WCAG inline exception).
      const inline = el.tagName === "A" && cs.display.startsWith("inline") && el.closest("p, li, td, span, h1, h2, h3, figcaption");
      if (inline) continue;
      if (r.width < 44 || r.height < 44) {
        small.push({
          tag: el.tagName.toLowerCase(),
          text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40),
          w: Math.round(r.width),
          h: Math.round(r.height),
          cls: String(el.className || "").split(" ").slice(0, 3).join(" "),
        });
        if (small.length >= 12) break;
      }
    }
    // Fields under 16px make iOS Safari zoom the page on focus.
    const zoomable = [];
    for (const el of document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16) zoomable.push({ name: el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.name || el.tagName.toLowerCase(), px: fs });
      if (zoomable.length >= 6) break;
    }
    const tiny = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    let count = 0;
    while ((node = walker.nextNode()) && count < 4000) {
      count++;
      const t = node.textContent.trim();
      if (t.length < 3) continue;
      const el = node.parentElement;
      if (!el) continue;
      // Graph labels inside the Nexus SVG scale with pinch-zoom; map labels, not UI text.
      if (el.closest("svg[data-nexus-map]")) continue;
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      if (fs < minFont && cs.visibility !== "hidden" && cs.display !== "none") {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        tiny.push({ text: t.slice(0, 40), px: Math.round(fs * 10) / 10 });
        if (tiny.length >= 8) break;
      }
    }
    return { overflow, wide, small, smallCount: small.length, tiny, tinyCount: tiny.length, zoomable, title: document.title };
  }, MIN_FONT);
  report.push({ path: p, status, ...data, errors });
  await page.close();
}
await browser.close();
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));

const bad = report.filter(
  (r) =>
    (r.overflow ?? 0) > 0 ||
    (r.smallCount ?? 0) > 0 ||
    (r.tinyCount ?? 0) > 0 ||
    (r.zoomable && r.zoomable.length) ||
    (r.errors && r.errors.length) ||
    r.error,
);
console.log(`\n${report.length} pages · ${bad.length} with findings · details in ${OUT}`);
for (const r of report) {
  const flags = [];
  if (r.error) flags.push(`ERR ${r.error}`);
  if ((r.overflow ?? 0) > 0) flags.push(`overflow ${r.overflow}px (${(r.wide || []).slice(0, 2).join("; ")})`);
  if ((r.smallCount ?? 0) > 0) flags.push(`${r.smallCount}+ small targets`);
  if ((r.tinyCount ?? 0) > 0) flags.push(`${r.tinyCount}+ text<${MIN_FONT}px`);
  if (r.zoomable && r.zoomable.length) flags.push(`${r.zoomable.length}+ fields<16px`);
  if (r.errors && r.errors.length) flags.push(`${r.errors.length} js errors`);
  console.log(`${String(r.status).padEnd(4)} ${r.path.padEnd(42)} ${flags.join(" · ") || "ok"}`);
}
process.exit(bad.length ? 1 : 0);
