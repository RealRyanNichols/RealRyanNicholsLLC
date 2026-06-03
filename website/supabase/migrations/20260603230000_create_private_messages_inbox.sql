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
  ip_hash text check (ip_hash is null or char_length(ip_hash) = 64),
  session_id text check (session_id is null or char_length(session_id) <= 64),
  visitor_hash text check (visitor_hash is null or char_length(visitor_hash) <= 64)
);

create index if not exists private_messages_created_idx
  on public.private_messages (created_at desc);

create index if not exists private_messages_status_idx
  on public.private_messages (status, created_at desc);

create index if not exists private_messages_visitor_hash_idx
  on public.private_messages (visitor_hash, created_at desc)
  where visitor_hash is not null;

create index if not exists private_messages_session_id_idx
  on public.private_messages (session_id, created_at desc)
  where session_id is not null;

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
  and (session_id is null or char_length(session_id) <= 64)
  and (visitor_hash is null or char_length(visitor_hash) <= 64)
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
