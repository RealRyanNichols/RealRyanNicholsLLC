// Where a page view came from, read from whatever the edge in front of the
// app provides. Production moved from Vercel to a DigitalOcean server behind
// Caddy on 2026-09-29, and Vercel's x-vercel-ip-* headers went with it: every
// page view since then has no country, region or city (the Map Room and the
// "countries" count read zero). This reads, in order:
//
//   1. x-geo-*         set by our own proxy (Caddy with a GeoIP module and a
//                      MaxMind GeoLite2 database; see docs/digitalocean.md)
//   2. cf-ip* / cf-region-code   Cloudflare visitor-location headers
//   3. x-vercel-ip-*   Vercel, if the site is ever served from there again
//
// The proxy must SET (overwrite) these headers on every request, or a client
// could send its own. Coordinates are rounded to a tenth of a degree (about
// 11 km) here, before anything is stored: the Map Room's privacy floor.

export type RequestGeo = {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

type HeaderSource = { get(name: string): string | null };

const SOURCES = [
  {
    country: "x-geo-country",
    region: "x-geo-region",
    city: "x-geo-city",
    latitude: "x-geo-latitude",
    longitude: "x-geo-longitude",
  },
  {
    country: "cf-ipcountry",
    region: "cf-region-code",
    city: "cf-ipcity",
    latitude: "cf-iplatitude",
    longitude: "cf-iplongitude",
  },
  {
    country: "x-vercel-ip-country",
    region: "x-vercel-ip-country-region",
    city: "x-vercel-ip-city",
    latitude: "x-vercel-ip-latitude",
    longitude: "x-vercel-ip-longitude",
  },
] as const;

/** Rounded to 0.1°, or null when missing, unparsable or out of range. */
export function coarseCoord(raw: string | null | undefined, max: number): number | null {
  if (!raw) return null;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || Math.abs(n) > max) return null;
  return Math.round(n * 10) / 10;
}

function clean(raw: string | null, maxLength: number): string | null {
  if (!raw) return null;
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // Not percent-encoded; keep it as sent.
  }
  // Cloudflare sends XX (unknown) and T1 (Tor) as country codes; GeoIP
  // modules can send an empty placeholder. None of them is a place.
  if (!value || value === "XX" || value === "T1" || value.includes("{")) return null;
  return value.slice(0, maxLength);
}

export function readRequestGeo(headers: HeaderSource): RequestGeo {
  for (const source of SOURCES) {
    const country = clean(headers.get(source.country), 8);
    if (!country) continue;
    const latitude = coarseCoord(headers.get(source.latitude), 90);
    const longitude = coarseCoord(headers.get(source.longitude), 180);
    const hasFix = latitude !== null && longitude !== null;
    return {
      country: country.toUpperCase(),
      region: clean(headers.get(source.region), 16),
      city: clean(headers.get(source.city), 80),
      latitude: hasFix ? latitude : null,
      longitude: hasFix ? longitude : null,
    };
  }
  return { country: null, region: null, city: null, latitude: null, longitude: null };
}
