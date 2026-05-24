create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  category text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'ended', 'errored', 'disabled')),
  provider text not null default 'mux',
  mux_live_stream_id text unique,
  mux_playback_id text,
  mux_status text,
  mux_asset_id text,
  announce_count integer not null default 0,
  last_announced_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists live_streams_status_created_idx
  on public.live_streams (status, created_at desc);

create index if not exists live_streams_mux_live_stream_id_idx
  on public.live_streams (mux_live_stream_id);

create table if not exists public.live_simulcast_targets (
  id uuid primary key default gen_random_uuid(),
  live_stream_id uuid not null references public.live_streams(id) on delete cascade,
  platform text not null,
  label text not null,
  mux_simulcast_target_id text unique,
  status text not null default 'created',
  enabled boolean not null default true,
  destination_host text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists live_simulcast_targets_stream_idx
  on public.live_simulcast_targets (live_stream_id, created_at desc);

grant select on public.live_streams to anon;
grant select, insert, update, delete on public.live_streams to authenticated;
grant all on public.live_streams to service_role;

grant select, insert, update, delete on public.live_simulcast_targets to authenticated;
grant all on public.live_simulcast_targets to service_role;

alter table public.live_streams enable row level security;
alter table public.live_simulcast_targets enable row level security;

drop policy if exists live_streams_public_read on public.live_streams;
create policy live_streams_public_read
on public.live_streams
for select
to anon, authenticated
using (status in ('scheduled', 'live', 'ended'));

drop policy if exists live_streams_admin_all on public.live_streams;
create policy live_streams_admin_all
on public.live_streams
for all
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));

drop policy if exists live_simulcast_targets_admin_all on public.live_simulcast_targets;
create policy live_simulcast_targets_admin_all
on public.live_simulcast_targets
for all
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));
