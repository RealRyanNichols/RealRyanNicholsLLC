# QA scripts

Browser checks that back the Map Room, Nexus, Token Fund, and phone standards.
They run against any base URL: a local `npm start`, a Vercel preview, or
production. Nothing here writes to the database or spends money.

## Setup (once, from `website/`)

```bash
npm i --no-save playwright@1.56.1
npx playwright install chromium
```

Playwright is deliberately not a dependency of the site; `--no-save` keeps it
out of `package.json` and the Vercel build.

## Scripts

| Script | What it proves |
| --- | --- |
| `mobile-audit.mjs [maxPages]` | Every sitemap page at 390px: 0 horizontal overflow, every tap target ≥ 44×44 (inline links in sentences exempt), no text under 11px, no field under 16px, 0 JS errors. `PATHS=/,/fuel` audits specific pages. |
| `verify-map-room.mjs` | `/the-map-room` acceptance criteria: HTML under 250 KB, no giant path attribute, SSR headline equals `site_totals().live_now`, JS-off headline, 44px controls, one-finger pan without page scroll, wheel zoom, tap shows city/state only, no drawer, no visitor path. |
| `verify-nexus.mjs` | `/case/nexus` and `/case/geography` on the same standard. |
| `verify-fuel.mjs` | `/fuel` renders the ledger bill and tiers, controls ≥ 44px, checkout API refuses bad input. |
| `shots.mjs [paths...]` | Top and bottom screenshots at `WIDTH` (390 default) for a visual pass. |
| `hydration.mjs [path]` | Prints every console error for one page. Point it at `next dev` to get the full React hydration diff. |

Examples:

```bash
BASE=http://localhost:3000 node scripts/qa/mobile-audit.mjs
BASE=https://realryannichols.com node scripts/qa/verify-map-room.mjs
WIDTH=1440 BASE=https://realryannichols.com node scripts/qa/shots.mjs / /fuel /case/timeline
```

Reports and screenshots land in `.qa/` (gitignored); set `QA_OUT` to change that.
`verify-map-room.mjs` reads the Supabase anon key from the environment or from
`website/.env.production`.

## The phone standard these enforce

- Tap targets at least 44×44 CSS px on phones. The site pattern is
  `inline-flex min-h-11 items-center`, with `sm:min-h-0` where the desktop design is tighter.
- Phone floors live in `app/globals.css` under `@media (max-width: 639px)`: nothing under 11px,
  small fields at 16px so iOS does not zoom, typed fields and the `btn-*` classes at 44px.
- Fix a shared component once rather than patching pages one at a time.
