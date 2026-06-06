# Book section — developer notes

The Fighting Shadows book section. Built in phases. This doc tracks what exists
and how to configure it.

## Where to edit copy & prices

Everything user-facing lives in **`lib/book.ts`**:

- `BOOK` — title, subtitle, positioning paragraph, cover + OG image paths
- `BOOK_TIERS` — the three pre-order offers and their `priceUsd` (the
  `slug` is the stable id Stripe will key on in Phase 3)
- `BOOK_COVERS` — the "what the book covers" grid
- `BOOK_UPDATES` — the update log shown on `/book/updates` (hardcoded for now;
  structured so it can move to Supabase/CMS later)
- `BOOK_FAQ` — the FAQ on `/book`

## Routes

| Route | File | Notes |
|---|---|---|
| `/book` | `app/book/page.tsx` | Main sales page |
| `/book/preorder` | `app/book/preorder/page.tsx` | Three offers (placeholder checkout) |
| `/book/updates` | `app/book/updates/page.tsx` | Update log |
| `/book/press` | `app/book/press/page.tsx` | Press / media kit |
| `/book/thank-you` | `app/book/thank-you/page.tsx` | Post-purchase (noindex) |

## Phase 2 — email capture (live)

**Table:** `public.book_email_signups`
(`id, created_at, email (unique), name, source_page, consent, notes`),
RLS enabled with no policies — all access is via the service role, matching
`book_waitlist`.

**API:** `POST /api/book-signup` — validates email, requires `consent: true`,
rate-limited, upserts on `email` (no duplicates). Component:
`components/BookEmailSignup.tsx` (used on `/book`, `/book/preorder`,
`/book/updates`, `/book/press`).

**Env vars used:**

- Supabase (already set for the site): `SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The service-role key is server-only.
- Confirmation email (optional — signup still works without it):
  - `RESEND_API_KEY` — Resend API key (already used elsewhere on the site)
  - `BOOK_UPDATES_FROM_EMAIL` — the From address for book emails,
    e.g. `Ryan Nichols <updates@realryannichols.com>`

If `BOOK_UPDATES_FROM_EMAIL` is not set, signups are still stored; the
confirmation email is simply skipped.

## Phase 3 — Stripe Checkout (live)

**API:** `POST /api/checkout/book` — body `{ slug }`. Resolves the tier from
`BOOK_TIERS` **server-side** (the price is never sent from the client), creates a
Stripe Checkout session (`mode: "payment"` — charge now), and returns `{ url }`.
Component: `components/BookBuyButton.tsx`, rendered by `BookOffers` when
`checkout` is set (the `/book/preorder` page).

Design decisions:

- **Inline `price_data`** built from `BOOK_TIERS[].priceUsd` — no Stripe
  dashboard products and no per-price env vars. Change a price in `lib/book.ts`
  and checkout follows. (Switch to stored Price IDs later if you want named
  products in Stripe reporting.)
- **Charge now**, with a "full refund anytime before it ships" promise on the
  page. Success → `/book/thank-you`, cancel → `/book/preorder`.
- Physical tiers (signed paperback, founding) collect a **US shipping address +
  phone**. The founding tier collects an optional **supporter display name**.
- Session `metadata` carries `product_slug`, `product_name`, `amount_usd` for
  the Phase 4 webhook.

**Env var:** `STRIPE_SECRET_KEY` (already set for the site store). No new vars.

## Phase 4 — webhook fulfillment (live)

**Table:** `public.book_orders` (every field from the spec; see
`docs/sql/book_orders.sql`). RLS on, no policies — service-role only.

**Webhook:** handled inside the **existing** `app/api/stripe/webhook/route.ts`
(no new endpoint, no new secret). On `checkout.session.completed` where
`metadata.kind === "book_preorder"` it upserts a `book_orders` row:

- Idempotent two ways — the route already dedupes on `stripe_events`, and the
  upsert is `onConflict: stripe_checkout_session_id, ignoreDuplicates: true`, so
  retries never duplicate and never regenerate the download token.
- Stores customer, product, amount, payment status, a generated
  `download_token`, and the optional supporter display name (Founding tier).
- Refunds: `charge.refunded` sets `payment_status = 'refunded'`.

**Env var:** `STRIPE_WEBHOOK_SECRET` — already set (the store uses the same
endpoint). Nothing new to configure.

**Verify it is firing:** place one pre-order (Stripe test card
`4242 4242 4242 4242`, or a real $29 you refund), then check `book_orders` for
the row. The order also appears in the Stripe Dashboard.

## Later phases (not built yet)

- **Phase 5 — secure download:** `/book/download/[token]`.
- **Phase 6 — full docs + test checklist.**
