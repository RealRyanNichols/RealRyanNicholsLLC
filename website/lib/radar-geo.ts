// Geometry for the live visitor radar (Map Room + Situation Room).
//
// One Equal Earth projection over Natural Earth 110m land, with US state
// outlines from us-atlas so a visitor's state (which Vercel supplies as a
// two-letter region code) plots inside the right state instead of at the
// national centroid. Nothing here invents coordinates: state and country
// shapes come from the shipped atlases, country centroids from
// lib/country-coords.ts, and the only "randomness" is a deterministic hash of
// the ping id so a session keeps the same dot between polls.
//
// This module is imported by client components only (and by tests). Keep it
// out of server components: the atlases are ~170KB of JSON.
import {
  geoArea,
  geoBounds,
  geoCentroid,
  geoContains,
  geoEqualEarth,
  geoPath,
} from "d3-geo";
import { feature } from "topojson-client";
import landJson from "world-atlas/land-110m.json";
import statesJson from "us-atlas/states-10m.json";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, FeatureCollection, GeometryObject } from "geojson";
import { COUNTRY_COORDS } from "./country-coords";
import type { RadarPing } from "./radar-pings";

export const RADAR_W = 1000;
export const RADAR_H = 500;

// ─── Land ──────────────────────────────────────────────────────────────
const landTopo = landJson as unknown as Topology<{ land: GeometryCollection }>;
const landRaw = feature(landTopo, landTopo.objects.land) as
  | Feature<GeometryObject>
  | FeatureCollection<GeometryObject>;
const landFC: FeatureCollection<GeometryObject> =
  landRaw.type === "FeatureCollection"
    ? landRaw
    : { type: "FeatureCollection", features: [landRaw] };

export const PROJECTION = geoEqualEarth().fitExtent(
  [
    [4, 4],
    [RADAR_W - 4, RADAR_H - 4],
  ],
  landFC,
);
const PATH_GEN = geoPath(PROJECTION);

// One SVG path string per land polygon so no single `d` attribute balloons.
export const LAND_PATHS: string[] = landFC.features.flatMap((f) => {
  if (f.geometry.type === "MultiPolygon") {
    return (f.geometry.coordinates as number[][][][])
      .map((coords) => PATH_GEN({ type: "Polygon", coordinates: coords } as GeometryObject))
      .filter((p): p is string => !!p);
  }
  const p = PATH_GEN(f);
  return p ? [p] : [];
});

// ─── US states ─────────────────────────────────────────────────────────
type StateProps = { name: string };
const statesTopo = statesJson as unknown as Topology<{
  states: GeometryCollection<StateProps>;
}>;
const statesFC = feature(statesTopo, statesTopo.objects.states) as FeatureCollection<
  GeometryObject,
  StateProps
>;

// USPS code → the name us-atlas uses. Standard postal abbreviations; the
// atlas keys states by name, Vercel keys them by code.
export const STATE_NAME_BY_CODE: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico",
  GU: "Guam", VI: "United States Virgin Islands", AS: "American Samoa",
  MP: "Commonwealth of the Northern Mariana Islands",
};

const STATE_BY_NAME = new Map<string, Feature<GeometryObject, StateProps>>();
for (const f of statesFC.features) STATE_BY_NAME.set(f.properties.name, f);

export type StateShape = {
  code: string;
  name: string;
  feature: Feature<GeometryObject, StateProps>;
  // The largest polygon of the state (mainland for Michigan, the Big Island
  // for Hawaii). Dots are placed inside this so a state whose centroid sits
  // in water — Hawaii, Alaska's archipelago — still plots on its own land.
  mainland: GeometryObject;
  path: string;
};

function largestPolygon(geometry: GeometryObject): GeometryObject {
  if (geometry.type !== "MultiPolygon") return geometry;
  let best: GeometryObject = geometry;
  let bestArea = -1;
  for (const coords of geometry.coordinates) {
    const poly = { type: "Polygon", coordinates: coords } as GeometryObject;
    const area = geoArea(poly);
    if (area > bestArea) {
      bestArea = area;
      best = poly;
    }
  }
  return best;
}

export const STATE_SHAPES: StateShape[] = Object.entries(STATE_NAME_BY_CODE)
  .map(([code, name]) => {
    const f = STATE_BY_NAME.get(name);
    if (!f) return null;
    const path = PATH_GEN(f);
    return path ? { code, name, feature: f, mainland: largestPolygon(f.geometry), path } : null;
  })
  .filter((s): s is StateShape => s !== null);

const STATE_BY_CODE = new Map(STATE_SHAPES.map((s) => [s.code, s]));

export function stateFor(region: string | null | undefined): StateShape | null {
  if (!region) return null;
  return STATE_BY_CODE.get(region.trim().toUpperCase()) ?? null;
}

// ─── Deterministic placement ───────────────────────────────────────────
// A tiny string hash so the same ping id always lands on the same dot.
function hash32(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// Two unit-interval numbers derived from (seed, attempt).
function unit2(seed: string, attempt: number): [number, number] {
  const a = hash32(`${seed}:${attempt}:a`) / 0xffffffff;
  const b = hash32(`${seed}:${attempt}:b`) / 0xffffffff;
  return [a, b];
}

export type { RadarPing } from "./radar-pings";
export { sanitizePings } from "./radar-pings";

// A point that is provably inside the state's largest polygon: sample
// deterministic offsets around that polygon's centroid, widening each round,
// and keep the first one geoContains accepts. If none lands (a thin or
// crescent shape) fall back to sampling the polygon's bounding box, then to
// the centroid itself, so the dot is never outside the state it belongs to.
export function pointInState(shape: StateShape, seed: string): [number, number] {
  const poly = shape.mainland;
  const c = geoCentroid(poly);
  const [[minLng, minLat], [maxLng, maxLat]] = geoBounds(poly);
  let spanLng = maxLng - minLng;
  if (spanLng < 0) spanLng += 360; // Alaska's mainland crosses the antimeridian
  const spanLat = maxLat - minLat;

  for (let attempt = 0; attempt < 24; attempt++) {
    const [a, b] = unit2(seed, attempt);
    // Widen from a third of the span out to the full span.
    const spread = 0.35 + (attempt / 24) * 0.65;
    const lng = c[0] + (a - 0.5) * spanLng * spread;
    const lat = c[1] + (b - 0.5) * spanLat * spread;
    if (geoContains(poly, [lng, lat])) return [lng, lat];
  }
  if (geoContains(poly, c)) return c;
  for (let attempt = 24; attempt < 200; attempt++) {
    const [a, b] = unit2(seed, attempt);
    const lng = minLng + a * spanLng;
    const lat = minLat + b * spanLat;
    if (geoContains(poly, [lng, lat])) return [lng, lat];
  }
  return c;
}

// Country-level fallback: the centroid from lib/country-coords plus a small
// deterministic jitter so several sessions in one country do not stack.
function pointInCountry(code: string, seed: string): [number, number] | null {
  const meta = COUNTRY_COORDS[code.toUpperCase()];
  if (!meta) return null;
  const [a, b] = unit2(seed, 0);
  return [meta.lng + (a - 0.5) * 4, meta.lat + (b - 0.5) * 3];
}

// Longitude/latitude for a ping: inside its US state when the region is
// known, otherwise at the country centroid. Null when the country is unknown.
export function pingLngLat(p: RadarPing): [number, number] | null {
  const country = p.country?.toUpperCase() ?? null;
  if (!country) return null;
  if (country === "US") {
    const shape = stateFor(p.region);
    if (shape) return pointInState(shape, p.ping_id);
  }
  return pointInCountry(country, p.ping_id);
}

export function projectPing(p: RadarPing): [number, number] | null {
  const ll = pingLngLat(p);
  if (!ll) return null;
  return PROJECTION(ll) ?? null;
}

export function projectLngLat(lng: number, lat: number): [number, number] | null {
  return PROJECTION([lng, lat]) ?? null;
}

// The public label for a ping: city and state only. Never the path, never
// the session, never how many pages they have read.
export function pingLabel(p: Pick<RadarPing, "country" | "region" | "city">): string {
  const country = p.country?.toUpperCase() ?? null;
  const city = p.city?.trim() || null;
  const region = p.region?.trim() || null;
  if (country === "US") {
    const stateName = region ? STATE_NAME_BY_CODE[region.toUpperCase()] ?? region : null;
    if (city && stateName) return `${city}, ${region!.toUpperCase()}`;
    if (stateName) return stateName;
    return "United States";
  }
  const countryName = country ? COUNTRY_COORDS[country]?.name ?? country : null;
  const parts = [city, region].filter((x): x is string => !!x);
  if (parts.length && countryName) return `${parts.join(", ")} · ${countryName}`;
  if (parts.length) return parts.join(", ");
  return countryName ?? "Unknown location";
}
