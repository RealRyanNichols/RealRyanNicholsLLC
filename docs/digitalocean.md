# Running on DigitalOcean

Checked October 14, 2026. Since September 29, 2026, realryannichols.com has been served from a
DigitalOcean server (165.227.248.110) behind Caddy. The response headers say `via: 1.1 Caddy`.
The server picks up `main`: assets from the newest `main` commit are live. Vercel no longer
builds this repo. Every Vercel check reads "Account is blocked", so ignore that status on
pull requests.

How `main` reaches the server (a pull, a webhook or a manual deploy) is not in this repo.
Write it down here once someone confirms it on the server.

## What the move broke, and what fixes it

### 1. Visitor geography (fixed in code; the server needs one change)
Vercel added `x-vercel-ip-country/region/city/latitude/longitude` to every request. Caddy adds
nothing. Since September 29 every page view has been stored with no country, region or city.
That leaves the Map Room and the "countries" counter at zero and blinds every regional report.

The app now reads geo from whichever edge is in front of it (`website/lib/request-geo.ts`).
Its own proxy goes first:

| Header the app reads | Value |
| --- | --- |
| `X-Geo-Country` | ISO country code, e.g. `US` |
| `X-Geo-Region` | region / state code, e.g. `TX` |
| `X-Geo-City` | city name (percent-encoding is fine) |
| `X-Geo-Latitude` | decimal degrees |
| `X-Geo-Longitude` | decimal degrees |

To fill them, add a GeoIP module to Caddy (for example `caddy-geoip2`, built with `xcaddy`) plus
a free MaxMind GeoLite2-City database. Then set each header in the site block with
`request_header`, using the placeholder names from that module's README. Caddy must
**overwrite** these headers on every request, so a visitor cannot send their own. Coordinates are
rounded to about 11 km before anything is stored, the same privacy floor as before. Cloudflare's
`cf-ipcountry` family is also read, so putting Cloudflare in front would work too.

### 2. Scheduled jobs (the server needs a crontab)
`website/vercel.json` holds three schedules. Only Vercel ever ran them:

| Route | Schedule (UTC) |
| --- | --- |
| `/api/cron/deadman-release` | every hour, on the hour |
| `/api/cron/deadman-social` | every 5 minutes |
| `/api/cron/social-fill` | every hour at :20 |

On the server they need a crontab (or systemd timers). Each call sends
`Authorization: Bearer <CRON_SECRET>` (or `DEADMAN_CRON_SECRET`; see `website/lib/cron-auth.ts`).
Read the secret from the server's env file; never put it in the crontab line or the repo. For
example, where `/etc/rrn.env` holds `CRON_SECRET=...`:

```
0 * * * *    . /etc/rrn.env; curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://realryannichols.com/api/cron/deadman-release >/dev/null
*/5 * * * *  . /etc/rrn.env; curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://realryannichols.com/api/cron/deadman-social >/dev/null
20 * * * *   . /etc/rrn.env; curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://realryannichols.com/api/cron/social-fill >/dev/null
```

`deadman_event_log` only records failures, so the database cannot show whether these jobs ran.
Check the server's crontab.

### 3. Vercel Analytics and Speed Insights (fixed in code)
Their scripts live at `/_vercel/...`, which 404s on DigitalOcean. The layout now renders them only
when the site is built on Vercel (`process.env.VERCEL`). First-party analytics (`page_views`,
`page_events`) are unaffected and remain the source of truth.

## Video files on DigitalOcean Spaces
Set `NEXT_PUBLIC_DO_SPACES_CDN_URL` to the bucket's CDN endpoint (https, no trailing slash). Then
a video post's media URL or a `{{video: ...}}` shortcode can name a file as `do:<key>`, e.g.
`do:clips/courthouse.mp4` (see `website/lib/video-source.ts`). A full `https://` Spaces URL
works with no setup. Because it is a `NEXT_PUBLIC_` variable it is baked in at build time, so
rebuild after setting it.
