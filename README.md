# realryannichols.com

The personal feed of Ryan Nichols — husband, father, builder. Healing in public.

This repo holds the Next.js frontend for [realryannichols.com](https://realryannichols.com). Posts, comments, reactions, and email signups all live in a Supabase project; the frontend reads and writes that database directly using Supabase RLS.

## Stack

- Next.js 15 (App Router), React 19, TypeScript 5
- Tailwind CSS v4
- Supabase (Postgres + Auth + RLS) via `@supabase/ssr`
- Deployed on Vercel

## Local development

```bash
cd website
cp .env.example .env.local   # fill in the Supabase URL + anon key
npm install
npm run dev
# open http://localhost:3000
```

Required env vars (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SITE_URL` (e.g. `https://realryannichols.com`)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (for subscriber email)
- `SITE_MAILING_ADDRESS` (physical address — required by CAN-SPAM, appears in every email footer)
- `ADMIN_EMAILS` (comma-separated; also add each to `public.admin_emails` for RLS)

## Routes

- `/` — Feed (pinned + chronological posts from `public.posts`)
- `/posts/[slug]` — Single post with comments
- `/about`, `/jan-6`, `/support`, `/community-rules`, `/privacy` — Static pages
- `/login` — Magic-link sign-in
- `/auth/callback` — OAuth/OTP callback
- `/account` — Signed-in account view
- `/api/subscribe` — POST email; sends a confirmation email (double opt-in)
- `/api/subscribe/confirm?token=…` — GET; confirms subscription, sends welcome email
- `/api/unsubscribe?token=…` — GET (and one-click POST per RFC 8058); removes from list
- `/subscribed`, `/unsubscribed` — Confirmation/unsubscribe landing pages
- `/api/comments` — POST comment (must be signed in)
- `/api/notify-subscribers` — POST `{post_id}`; broadcasts a post to confirmed subscribers (admin/author only)
- `/sitemap.xml`, `/robots.txt`, `/rss.xml`, `/og/[slug]` — SEO surface

## Email setup (Resend + DNS)

Before subscriber email will deliver reliably, the sending domain has to be
authenticated. In Resend → **Domains** → add `realryannichols.com` and copy the
records shown into your DNS provider:

| Type  | Host                              | Purpose |
|-------|-----------------------------------|---------|
| `MX`  | `send` (or as shown by Resend)    | Return-Path mailbox |
| `TXT` | `send` (or as shown by Resend)    | SPF |
| `TXT` | `resend._domainkey`               | DKIM |
| `TXT` | `_dmarc`                          | DMARC (start with `v=DMARC1; p=none; rua=…`) |

After the records propagate (usually minutes), click **Verify** in Resend.
Until the domain shows "Verified", every send via `/api/subscribe` or
`/api/notify-subscribers` will fail and the route will return 502.

The `From` address (e.g. `updates@realryannichols.com`) must use the verified
domain.

## Email compliance

- Double opt-in is enforced — `notify_signups.confirmed_at` must be non-null
  for a subscriber to receive broadcasts.
- Every subscriber email includes a one-click unsubscribe link, the physical
  mailing address from `SITE_MAILING_ADDRESS`, and a `List-Unsubscribe` header
  (RFC 8058).
- Both `/api/subscribe` and `/api/notify-subscribers` return 503 if
  `SITE_MAILING_ADDRESS` is unset.

## Deploy to Vercel

1. Connect this repo on [vercel.com](https://vercel.com)
2. Set the three env vars above (Production + Preview)
3. Set the project root to `website/`
4. Add the custom domain `realryannichols.com` and `www.realryannichols.com`

Comments default to `status='pending'` and are approved through Supabase Studio until an admin UI ships.
