-- Preserve first-touch campaign context from the book landing page through
-- Stripe Checkout into the private fulfillment ledger. This is additive and
-- keeps existing orders valid with an empty attribution object.
alter table public.book_orders
  add column if not exists attribution jsonb not null default '{}'::jsonb;

create index if not exists book_orders_attribution_source_idx
  on public.book_orders ((attribution->>'source'));

comment on column public.book_orders.attribution is
  'Private first-touch UTM/click/session metadata captured at book Checkout.';
