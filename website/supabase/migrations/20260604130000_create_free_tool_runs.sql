alter table public.intake_items
  drop constraint if exists intake_items_source_type_check;

alter table public.intake_items
  add constraint intake_items_source_type_check
  check (source_type in ('tip', 'submission', 'tool'));

create table if not exists public.free_tool_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tool_slug text not null check (
    tool_slug in ('records-request', 'timeline-builder', 'next-three-moves')
  ),
  public_ref text not null unique,
  display_name text check (display_name is null or char_length(display_name) <= 120),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 60),
  community text check (community is null or char_length(community) <= 180),
  location text check (location is null or char_length(location) <= 180),
  subject text check (subject is null or char_length(subject) <= 220),
  privacy_level text not null default 'private' check (privacy_level in ('private', 'public_summary')),
  input_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  clue_tags text[] not null default '{}',
  ip_hash text check (ip_hash is null or char_length(ip_hash) = 64),
  status text not null default 'new' check (status in ('new', 'reviewed', 'converted', 'archived'))
);

create index if not exists free_tool_runs_created_idx
  on public.free_tool_runs (created_at desc);

create index if not exists free_tool_runs_tool_idx
  on public.free_tool_runs (tool_slug, created_at desc);

create index if not exists free_tool_runs_status_idx
  on public.free_tool_runs (status, created_at desc);

create index if not exists free_tool_runs_clue_tags_idx
  on public.free_tool_runs using gin (clue_tags);

grant select, update on public.free_tool_runs to authenticated;
grant select, insert, update, delete on public.free_tool_runs to service_role;

alter table public.free_tool_runs enable row level security;

drop policy if exists free_tool_runs_admin_read on public.free_tool_runs;
create policy free_tool_runs_admin_read
on public.free_tool_runs
for select
to authenticated
using (public.is_admin((select auth.uid())));

drop policy if exists free_tool_runs_admin_update on public.free_tool_runs;
create policy free_tool_runs_admin_update
on public.free_tool_runs
for update
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));
