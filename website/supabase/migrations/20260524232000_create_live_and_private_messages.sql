create table if not exists public.live_comments (
  id uuid primary key default gen_random_uuid(),
  live_stream_id uuid not null references public.live_streams(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'approved' check (status in ('approved', 'hidden', 'deleted')),
  ip_hash text check (ip_hash is null or char_length(ip_hash) = 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists live_comments_stream_created_idx
  on public.live_comments (live_stream_id, created_at desc);

create index if not exists live_comments_status_idx
  on public.live_comments (status);

grant select on public.live_comments to anon, authenticated;
grant insert on public.live_comments to anon, authenticated;
grant select, insert, update, delete on public.live_comments to service_role;

alter table public.live_comments enable row level security;

drop policy if exists live_comments_public_read on public.live_comments;
create policy live_comments_public_read
on public.live_comments
for select
to anon, authenticated
using (status = 'approved');

drop policy if exists live_comments_public_insert on public.live_comments;
create policy live_comments_public_insert
on public.live_comments
for insert
to anon, authenticated
with check (
  status = 'approved'
  and char_length(body) between 1 and 1000
  and (display_name is null or char_length(display_name) <= 80)
  and ip_hash is not null
  and char_length(ip_hash) = 64
);

drop policy if exists live_comments_admin_all on public.live_comments;
create policy live_comments_admin_all
on public.live_comments
for all
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));

create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text check (display_name is null or char_length(display_name) <= 120),
  email text,
  phone text check (phone is null or char_length(phone) <= 40),
  subject text check (subject is null or char_length(subject) <= 160),
  message text not null check (char_length(message) between 1 and 4000),
  source_path text check (source_path is null or char_length(source_path) <= 300),
  status text not null default 'new' check (status in ('new', 'reviewed', 'replied', 'archived')),
  ip_hash text check (ip_hash is null or char_length(ip_hash) = 64)
);

create index if not exists private_messages_created_idx
  on public.private_messages (created_at desc);

create index if not exists private_messages_status_idx
  on public.private_messages (status, created_at desc);

grant insert on public.private_messages to anon, authenticated;
grant select, update on public.private_messages to authenticated;
grant select, insert, update, delete on public.private_messages to service_role;

alter table public.private_messages enable row level security;

drop policy if exists private_messages_public_insert on public.private_messages;
create policy private_messages_public_insert
on public.private_messages
for insert
to anon, authenticated
with check (
  status = 'new'
  and char_length(message) between 1 and 4000
  and (display_name is null or char_length(display_name) <= 120)
  and (phone is null or char_length(phone) <= 40)
  and (subject is null or char_length(subject) <= 160)
  and (source_path is null or char_length(source_path) <= 300)
  and ip_hash is not null
  and char_length(ip_hash) = 64
);

drop policy if exists private_messages_admin_read on public.private_messages;
create policy private_messages_admin_read
on public.private_messages
for select
to authenticated
using (public.is_admin((select auth.uid())));

drop policy if exists private_messages_admin_update on public.private_messages;
create policy private_messages_admin_update
on public.private_messages
for update
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));
