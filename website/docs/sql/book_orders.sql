-- Phase 4: book pre-order records, written by the Stripe webhook
-- (app/api/stripe/webhook/route.ts, on checkout.session.completed where
-- metadata.kind = 'book_preorder'). Applied as migration `create_book_orders`.

create table if not exists public.book_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_name text,
  customer_email text,
  stripe_customer_id text,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  product_slug text,
  product_name text,
  amount_paid integer,           -- in cents (Stripe amount_total)
  currency text,
  payment_status text,
  preorder_status text default 'preordered',
  download_token text unique,
  download_count integer not null default 0,
  last_downloaded_at timestamptz,
  supporter_name_opt_in boolean not null default false,
  supporter_display_name text,
  attribution jsonb not null default '{}'::jsonb,
  notes text
);

create index if not exists book_orders_customer_email_idx on public.book_orders (customer_email);
create index if not exists book_orders_product_slug_idx on public.book_orders (product_slug);
create index if not exists book_orders_payment_status_idx on public.book_orders (payment_status);
create index if not exists book_orders_attribution_source_idx
  on public.book_orders ((attribution->>'source'));

-- RLS on, no policies: service-role only (the webhook), matching the schema.
alter table public.book_orders enable row level security;
