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
