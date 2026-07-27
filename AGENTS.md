# AGENTS.md — RealRyanNichols.com

Operating guide for coding agents (Claude Code, Codex, Cowork, etc.) working on this repo.
Kept short and **non-inferable** on purpose: stack quirks, commands, boundaries, and the
traps that have actually bitten us — not things you can read straight from the code.

## Stack
- **Next.js (App Router) + TypeScript + Tailwind.** The app lives in **`website/`** — run all commands there.
- **Supabase** (Postgres + Auth + Storage + RLS), **Stripe** (payments/invoices), **Mux** (video), **Vercel** (hosting/deploy).
- **Content:** posts live in the Supabase **`posts`** table (markdown `body`), edited via SQL or `/admin`. Markdown files in `website/content/articles/` auto-publish to `posts` by `slug`.

## Commands (run inside `website/`)
- Typecheck: `npx tsc --noEmit`
- Lint: `npx eslint <changed files>`
- **Always get both green before committing or merging.** There is no separate test suite.
- **Deploy = merge a PR to `main`** → Vercel builds production (~2–3 min). A new route/page is only live after a merge + build. DB/content changes are live immediately (no deploy).

## Editorial cadence and automation guard
- **Production article budget:** two scheduled flagship articles per Central Time day, at 9:00 a.m. and 5:00 p.m. A third is allowed only to recover a failed scheduled run or cover a verified, material breaking primary-record development.
- **One article, one branch, one pull request per automated run.** Never bundle unrelated articles into one PR.
- **Current editorial priority:** deep January 6 archive work—profiles, primary documents, evidence/video records, legal-procedure explainers, sourced timelines, case-status updates, and archive pillars.
- Unattended agents must not create bulk “trending X,” sports, celebrity, generic motivation, or routine political-summary batches. Legacy bulk-content PRs require fresh, explicit owner approval before merge.
- Before mutating GitHub, Supabase, or production, check for another active J6 branch, pull request, or deployment. Resume related unfinished work; otherwise defer instead of competing.
- Every published flagship needs a distinct search intent, anti-cannibalization check, primary sources, meaningful internal archive links, documentary visuals with provenance, an article-specific 1200×630 OG image, and signed-out live verification.

## Boundaries
**Always**
- Verify `tsc --noEmit` + `eslint` pass before any commit/merge.
- After deploying, verify on the live URL (curl for status/content) — you cannot see renders.
- Develop on the assigned feature branch; open a PR to `main`.

**Ask first**
- Publishing anything about the **active criminal/civil case**, named individuals, or the **bond/gag order** — it can be used against the owner. Draft it; get the owner's (and his counsel's) go before it goes public.
- Touching **payment infra** (Stripe keys, payout config) or doing destructive things to production data.
- Mixing a **candidacy/political angle with a donation ask** (campaign-finance risk — keep them on separate pages).

**Never**
- Commit secrets. Production secrets live in Vercel env vars, not the repo.
- Fabricate payment handles, names, dates, or evidence.
- Expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Non-inferable traps (these have actually bitten us)
- **Invisible headings on dark sections.** `app/globals.css` sets `h1,h2,h3 { color: var(--color-ink) }` (near-black) at the base layer, which overrides inherited light text. On any dark-background section, headings render black-on-black. **Fix:** add explicit `text-white` (or a light color) to each heading.
- **Post interactivity = shortcodes.** In a post `body`, a paragraph that is *only* `{{kind}}` renders a live component (see `components/PostBody.tsx`). Available: `{{fund}}` (donation tool), `{{donate}}`, `{{report: subject}}` (intake form), `{{share}}`, `{{react}}`, `{{demand}}`, `{{video: ...}}`, `{{casebanner}}`, `{{receiptgrid}}`. They only render on the article page, not feed cards.
- **Per-page OG images.** The `page_og_images` table overrides a post's share image by path (`/posts/<slug>`); the `/admin/og-images` tool uploads to Supabase storage. Coded pages set OG in their `metadata` export — the root layout sets `metadataBase`, so relative `/uploads/...` paths resolve to the live domain. Google Drive *view* links do **not** work as share images.
- **Analytics is first-party and rich — extend it, don't rebuild.** Clicks/scroll/dwell + ~30 named conversion events flow into `page_events` via `/api/track-event` (sendBeacon) and `lib/analytics.ts` `trackEvent()` (also fans out to Vercel/Meta/GA4). `/admin/analytics` aggregates it.
- **Live traffic:** `site_live_pulse` RPC (anon-callable) → `{ reading_now, today, week }`. See `LiveAttentionMeter` / `LiveViewers`.
- **Features ship dormant.** Checkout/subscribe/email routes return `503` until their env vars are set in Vercel; `/admin/health` shows exactly what's configured.

## Workflow notes
- The **Supabase MCP is connected to production** — be careful with writes. (Best practice is a dev/staging project; we currently operate on prod.)
- **GitHub API has an hourly rate limit.** When it trips, back off and retry the merge — `git push` itself is unaffected.
- Consider installing **Supabase Agent Skills** (`npx skills add supabase/agent-skills`) for RLS / `security_invoker` guidance.
- The site is already heavily built (analytics, shortcodes, admin control room, services/store). **Prefer extending existing systems over adding new ones, and coordinate to avoid duplicating parallel agents' work.**
- **No-cost clicks doctrine:** every article ships with 2–3 inline `{{poll: ...}}` one-tap questions — at least one mid-article, one as the closer. Free, anonymous, no navigation, about the *reader* not the article. Full rules in `CODEX.md`. Autopost pipeline: `content_queue` → `publish_next_queue_item()` (pg_cron, daily 14:00 UTC) publishes approved items and clean low-risk drafts; medium/high-risk always waits for Ryan.
