-- Stripe money layer: products, orders, order_items, donations, stripe_events,
-- profiles extension, and the verified-J6 helper. Applied to the project via
-- the Supabase MCP; committed here for reproducibility.

-- products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  type text not null check (type in ('physical','digital','service')),
  stripe_product_id text unique,
  stripe_price_id text unique,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  inventory integer,
  fulfillment_notes text,
  active boolean not null default false,
  monthly_cap integer,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
drop policy if exists "products:public read active" on public.products;
create policy "products:public read active" on public.products
  for select using (active = true);

-- orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  stripe_payment_intent text,
  user_id uuid references auth.users(id),
  email text,
  name text,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending','paid','fulfilled','refunded','canceled','j6_free')),
  shipping_json jsonb,
  fulfilled_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
drop policy if exists "orders:owner read" on public.orders;
create policy "orders:owner read" on public.orders
  for select using (user_id = auth.uid());

-- order_items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_slug text,
  qty integer not null check (qty > 0),
  unit_amount_cents integer not null
);
alter table public.order_items enable row level security;

-- donations
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  stripe_payment_intent text unique,
  email text,
  name text,
  amount_cents integer not null,
  currency text not null default 'usd',
  recurring boolean not null default false,
  campaign text,
  source text,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.donations enable row level security;

-- stripe_events (idempotency log)
create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);
alter table public.stripe_events enable row level security;

-- profiles extension (stripe_customer_id / stripe_subscription_id may already
-- exist; if-not-exists keeps this safe and idempotent)
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists supporter_canceled_at timestamptz;

-- J6-verified helper (used by API + UI to gate the free path)
create or replace function public.is_verified_j6_defendant(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.case_people
    where claimed_by_user_id = uid
      and is_j6_defendant = true
      and claim_status = 'verified'
      and claim_verified_at is not null
  );
$$;
grant execute on function public.is_verified_j6_defendant(uuid) to authenticated, anon;
