-- Transparent monthly funding goal: line items (what donations fund) + a
-- settings singleton + an aggregate snapshot RPC. Donations themselves stay
-- private; only the monthly aggregate is exposed publicly.

create table if not exists public.funding_line_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  blurb text,
  amount_cents integer not null check (amount_cents >= 0),
  cadence text not null default 'monthly' check (cadence in ('monthly','one_time')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funding_settings (
  id text primary key default 'default',
  campaign_title text not null default 'Fund the truth',
  campaign_blurb text,
  -- Offline / untracked gifts (checks, cash, payment-link donations before
  -- Stripe keys are wired) so the public meter stays honest. Admin-maintained.
  manual_raised_cents integer not null default 0 check (manual_raised_cents >= 0),
  manual_note text,
  show_amounts boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.funding_settings (id, campaign_title, campaign_blurb, manual_note)
values (
  'default',
  'Fund the truth',
  'I only raise what I need to live and do this work — and I show you every dollar of it. No middleman, no organization, no overhead. Your donation funds the truth.',
  'Counts card donations this month plus offline gifts I''ve logged. Special gifts are kept private and are not counted here.'
) on conflict (id) do nothing;

-- The exact monthly budget Ryan published. Editable from /admin/donations.
insert into public.funding_line_items (label, blurb, amount_cents, cadence, sort_order) values
  ('Rent', 'Keep a roof over my family while I rebuild.', 140000, 'monthly', 1),
  ('Food', 'Groceries for me and my family.', 50000, 'monthly', 2),
  ('Build tools — Claude Code & Cowork', 'The AI tools I use to build and run every tool on this site.', 21000, 'monthly', 3),
  ('Research — ChatGPT & Codex', 'Writing, research, and code assistance for the work.', 20000, 'monthly', 4);

alter table public.funding_line_items enable row level security;
alter table public.funding_settings enable row level security;

-- Public can read active line items; admins can read all.
drop policy if exists "funding_line_items public read" on public.funding_line_items;
create policy "funding_line_items public read" on public.funding_line_items
  for select using (is_active or is_admin((select auth.uid())));

drop policy if exists "funding_line_items admin write" on public.funding_line_items;
create policy "funding_line_items admin write" on public.funding_line_items
  for all using (is_admin((select auth.uid()))) with check (is_admin((select auth.uid())));

-- Settings row is public-safe (campaign copy + totals only); admins write.
drop policy if exists "funding_settings public read" on public.funding_settings;
create policy "funding_settings public read" on public.funding_settings
  for select using (true);

drop policy if exists "funding_settings admin write" on public.funding_settings;
create policy "funding_settings admin write" on public.funding_settings
  for all using (is_admin((select auth.uid()))) with check (is_admin((select auth.uid())));

-- Aggregate snapshot: current-month donated (non-refunded, non-special) +
-- the manual offline figure. Keeps the donations table private.
create or replace function public.funding_snapshot()
returns table (donated_month_cents bigint, manual_cents integer, raised_cents bigint)
language sql
security definer
set search_path = public
as $$
  with d as (
    select coalesce(sum(amount_cents), 0)::bigint as cents
    from donations
    where refunded_at is null
      and coalesce(campaign, '') <> 'special'
      and created_at >= date_trunc('month', now())
  ),
  m as (
    select coalesce((select manual_raised_cents from funding_settings where id = 'default'), 0) as cents
  )
  select d.cents,
         m.cents,
         (d.cents + m.cents)::bigint
  from d, m;
$$;

revoke all on function public.funding_snapshot() from public;
grant execute on function public.funding_snapshot() to anon, authenticated;
