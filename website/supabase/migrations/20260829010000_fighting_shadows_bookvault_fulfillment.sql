-- Fighting Shadows Bookvault fulfillment queue.
-- This migration stores operational state only. Customer shipping details remain
-- in Stripe and are retrieved server-side only when an approved order is released.

create table if not exists public.book_fulfillment_settings (
  id boolean primary key default true check (id),
  hold_enabled boolean not null default true,
  proof_approved boolean not null default false,
  live_release_enabled boolean not null default false,
  hold_reason text not null default 'Waiting for approved print files, proof copies, ISBN assignment, and Bookvault credentials.',
  proof_approved_at timestamptz,
  proof_approved_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.book_fulfillment_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.book_fulfillments (
  id uuid primary key default gen_random_uuid(),
  book_order_id uuid not null unique references public.book_orders(id) on delete restrict,
  provider text not null default 'bookvault' check (provider = 'bookvault'),
  product_slug text not null,
  edition text not null check (edition in ('paperback', 'hardcover', 'unresolved')),
  isbn text check (isbn is null or isbn ~ '^[0-9]{13}$'),
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'held' check (
    status in (
      'held',
      'blocked_missing_isbn',
      'blocked_edition',
      'ready',
      'validating',
      'validated',
      'submitting',
      'submitted',
      'acknowledged',
      'sent_to_print',
      'batched',
      'printed',
      'dispatched',
      'invoiced',
      'failed',
      'canceled'
    )
  ),
  hold_reason text,
  idempotency_key text not null unique,
  doc_ref text not null unique check (char_length(doc_ref) <= 90),
  pod_ref bigint unique,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  last_error text,
  currency text,
  production_cost numeric(12, 2),
  dispatch_cost numeric(12, 2),
  tax numeric(12, 2),
  grand_total numeric(12, 2),
  shipping_service text,
  tracking_number text,
  tracking_url text,
  submitted_at timestamptz,
  dispatched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists book_fulfillments_status_idx
  on public.book_fulfillments (status, next_retry_at);
create index if not exists book_fulfillments_created_at_idx
  on public.book_fulfillments (created_at desc);

create table if not exists public.book_fulfillment_events (
  id uuid primary key default gen_random_uuid(),
  book_fulfillment_id uuid not null references public.book_fulfillments(id) on delete cascade,
  event_type text not null,
  provider_status text,
  safe_detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on column public.book_fulfillment_events.safe_detail is
  'Operational metadata only. Never store names, emails, phone numbers, addresses, API keys, or raw provider responses.';

create index if not exists book_fulfillment_events_fulfillment_idx
  on public.book_fulfillment_events (book_fulfillment_id, created_at desc);

alter table public.book_fulfillment_settings enable row level security;
alter table public.book_fulfillments enable row level security;
alter table public.book_fulfillment_events enable row level security;

revoke all on public.book_fulfillment_settings from anon, authenticated;
revoke all on public.book_fulfillments from anon, authenticated;
revoke all on public.book_fulfillment_events from anon, authenticated;
