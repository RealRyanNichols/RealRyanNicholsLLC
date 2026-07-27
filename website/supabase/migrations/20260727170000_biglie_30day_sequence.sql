-- The BIG Lie 30-day email sequence: per-subscriber send state and poll answers.
-- Subscribers come from book_email_signups (source_page LIKE 'thebiglie%').

create table if not exists public.biglie_sequence_state (
  email text primary key,
  joined_at timestamptz not null default now(),
  last_day_sent integer not null default 0,
  last_sent_at timestamptz,
  completed boolean not null default false,
  stopped boolean not null default false,
  stopped_at timestamptz,
  send_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.biglie_answers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  day integer not null,
  question_key text not null,
  answer text not null,
  answered_at timestamptz not null default now(),
  unique (email, day, question_key)
);

create index if not exists biglie_answers_email_idx on public.biglie_answers (email);
create index if not exists biglie_answers_day_idx on public.biglie_answers (day);
create index if not exists biglie_state_pending_idx
  on public.biglie_sequence_state (completed, stopped, last_day_sent);

alter table public.biglie_sequence_state enable row level security;
alter table public.biglie_answers enable row level security;
-- Service-role only; no anon policies on purpose.
