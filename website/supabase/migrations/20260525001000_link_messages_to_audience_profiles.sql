alter table public.live_comments
  add column if not exists session_id text check (session_id is null or char_length(session_id) <= 64),
  add column if not exists visitor_hash text check (visitor_hash is null or char_length(visitor_hash) <= 64);

create index if not exists live_comments_visitor_hash_idx
  on public.live_comments (visitor_hash, created_at desc)
  where visitor_hash is not null;

create index if not exists live_comments_session_id_idx
  on public.live_comments (session_id, created_at desc)
  where session_id is not null;

alter table public.private_messages
  add column if not exists session_id text check (session_id is null or char_length(session_id) <= 64),
  add column if not exists visitor_hash text check (visitor_hash is null or char_length(visitor_hash) <= 64);

create index if not exists private_messages_visitor_hash_idx
  on public.private_messages (visitor_hash, created_at desc)
  where visitor_hash is not null;

create index if not exists private_messages_session_id_idx
  on public.private_messages (session_id, created_at desc)
  where session_id is not null;
