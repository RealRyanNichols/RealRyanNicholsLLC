create table if not exists public.tool_wishes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  public_ref text not null unique,
  tool_name text not null check (char_length(tool_name) between 3 and 160),
  problem text not null check (char_length(problem) between 10 and 2500),
  who_it_helps text check (who_it_helps is null or char_length(who_it_helps) <= 800),
  desired_output text check (desired_output is null or char_length(desired_output) <= 1200),
  current_workaround text check (current_workaround is null or char_length(current_workaround) <= 1200),
  urgency text not null default 'normal' check (urgency in ('normal', 'urgent', 'community')),
  contact_email text check (contact_email is null or char_length(contact_email) <= 254),
  free_slot_number integer,
  pricing_status text not null default 'free_request' check (
    pricing_status in ('free_request', 'paid_quote_required', 'quoted', 'approved', 'built', 'declined')
  ),
  estimated_starting_price_cents integer not null default 0,
  admin_notes text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'queued', 'built', 'quoted', 'declined', 'archived')),
  clue_tags text[] not null default '{}'
);

create index if not exists tool_wishes_created_idx
  on public.tool_wishes (created_at desc);

create index if not exists tool_wishes_user_idx
  on public.tool_wishes (user_id, created_at desc);

create index if not exists tool_wishes_status_idx
  on public.tool_wishes (status, created_at desc);

create index if not exists tool_wishes_clue_tags_idx
  on public.tool_wishes using gin (clue_tags);

grant select, insert on public.tool_wishes to authenticated;
grant select, insert, update, delete on public.tool_wishes to service_role;

alter table public.tool_wishes enable row level security;

drop policy if exists tool_wishes_owner_read on public.tool_wishes;
create policy tool_wishes_owner_read
on public.tool_wishes
for select
to authenticated
using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

drop policy if exists tool_wishes_owner_insert on public.tool_wishes;
create policy tool_wishes_owner_insert
on public.tool_wishes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists tool_wishes_admin_update on public.tool_wishes;
create policy tool_wishes_admin_update
on public.tool_wishes
for update
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));
