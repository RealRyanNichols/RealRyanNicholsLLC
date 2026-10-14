import assert from "node:assert/strict";
import test from "node:test";
import { coarseCoord, readRequestGeo } from "../lib/request-geo";

const headers = (h: Record<string, string>) => new Headers(h);

test("no edge headers means no geo", () => {
  assert.deepEqual(readRequestGeo(headers({})), {
    country: null,
    region: null,
    city: null,
    latitude: null,
    longitude: null,
  });
});

test("our own proxy's x-geo-* headers are read first and rounded", () => {
  const geo = readRequestGeo(
    headers({
      "x-geo-country": "us",
      "x-geo-region": "TX",
      "x-geo-city": "Marshall",
      "x-geo-latitude": "32.5449",
      "x-geo-longitude": "-94.3674",
      "x-vercel-ip-country": "CA",
    }),
  );
  assert.deepEqual(geo, {
    country: "US",
    region: "TX",
    city: "Marshall",
    latitude: 32.5,
    longitude: -94.4,
  });
});

test("Cloudflare and Vercel headers still work, city names are decoded", () => {
  assert.equal(readRequestGeo(headers({ "cf-ipcountry": "DE", "cf-ipcity": "M%C3%BCnchen" })).city, "München");
  const vercel = readRequestGeo(
    headers({
      "x-vercel-ip-country": "US",
      "x-vercel-ip-country-region": "TX",
      "x-vercel-ip-city": "Longview",
    }),
  );
  assert.equal(vercel.country, "US");
  assert.equal(vercel.region, "TX");
  assert.equal(vercel.city, "Longview");
});

test("unknown, Tor and unfilled placeholder countries are not places", () => {
  assert.equal(readRequestGeo(headers({ "cf-ipcountry": "XX" })).country, null);
  assert.equal(readRequestGeo(headers({ "cf-ipcountry": "T1" })).country, null);
  assert.equal(readRequestGeo(headers({ "x-geo-country": "{geoip2.country_code}" })).country, null);
  // A blank proxy header falls through to the next source.
  assert.equal(readRequestGeo(headers({ "x-geo-country": " ", "cf-ipcountry": "GB" })).country, "GB");
});

test("a half coordinate is dropped, never guessed", () => {
  const geo = readRequestGeo(headers({ "x-geo-country": "US", "x-geo-latitude": "32.5" }));
  assert.equal(geo.latitude, null);
  assert.equal(geo.longitude, null);
});

test("coordinates outside the globe or unparsable are dropped", () => {
  assert.equal(coarseCoord("91", 90), null);
  assert.equal(coarseCoord("-181", 180), null);
  assert.equal(coarseCoord("abc", 90), null);
  assert.equal(coarseCoord(null, 90), null);
  assert.equal(coarseCoord("32.54", 90), 32.5);
});
