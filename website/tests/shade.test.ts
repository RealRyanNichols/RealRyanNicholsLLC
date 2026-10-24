import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { SHADE_ARMS, SHADE_BOOT_SCRIPT, SHADES, isShade } from "../lib/shade";
import { engagedRateZ, scoreShades, shadeOf, type ShadeLine } from "../lib/shade-report";

// Runs the inline <head> script against a fake document and returns the
// shade it set plus the cookie it wrote.
function boot(opts: { cookie?: string; search?: string; random?: number }) {
  let written = opts.cookie ?? "";
  const attrs: Record<string, string> = {};
  const document = {
    get cookie() {
      return written;
    },
    set cookie(value: string) {
      written = value;
    },
    documentElement: {
      setAttribute(name: string, value: string) {
        attrs[name] = value;
      },
    },
  };
  const math = Object.create(Math) as Math;
  math.random = () => opts.random ?? 0;
  runInNewContext(SHADE_BOOT_SCRIPT, {
    document,
    location: { search: opts.search ?? "" },
    URLSearchParams,
    Math: math,
  });
  return { shade: attrs["data-shade"], cookie: written };
}

test("every test arm is a shade the site can render", () => {
  for (const arm of SHADE_ARMS) assert.ok((SHADES as readonly string[]).includes(arm));
  assert.ok(isShade("dusk"));
  assert.ok(isShade("theater"));
  assert.ok(!isShade("neon"));
});

test("a new visitor is drawn into an arm and the draw is remembered", () => {
  const low = boot({ random: 0 });
  const high = boot({ random: 0.99 });
  assert.equal(low.shade, "theater");
  assert.equal(high.shade, "dusk");
  assert.match(high.cookie, /^rrn_shade=dusk; Max-Age=\d+; Path=\/; SameSite=Lax$/);
});

test("a returning visitor keeps their shade", () => {
  assert.equal(boot({ cookie: "a=1; rrn_shade=dusk", random: 0 }).shade, "dusk");
});

test("?shade= previews any shade, unknown values are ignored, reset redraws", () => {
  assert.equal(boot({ cookie: "rrn_shade=theater", search: "?shade=dusk", random: 0 }).shade, "dusk");
  assert.equal(boot({ cookie: "rrn_shade=dusk", search: "?shade=neon" }).shade, "dusk");
  assert.equal(boot({ cookie: "rrn_shade=dusk", search: "?shade=reset", random: 0 }).shade, "theater");
  assert.equal(boot({ cookie: "rrn_shade=bogus", random: 0.99 }).shade, "dusk");
});

test("exposure targets parse to a shade", () => {
  assert.equal(shadeOf('{"shade":"dusk"}'), "dusk");
  assert.equal(shadeOf('{"shade":"neon"}'), null);
  assert.equal(shadeOf("not json"), null);
  assert.equal(shadeOf(null), null);
});

test("only engaged sessions are scored, each session in its first shade", () => {
  const t0 = "2026-10-14T10:00:00.000Z";
  const at = (s: number) => new Date(Date.parse(t0) + s * 1000).toISOString();
  const lines = scoreShades(
    [
      { session_id: "a", target: '{"shade":"theater"}' },
      { session_id: "a", target: '{"shade":"dusk"}' }, // later preview, ignored
      { session_id: "b", target: '{"shade":"theater"}' },
      { session_id: "c", target: '{"shade":"dusk"}' },
      { session_id: "d", target: '{"shade":"dusk"}' },
    ],
    [
      { session_id: "a", started_at: t0, last_activity_at: at(40), scroll_max: 80 },
      { session_id: "a", started_at: t0, last_activity_at: at(20), scroll_max: 10 },
      { session_id: "b", started_at: t0, last_activity_at: at(2), scroll_max: 100 }, // bot-like
      { session_id: "c", started_at: t0, last_activity_at: at(3), scroll_max: 0 },
      { session_id: "zz", started_at: t0, last_activity_at: at(500), scroll_max: 0 }, // not in test
    ],
    [
      { session_id: "c", kind: "video_play" }, // engaged by a play despite 3s
      { session_id: "c", kind: "subscribe_success" },
      { session_id: "a", kind: "click" },
    ],
  );
  const theater = lines.find((l) => l.shade === "theater")!;
  const dusk = lines.find((l) => l.shade === "dusk")!;
  assert.equal(theater.sessions, 2);
  assert.equal(theater.engaged, 1);
  assert.equal(theater.pagesPerEngaged, 2);
  assert.equal(theater.medianDwellEngaged, 60);
  assert.equal(theater.scroll75Rate, 1);
  assert.equal(theater.clicksPer100, 100);
  assert.equal(dusk.sessions, 2);
  assert.equal(dusk.engaged, 1);
  assert.equal(dusk.videoPlaysPer100, 100);
  assert.equal(dusk.conversions, 1);
});

function line(shade: "theater" | "dusk", sessions: number, engaged: number): ShadeLine {
  return {
    shade,
    sessions,
    engaged,
    engagedRate: engaged / sessions,
    pagesPerEngaged: 1,
    medianDwellEngaged: 0,
    scroll75Rate: 0,
    clicksPer100: 0,
    videoPlaysPer100: 0,
    conversions: 0,
  };
}

test("the z-test waits for enough sessions, then measures the gap", () => {
  assert.equal(engagedRateZ(line("theater", 50, 10), line("dusk", 50, 20)), null);
  const z = engagedRateZ(line("theater", 1000, 100), line("dusk", 1000, 150));
  assert.ok(z !== null && z > 1.96, `expected a clear dusk win, got ${z}`);
  const tie = engagedRateZ(line("theater", 1000, 100), line("dusk", 1000, 104));
  assert.ok(tie !== null && Math.abs(tie) < 1.96);
});
