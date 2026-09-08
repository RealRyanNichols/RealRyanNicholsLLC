import { test } from "node:test";
import assert from "node:assert/strict";
import { geoContains } from "d3-geo";
import {
  LAND_PATHS,
  STATE_SHAPES,
  pingLabel,
  pingLngLat,
  pointInState,
  projectPing,
  stateFor,
} from "../lib/radar-geo";

const gilmer = {
  ping_id: "test-gilmer-tx",
  country: "US",
  region: "TX",
  city: "Gilmer",
  last_seen: "2026-09-06T00:00:00Z",
};

test("a Gilmer, TX ping plots inside Texas and outside Kansas", () => {
  const texas = stateFor("TX")!;
  const kansas = stateFor("KS")!;
  const ll = pingLngLat(gilmer);
  assert.ok(ll, "expected a coordinate for a US/TX ping");
  assert.ok(geoContains(texas.feature, ll), "point must fall inside the Texas polygon");
  assert.ok(!geoContains(kansas.feature, ll), "point must not fall inside Kansas");
  const xy = projectPing(gilmer);
  assert.ok(xy && Number.isFinite(xy[0]) && Number.isFinite(xy[1]));
});

test("placement is deterministic per ping id and differs across ids", () => {
  const a1 = pingLngLat(gilmer)!;
  const a2 = pingLngLat(gilmer)!;
  assert.deepEqual(a1, a2);
  const b = pingLngLat({ ...gilmer, ping_id: "another-session" })!;
  assert.notDeepEqual(a1, b);
});

test("every state shape yields an in-state point for many seeds", () => {
  for (const shape of STATE_SHAPES) {
    for (let i = 0; i < 12; i++) {
      const pt = pointInState(shape, `seed-${i}`);
      assert.ok(
        geoContains(shape.feature, pt),
        `${shape.name}: seed-${i} landed outside the state`,
      );
    }
  }
});

test("a US ping without a region falls back to the national centroid, never null", () => {
  const ll = pingLngLat({ ...gilmer, region: null, city: null });
  assert.ok(ll);
  assert.ok(ll[0] < -60 && ll[0] > -130 && ll[1] > 20 && ll[1] < 55);
});

test("a non-US ping uses the country centroid and an unknown country yields null", () => {
  const gb = pingLngLat({ ...gilmer, country: "GB", region: "ENG", city: "London" });
  assert.ok(gb);
  assert.ok(Math.abs(gb[0] - -1.5) < 3 && Math.abs(gb[1] - 53) < 3);
  assert.equal(pingLngLat({ ...gilmer, country: "ZZ" }), null);
  assert.equal(pingLngLat({ ...gilmer, country: null }), null);
});

test("public label is city and state only", () => {
  assert.equal(pingLabel(gilmer), "Gilmer, TX");
  assert.equal(pingLabel({ country: "US", region: "TX", city: null }), "Texas");
  assert.equal(pingLabel({ country: "US", region: null, city: null }), "United States");
  assert.equal(pingLabel({ country: "GB", region: "ENG", city: "London" }), "London, ENG · United Kingdom");
  assert.equal(pingLabel({ country: null, region: null, city: null }), "Unknown location");
});

test("no single land path is anywhere near the 120,000-character ceiling", () => {
  assert.ok(LAND_PATHS.length > 1);
  const longest = Math.max(...LAND_PATHS.map((p) => p.length));
  assert.ok(longest < 120_000, `longest land path is ${longest} chars`);
});

import { sanitizePings } from "../lib/radar-pings";

// Gilmer, TX sits near 32.73 N, 94.94 W. Rounded to a tenth of a degree, as
// the tracking route stores it, that is 32.7 / -94.9.
const gilmerFix = { ...gilmer, latitude: 32.7, longitude: -94.9 };

test("a ping with rounded coordinates lands at its town, inside its state", () => {
  const ll = pingLngLat(gilmerFix);
  assert.ok(ll);
  assert.ok(Math.abs(ll[0] - -94.9) <= 0.05 && Math.abs(ll[1] - 32.7) <= 0.05, `landed at ${ll}`);
  assert.ok(geoContains(stateFor("TX")!.feature, ll), "must stay inside Texas");
  assert.deepEqual(pingLngLat(gilmerFix), ll, "placement is deterministic");
});

test("coordinates outside the ping's own state fall back inside that state", () => {
  // 36.5 N, 97.5 W is Oklahoma. Vercel said Texas, so Texas wins.
  const ll = pingLngLat({ ...gilmer, latitude: 36.5, longitude: -97.5 });
  assert.ok(ll);
  assert.ok(geoContains(stateFor("TX")!.feature, ll), "must fall back inside Texas");
  assert.ok(!geoContains(stateFor("OK")!.feature, ll), "must not plot in Oklahoma");
});

test("a non-US ping with coordinates plots there; without them, the country centroid", () => {
  const london = pingLngLat({ ...gilmer, country: "GB", region: "ENG", city: "London", latitude: 51.5, longitude: -0.1 });
  assert.ok(london);
  assert.ok(Math.abs(london[0] - -0.1) <= 0.05 && Math.abs(london[1] - 51.5) <= 0.05);
  const noFix = pingLngLat({ ...gilmer, country: "GB", region: "ENG", city: "London", latitude: null, longitude: null });
  assert.ok(noFix);
  assert.ok(Math.abs(noFix[0] - -1.5) < 3 && Math.abs(noFix[1] - 53) < 3);
});

test("sanitizePings keeps only rounded, in-range coordinate pairs and drops the trail", () => {
  const rows = sanitizePings([
    { ping_id: "a", country: "US", region: "TX", city: "Gilmer", last_seen: "x", latitude: 32.74, longitude: -94.94, path: "/secret", pages_in_session: 9 },
    { ping_id: "b", country: "US", region: "TX", city: null, last_seen: "x", latitude: "bad", longitude: 999 },
    { ping_id: "c", country: "US", region: "TX", city: null, last_seen: "x", latitude: 32.7, longitude: null },
  ]);
  assert.equal(rows.length, 3);
  assert.deepEqual([rows[0].latitude, rows[0].longitude], [32.7, -94.9]);
  assert.ok(!("path" in rows[0]) && !("pages_in_session" in rows[0]));
  assert.deepEqual([rows[1].latitude, rows[1].longitude], [null, null]);
  assert.deepEqual([rows[2].latitude, rows[2].longitude], [null, null], "half a pair is no pair");
});
