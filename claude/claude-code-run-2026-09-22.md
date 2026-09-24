# Claude Code run: 2026-09-22 growth audit (finished 2026-09-24)

Two repos, two draft PRs. Nothing is merged or deployed, and no production data was written.

| Repo | Branch | PR | State |
|---|---|---|---|
| RealRyanNicholsLLC | `claude/relaxed-bardeen-crvbyy` | https://github.com/RealRyanNichols/RealRyanNicholsLLC/pull/666 | Draft. Vercel preview built green. |
| TheLeadFlowPro | `ops/kill-free-build-and-lead-speed` | https://github.com/RealRyanNichols/TheLeadFlowPro/pull/89 | Draft. `origin/main` is merged in, including the droplet work, the Call Closer and Rent Receipt. |

Branch note: the realryannichols.com work is on this session's assigned branch, not `site/article-footer-and-home`.

## LeadFlow Pro (PR #89)

### 1. /free-build is dead
- **Redirects:**
  - `/free-build` and everything under it send a real 301 to `/services`, and utm tags carry over.
  - `/free-build/welcome` goes to `/thank-you`, so an old paid session still sees a confirmation page.
- **Removed from the site:** every CTA, nav item, catalog entry, article, tool button and page mention now points at real offers: the free consultation, `/services`, `/packages/launch` and `/agency/websites`.
- **/services:** no longer bounces people back to the dead page. The hero books the free consultation and has a call button for (903) 500-8898.
- **Checkout:** `/api/checkout` no longer sells the three free-build add-ons. Anyone could POST them before this.
- **Offers:** the four offers are marked retired. They are gone from the Call Closer, pay links, proposals and the credits page.
- **Stripe:** the webhook still records a late payment from an old session until 2026-10-22.
- **Leads:** the lead form no longer accepts `free_website_program`, and free-website Meta leads now file as Website Launch.
- **Nurture:** main's Rent Receipt series now owns new leads. The Free Build series only finishes for leads that already started it, and its links point to `/services`.
- **Migration** `20260922180000_retire_free_build_links.sql` fixes 8 academy lesson links plus the analytics `inspect_urls`. It is **not applied yet**.

### 2. Speed to lead (built, switched OFF until you flip it)
- **Trigger:** every new row in `leads`, from any source, gets 3 jobs:
  - a staff text to you and Pat;
  - a staff email to you and Pat;
  - one first text to the lead.
- **Staff text:** source, time, first name, interest, and a link to `/admin/sales/leads/{id}`. That link opens for both admin and sales.
- **Staff email:** the full details. Every existing NEW LEAD email now also shows the arrival time and that same link.
- **First text:**
  > "Got your request. Quick question so I know where to start: what is costing you the most business right now, missed calls, slow follow-up, or not enough leads? See what we build: theleadflowpro.com/services Reply STOP to opt out."
  - It promises no call.
  - It goes only to leads who ticked text consent and never replied STOP.
  - Between 9 pm and 8 am Central it waits until 8 am. It is not dropped.
- **Delivery:** the three main doors send instantly, and a sweep every minute catches the rest. The droplet's cron runner reads the same schedule, so the sweep carries over after the cutover.
- **Logging:** every send and every failure is logged on the job row and in the lead's activity. Failures retry at 1, 5, 15 and 60 minutes.

### 3. Uncalled list
- It lives at `/admin/sales/uncalled` and is linked in both navs, so Pat (sales role) and you (admin) both see it.
- It lists leads no person has called, texted, or noted, oldest first, with one-click **Mark contacted**.
- It does not use `last_contacted_at`. The Quo webhook fills that field seconds after any automatic text. Right now 64 of 68 Meta leads have it set, but 63 have no outbound call.

### Verified
- **Checks:** `npm test` passes 1689 of 1690. The one failure is a SellerProof URL check that also fails on `main`. `tsc` and eslint are clean, all 156 links resolve, and the production build passes.
- **Trigger test:** on a throwaway local Postgres with synthetic leads, every lead path produced the right jobs and skip reasons. A broken trigger still let the lead save, and no old lead got a job. The database was deleted afterwards.
- **Code reviews:** two independent reviews. All findings are fixed, except the nurture decision below.

## realryannichols.com (PR #666)
- **After every article:** one next step with three clear choices:
  - 01 Read the book, with the cover;
  - 02 Follow the case, with the email form inline;
  - 03 Hire Ryan;
  - then 3 related posts.
- **What it replaces:** three separate asks at the end of articles. FuelAsk still sits right under it.
- **Homepage:** follow-the-record email capture in the hero, with the book as the second choice. It is visible without scrolling on a phone: the field and button sit at 513 to 557 px on 390x844. The `/#join` links in the header, the mobile bar and `/support` now land on it; before, they went nowhere.
- **/case:** the first capture form is already at 13% of the page, so nothing needed to move. Measured on the preview.
- **Book attribution:**
  - First touch lasts 90 days, in local storage plus a cookie. It survives new tabs, day-2 buyers and in-app browsers.
  - Direct visits now record "direct from /book" instead of blanks.
  - The checkout route falls back to the cookie. Stripe gets 8 more metadata keys, including the last campaign touch.
  - The 09-13 order was a genuine direct or dark-social visit: phone, landed on `/book`, no campaign tag, no referrer, not an in-app browser.
- **Verified:**
  - `tsc` and eslint are clean, and 133 of 133 tests pass.
  - 390x844 screenshots were taken of the Vercel preview (home, an article's next step, the `/case` form) and reviewed.
  - An independent review found no blockers. Its 2 minor findings are fixed.

## Needs Ryan
1. **Call the uncalled leads.** 63 of 68 Meta leads have no outbound call on record. Once PR #89 is live, `/admin/sales/uncalled` is the list.
2. **Merge PR #89, then apply both migrations** (`20260922180000`, `20260922190000`). Everything stays dormant.
3. **Turn on speed to lead, in this order:**
   1. Set `SPEED_TO_LEAD_STAFF_PHONES` to your cell and Pat's.
   2. Set `QUO_OUTBOUND_SMS_DISABLED=false`.
   3. Set `SPEED_TO_LEAD_ENABLED=true`.

   To turn it off, set `SPEED_TO_LEAD_ENABLED` to anything else.
4. **Ads Manager:** change the Instant Form thank-you URL to `/services` and keep the same utm tags. Pause or rewrite any ad that still promises a $0 website; the 301 only catches the click. Also fix the `free_build` email campaign and the Quo auto-reply or snippets that mention it.
5. **Nurture decision.** Leads created before 2026-09-24 from 5 non-free-build forms (Services, Scoreboard, Qualified, Rent Receipt, Enrollment Gap) that never started a series now get no drip. Leads from 09-24 on get Rent Receipt. Do you want a short catch-up sequence for them?
6. **Send the four $500 invoices** (Offerle, Evans, Bates, Juarez). Stripe is live.
7. **Three published posts still link to LeadFlow's `/free-build`:**
   - `publish-the-ladder-credit-the-first-step`
   - `i-published-a-zero-on-my-own-sales-website`
   - `i-build-the-whole-thing-before-you-pay-me-anything`

   The 301 covers the links. Whether to edit the text is your editorial call.
8. **Privacy policy:** consider adding one line about the new 90-day first-party attribution cookie.
9. **/case pop-up:** the first-visit "What brings you by today?" pop-up covers the capture form until it is closed. This isn't new; it's your call whether it should wait.

## Hosting and cost (answered 2026-09-24)
- **Totals:** Supabase is about $152/mo (an estimate from list prices). Vercel was $271 in August and is on pace for about $427 in September.
- **The biggest single line is Vercel Agent AI tokens, at about $240/mo.** Extra seats add about $47 and Speed Insights Plus about $46.
- **Idle Supabase projects** (GideonHQ, greenlight-tool-lab, Texas Twisted, Ryan Brain) can be moved to a free org and paused, saving about $39/mo. Pausing can be undone for a year.
- **Google Workspace** cannot host an app or a database.
- **13 of the 14 Supabase edge functions behind realryannichols.com are not in git.** Pull them into the repo.
- **Billing was not touched.** Your prompt said not to.

## Legacy leads: on hold
- **What exists:** 223,585 rows in Google Drive under My Drive/Leads, mostly Wholesale Universe. About 51.5K are usable today, and likely 100K to 150K once the 127K list is re-read from its original CSV.
- **Why it's on hold:** a July 8 Drive document prepared for Cause No. 25-0847 treats this database as a confidential community business asset, producible only under a protective order.
- **Nothing was imported.** Import only after you and your counsel clear it. When you do, it goes into a separate import table that does not fire the new-lead trigger, and no email goes out until you approve the list, the sending domain and the unsubscribe setup.
- **Lock this down in Drive now:** "Onboarding-Client Master List - 3252024" holds SSNs, dates of birth, passwords and bank account numbers.
