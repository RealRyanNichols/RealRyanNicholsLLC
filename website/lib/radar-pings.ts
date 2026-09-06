// The public shape of one live visitor on the radar. Deliberately tiny:
// a hashed session id (for a stable dot), where they are to city/state
// resolution, and when they were last seen. Nothing about what they read.
export type RadarPing = {
  ping_id: string;
  country: string | null;
  region: string | null;
  city: string | null;
  last_seen: string;
};

// The `live_visitor_pings` RPC also returns each session's current path and
// page count. Those never reach a public surface, so strip them before the
// rows are stored, serialized into HTML, or handed to the map. Kept in its
// own module (no atlas imports) so server components can call it cheaply.
export function sanitizePings(rows: unknown): RadarPing[] {
  if (!Array.isArray(rows)) return [];
  const out: RadarPing[] = [];
  for (const r of rows as Record<string, unknown>[]) {
    if (!r || typeof r.ping_id !== "string") continue;
    out.push({
      ping_id: r.ping_id,
      country: typeof r.country === "string" ? r.country : null,
      region: typeof r.region === "string" ? r.region : null,
      city: typeof r.city === "string" ? r.city : null,
      last_seen: typeof r.last_seen === "string" ? r.last_seen : "",
    });
  }
  return out;
}
