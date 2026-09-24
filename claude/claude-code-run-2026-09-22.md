# Claude Code run: 2026-09-22 growth audit (shipped 2026-09-24)

Engineering record only. Business, legal and client details live in the owner's private copy, not in this public repository.

| Repo | PR | State |
|---|---|---|
| RealRyanNicholsLLC | #666 | Merged and live on realryannichols.com |
| TheLeadFlowPro | #89 | Merged and live on theleadflowpro.com; its two migrations are applied |

## realryannichols.com (#666)
- `ArticleNextStep` runs at the end of every post:
  - 01 Read the book
  - 02 Follow the case, with the email form inline
  - 03 Hire Ryan
  - then 3 related posts

  FuelAsk stays directly under it.
- Homepage: an email capture sits at the top, and `/#join` lands on it.
- `/case`: the first capture form is at about 13% of the page. It was already in place, so nothing moved.
- Book checkout attribution:
  - First touch is kept for 90 days in localStorage and a first-party cookie. The last campaign touch is kept for 30 days.
  - The checkout route falls back to the cookie when the page sends nothing.
  - Stripe metadata gains 8 keys, stored in `book_orders.attribution`.
- Verified live:
  - The hero markup, and the next-step block on a sample post (book, case, services, related 1 to 3).
  - `/book`, `/case` and `/services` load.

## theleadflowpro.com (#89)
- `/free-build` and everything under it redirects with a 301 to `/services`, and utm tags carry over. `/free-build/welcome` redirects to `/thank-you`.
- Checkout refuses the retired free-build tiers.
- Speed to lead is dormant until switched on:
  - An AFTER INSERT trigger queues `staff_sms`, `staff_email` and `lead_sms` jobs for every new lead.
  - The intake routes deliver them immediately; a per-minute sweep (`/api/cron/speed-to-lead`) catches the rest.
- Uncalled list: `/admin/sales/uncalled`, open to admin and sales.
- Production proof: one synthetic `is_test` lead got 3 jobs skipped as `test record`, and nothing sent. The row was then deleted.
- Verified live:
  - The redirects return 301.
  - `/services` has the consultation CTA.
  - The Uncalled page sends signed-out visitors to login.
  - The cron answers 401 without the secret.
  - Checkout answers 400 for a retired tier.

## To switch speed to lead on (in order)
1. Set `SPEED_TO_LEAD_STAFF_PHONES` in the Vercel project to the staff cells.
2. Set `QUO_OUTBOUND_SMS_DISABLED=false`.
3. Set `SPEED_TO_LEAD_ENABLED=true`, then redeploy.
4. Rollback: set `SPEED_TO_LEAD_ENABLED` to anything else.
