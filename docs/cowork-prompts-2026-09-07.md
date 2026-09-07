# Cowork prompts: what is left after the September 7, 2026 pass

How to use this file: open the repo folder in Claude Cowork and paste one prompt at a time. Every prompt stands on its own. Where a prompt says **DECISION**, fill in your call before you paste it; if you leave it blank, Cowork must ask you before building.

Already live, do not redo:

| PR | What shipped |
| --- | --- |
| [#551](https://github.com/RealRyanNichols/RealRyanNicholsLLC/pull/551) | Map Room and analytics refactor: one live count, client-only radar, brand color tokens (acceptance criteria 1 through 10) |
| [#552](https://github.com/RealRyanNichols/RealRyanNicholsLLC/pull/552) | Token Fund at `/fuel`; Nexus and Geography on the Map Room standard |
| [#553](https://github.com/RealRyanNichols/RealRyanNicholsLLC/pull/553) | Site-wide phone sweep: 44px thumbs, text floors, `/case/timeline` hydration fix |
| [#554](https://github.com/RealRyanNichols/RealRyanNicholsLLC/pull/554) | The last one-off targets |

The QA scripts those PRs were verified with are in the repo at `website/scripts/qa/` (README there).

Every prompt below carries the same ground rules. They are Ryan's rules, not Cowork's, and they win over anything else in the prompt.

---

## Prompt 1. Phone audit from a real machine and a real phone

```
You are working in the RealRyanNicholsLLC repo. The Next.js app is in website/; run every command from there. Read AGENTS.md first.

Ground rules: Never invent a number, price, date, URL, or capability that is not in this repo, its database, or documentation you checked today; if it is missing, write NEEDS AUTHENTICATION and ask me. Nothing about a named person publishes without my approval. Nothing spends money or posts publicly on its own. Never edit by line number; grep for the symbol first. Brand colors are CSS tokens in styles/tokens.css (mirrored in lib/palette.ts); no new hex literals in app/ or components/. npx tsc --noEmit and npx eslint <changed files> must be green before any commit.

Job: finish the phone pass against the live site. Two rounds already shipped (PR #553 and #554). The audit that drove them is in the repo: website/scripts/qa/mobile-audit.mjs, README in website/scripts/qa/. The sandbox that ran it could not reach production through a browser, so the live site was only checked by fetching HTML. You can run the real thing.

1. Setup: npm i --no-save playwright@1.56.1 && npx playwright install chromium
2. Run: BASE=https://realryannichols.com node scripts/qa/mobile-audit.mjs 80
   One line per page; details in .qa/mobile-audit.json.
3. The standard: 0 horizontal overflow, every tap target at least 44x44 CSS px (inline links inside sentences are exempt), no text under 11px, no form field under 16px, 0 JS errors.
4. Fix every finding with the site pattern: inline-flex min-h-11 items-center, plus sm:min-h-0 where the desktop design is tighter. Phone-only floors live in app/globals.css under @media (max-width: 639px). Fix a shared component once instead of patching pages one at a time.
5. Then a real phone. Tell me which pages to open in Safari on my iPhone: home, /case/timeline, /the-map-room, /case/nexus, /fuel, one post, one J6 profile. I will tell you what I see. Fix what I report.
6. Rebuild (npm run build), rerun the audit against npm start on localhost, then commit on a branch, open a PR, merge it when checks pass, and prove it by rerunning the audit against https://realryannichols.com.

Report back: the before and after audit counts and the list of files you changed.
```

## Prompt 2. Collapse the phone overlays

```
You are working in the RealRyanNicholsLLC repo. The Next.js app is in website/; run every command from there. Read AGENTS.md first.

Ground rules: Never invent a number, price, date, URL, or capability that is not in this repo, its database, or documentation you checked today; if it is missing, write NEEDS AUTHENTICATION and ask me. Nothing about a named person publishes without my approval. Nothing spends money or posts publicly on its own. Never edit by line number; grep for the symbol first. No new hex literals in app/ or components/. npx tsc --noEmit and npx eslint <changed files> must be green before any commit.

Problem: on a phone, three fixed things stack on first load and cover about a third of a 390px screen, on top of the first post in the feed: the RyanChat "Ask me anything" bubble with its "Talk to Ryan" launcher (components/RyanChat.tsx, variant "launcher"), the bottom MobileSupportBar with Talk / Story / Tip / Private / Join (components/MobileSupportBar.tsx), and on some pages the PathPicker overlay (components/PathPicker.tsx, variant "overlay"). All three are mounted in app/layout.tsx.

DECISION (mine, pick one and delete the others):
(a) Keep the bottom support bar. The chat becomes one small launcher with no bubble until it is tapped.
(b) Keep the chat launcher and its bubble. Hide the bottom bar on phones.
(c) One combined bottom bar: Talk (opens the chat), Story, Tip, Join. No floating bubble at all.

Rules for whichever I pick: at 390px on first load, at most one fixed element may overlap the main column; every control stays 44px; dismissals persist using the same localStorage keys those components already use (grep for them, do not invent new ones); desktop does not change unless it has to; every trackEvent call those components fire (lib/analytics.ts) keeps firing with the same event names.

Steps:
1. Read the three components and app/layout.tsx. Write down the current positions and z-index values.
2. Implement my pick.
3. Screenshots before and after at 390 and 1440: node scripts/qa/shots.mjs / /case/timeline and WIDTH=1440 node scripts/qa/shots.mjs / (setup in website/scripts/qa/README.md). Show them to me.
4. Run BASE=http://localhost:3000 node scripts/qa/mobile-audit.mjs against npm start; it must stay clean.
5. tsc and eslint green, commit on a branch, PR, merge when checks pass, verify on production with the audit and a screenshot.
```

## Prompt 3. Visual upgrade, one round at a time

```
You are working in the RealRyanNicholsLLC repo. The Next.js app is in website/; run every command from there. Read AGENTS.md first.

Ground rules: Never invent a number, price, date, URL, or capability that is not in this repo, its database, or documentation you checked today; if it is missing, write NEEDS AUTHENTICATION and ask me. Nothing about a named person publishes without my approval. Nothing spends money or posts publicly on its own. Never edit by line number; grep for the symbol first. npx tsc --noEmit and npx eslint <changed files> must be green before any commit.

Job: a visual pass on the whole site that I react to page by page. I look, then I say "I don't like that, go back" or "more of that." So we work in rounds, and you do not build anything until I have answered.

Round 0, contact sheets. Setup from website/scripts/qa/README.md, then:
  BASE=https://realryannichols.com node scripts/qa/shots.mjs / /start-here /case /the-map-room /case/nexus /j6 /fuel /support /book /services /case/timeline
  WIDTH=1440 BASE=https://realryannichols.com node scripts/qa/shots.mjs (same list)
Add one post and one J6 profile page from the sitemap. Assemble each width into one HTML contact sheet I can scroll, and show me.

Round 1, the proposal. Exactly five moves. Each is one sentence plus the files it touches. Constraints that do not move: the palette (cream paper, navy, flag red, gold; tokens in styles/tokens.css and the @theme block in app/globals.css), the type (Source Serif 4 display, Inter body), no new libraries, no new hex literals in app/ or components/, no move that adds more than 20 KB to a page, and the phone standard from PR #553 stays (44px targets, 11px floor). Good candidates: hero density on phones, card rhythm in the feed, the Situation Room strip, the footer, section spacing, the store and services cards, empty states.

Round 2, build. Only the moves I approve. One PR per move, before and after screenshots at 390 and 1440 in the PR body, mobile-audit clean, tsc and eslint green, tests green (npm test). Merge each one after I say yes to its screenshots, then verify on production.
```

## Prompt 4. Token Fund, first real dollar through the pipe

```
You are working in the RealRyanNicholsLLC repo. The Next.js app is in website/. Read AGENTS.md first. You have the Supabase MCP connected to the production project rpchhzncxigczfojfdtc; treat every write as production.

Ground rules: Never invent a number, price, date, URL, or capability that is not in this repo, its database, or documentation you checked today. Nothing spends money on its own; I do the paying. Do not touch Stripe keys or payout settings. Do not create rows with fake names.

Context: /fuel sells AI tokens for work (PR #552). Code: lib/fuel.ts (tiers), app/api/checkout/fuel/route.ts (Stripe Checkout; writes a support_intents row with purpose "site", a message starting "Token Fund (", status "started"), app/api/stripe/webhook/route.ts and lib/fuel-server.ts (markFuelIntentPaid flips the intent to "paid"; money lands in donations with campaign "fuel"), app/fuel/thanks/page.tsx, and the Token Fund section of app/admin/donations/page.tsx. A checkout session was created in production during verification but never paid, so the webhook path has not carried real money yet.

Steps:
1. Before, read only. Check the donations table's columns first (do not guess names), then run:
   select count(*) from donations where campaign = 'fuel';
   select id, status, display_name, left(message, 60) from support_intents where message like 'Token Fund%' order by created_at desc limit 5;
2. Tell me to go to https://realryannichols.com/fuel, pick Spark ($20), pay with my own card, name "Ryan test". I will tell you when it is done.
3. After. Rerun both queries. Expected: one new donations row with campaign "fuel" for $20, the "Ryan test" intent at status "paid", /fuel/thanks rendered for me (I will paste what I saw), and the admin donations page listing it under Token Fund. Check the Stripe dashboard event log for the checkout.session.completed delivery to /api/stripe/webhook and its response code.
4. If anything did not flip, find why in the webhook route and fix it with a PR (tsc, eslint, npm test green). Merge, then I will pay again and we recheck.
5. Refund. I refund the $20 in the Stripe dashboard and tell you. Then check what the site shows for a refunded gift. There is no refund handling in the webhook today. Write up what a refund would need to touch (donations row, the intent, the supporters wall if it is on it) and stop. DECISION on building it is mine.

Report back: the two before and after query results, the webhook response code, and anything you changed.
```

## Prompt 5. Lock the visitor session detail function to admin

```
Approval: I approve restricting the database function live_visitor_session_detail to admin use only.

You are working in the RealRyanNicholsLLC repo. The Next.js app is in website/. Migrations live in supabase/migrations/ at the repo root. Read AGENTS.md first. The Supabase MCP is connected to the production project rpchhzncxigczfojfdtc; treat every write as production.

Ground rules: Never invent. Never expose SUPABASE_SERVICE_ROLE_KEY to the browser. No public surface may show a visitor's path or page trail. Never edit by line number; grep for the symbol first. npx tsc --noEmit and npx eslint <changed files> green before any commit.

Context: live_visitor_session_detail is a security-definer RPC that returns per-visitor session detail. Today it is callable with the anon key. The public Map Room must never need it.

Steps:
1. grep -rn live_visitor_session_detail website/ and list every caller with the client it uses: browser anon client, server anon client, or the service-role server client.
2. In production, read the current definition and grants:
   select pg_get_functiondef('public.live_visitor_session_detail'::regproc);
   select proacl from pg_proc where proname = 'live_visitor_session_detail';
3. Write a migration in supabase/migrations/ that revokes EXECUTE from anon and authenticated and grants it to service_role. Do not change the function body.
4. Move any caller that used the anon key onto the service-role server client, admin pages only.
5. Apply the migration with the Supabase MCP apply_migration, then prove it both ways: an anon-key POST to /rest/v1/rpc/live_visitor_session_detail must be refused (401 or 403), and the admin page that uses it must still render its detail.
6. Run BASE=https://realryannichols.com node scripts/qa/verify-map-room.mjs (setup in website/scripts/qa/README.md); it must stay green.
7. PR, merge when checks pass, verify on production.

Report back: the callers you found, the grants before and after, and the two proofs from step 5.
```

## Prompt 6. Capture the production-only database objects into migrations

```
Approval: I approve capturing database functions, views, triggers, and cron jobs that exist only in production into migration files, with no change in behavior.

You are working in the RealRyanNicholsLLC repo. Migrations live in supabase/migrations/ at the repo root. Read AGENTS.md first. The Supabase MCP is connected to the production project rpchhzncxigczfojfdtc; this job reads production and writes only files in the repo.

Ground rules: Never invent. Do not edit any function body. Do not apply anything to production; the objects already exist there. Never expose the service-role key.

Context: several RPCs the site depends on were created straight in production and are not in the repo. Known names from the code: site_totals, hot_right_now, site_live_pulse, case_timeline_data, live_visitor_session_detail. Only one of those names appears in any migration file today. There may be more, including views and pg_cron jobs such as publish_next_queue_item.

Steps:
1. Inventory production:
   select p.proname, pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by 1;
   select viewname from pg_views where schemaname = 'public';
   select tgname, tgrelid::regclass from pg_trigger where not tgisinternal;
   select jobname, schedule, command from cron.job;
2. For each object, grep supabase/migrations/ for its name. Anything with no create statement in any migration is production-only.
3. For each production-only object, dump the exact definition (pg_get_functiondef, pg_get_viewdef, pg_get_triggerdef; the cron command as stored) and write one migration file per object using create or replace, keeping the same security definer setting, search_path, owner, and grants as production (read the grants from proacl and information_schema).
4. Do not apply. If this repo's tooling tracks applied migrations (check how supabase/migrations/ is used in AGENTS.md, package.json, and any CI), mark them applied the way that tooling expects and say what you did.
5. PR with a table: object, kind, file, grants. Merge when checks pass. Then run npm test and BASE=https://realryannichols.com node scripts/qa/verify-map-room.mjs to prove nothing changed.

Report back: the inventory, the list of files written, and anything you could not capture and why.
```

## Prompt 7. City-level pings on the public Map Room

```
DECISION (mine, pick one and delete the others):
(a) Keep state-level pings for everyone. Nothing to build; skip this prompt.
(b) City-level pings for admins only; the public map stays at state level.
(c) City-level pings for everyone, with the privacy floor below.

You are working in the RealRyanNicholsLLC repo. The Next.js app is in website/; run every command from there. Migrations live in supabase/migrations/ at the repo root. Read AGENTS.md first.

Ground rules: Never invent. Do not invent city coordinates; every coordinate comes from a licensed dataset you name, with its license. No public surface may show a visitor's path or page trail. Never edit by line number; grep for the symbol first. npx tsc --noEmit, npx eslint <changed files>, and npm test green before any commit.

Context: /the-map-room plots visitor pings at state resolution. Geometry is in lib/radar-geo.ts (pingLngLat, projectPing, pointInState, deterministic jitter); pings are stripped of path and page data by sanitizePings in lib/radar-pings.ts before they leave the server. Logged out, tapping a ping shows city and state text only. The disclosure on /about/numbers (grep app/about/numbers/page.tsx for the paragraph that describes what the map shows) must match whatever ships.

If (b) or (c):
1. Coordinates: use a licensed dataset with attribution and say which file and license (GeoNames cities1000 is CC BY 4.0). Load it into a table geo_cities (country, region code, city, lat, lon, population) with a migration and a one-time import script under website/scripts/.
2. Resolve a ping to a city only when country, region, and city all match a row. Otherwise it keeps today's state placement. Keep the deterministic jitter so two visitors in one town do not stack.
3. Privacy floor for the public map: city placement only when the city's population is at least 50,000 (DECISION: change this number if you want). Smaller places stay at state level. If (b), the public map never resolves to a city at all; only the admin surface does.
4. Update the /about/numbers disclosure to say exactly what is shown and the data source, and add the dataset attribution to the Map Room page. Show me the exact wording before it ships.
5. Tests in tests/radar-geo.test.ts: a Gilmer, TX ping still lands inside Texas; a small-town ping stays at state level on the public map; a resolved city never lands outside its state polygon.
6. Verify with BASE=http://localhost:3000 node scripts/qa/verify-map-room.mjs at 390 and 1440 (setup in website/scripts/qa/README.md). PR, merge when checks pass, verify on production with the same script.
```

## Prompt 8. Vercel Web Analytics

```
Two parts. Part one is mine, not yours: in the Vercel dashboard, project realryanichols-personal, Analytics tab, Enable. It is a click, not code; the <Analytics /> component from @vercel/analytics is already mounted in website/app/layout.tsx.

Part two is yours, after I say it is on. You are working in the RealRyanNicholsLLC repo; the app is in website/. Read AGENTS.md first.
1. curl -I https://realryannichols.com/_vercel/insights/script.js must return 200 with a JavaScript content type.
2. Load the home page in Playwright at 390px (setup in website/scripts/qa/README.md; node scripts/qa/hydration.mjs / against BASE=https://realryannichols.com) and confirm the script loads with no console error.
3. Confirm lib/analytics.ts trackEvent still fans out to the first-party /api/track-event. That is the system of record; Vercel is a mirror.
Report what you saw. No code change unless something is broken, and then a PR with the fix.
```

## Prompt 9. Re-run the original spec for the sections that never arrived

```
Context: on September 7, 2026, a 36-section spec for the Map Room and analytics refactor was run by Claude Code, but only its final sections reached that session: the constraints, the ten acceptance criteria, the "ask Ryan before building" list, and the final instruction. The sections before those were never seen. The full spec is pasted below. Your job is to find what in it is not yet built and build only that.

Already done and live (verify it, do not redo it): acceptance criteria 1 through 10 (PR #551), the Token Fund at /fuel (PR #552), Nexus and Geography on the Map Room standard (PR #552), the site-wide phone sweep (PR #553 and #554). The LAW sections of the spec win over everything else. Never invent: if a number, price, date, response time, platform capability, or URL is not in this repo, its database, or documentation you checked today, it does not ship; write NEEDS AUTHENTICATION and ask me. Ask before building anything on the "ask Ryan" list. Nothing about a named person publishes without my approval. Nothing spends money or posts publicly on its own.

You are working in the RealRyanNicholsLLC repo. The app is in website/; run every command from there. Read AGENTS.md and the four PR bodies first.

Steps:
1. Go through the spec section by section and write a checklist: done (with the file or PR that proves it), not done, needs my decision. Show me the checklist before building anything.
2. Build the not-done items in the spec's order, one PR each, with the same bar the earlier PRs met: npx tsc --noEmit, npx eslint on changed files, npm test, npm run build, the scripts in website/scripts/qa/ at 390 and 1440.
3. Merge each PR when checks pass and verify on production.

--- SPEC STARTS BELOW ---
(paste the whole spec here)
```

---

## Notes that are not prompts

- **Vercel firewall.** During verification, some scripted requests from one IP got HTTP 403 with the header `x-vercel-mitigated: deny`. That was Vercel reacting to a burst from a single address, not a site bug. Worth a look at the project's Firewall tab to confirm real phones are never challenged.
- **Token Fund tiers.** Amounts and rewards live in `website/lib/fuel.ts` (`FUEL_TIERS`). The month tier is computed from the AI line items in `funding_line_items`; it is never a typed number.
- **No direct token link exists.** Neither Anthropic nor OpenAI offers a "pay $X of tokens into someone else's account" link. `/fuel` says so and buys the tokens on your side.
