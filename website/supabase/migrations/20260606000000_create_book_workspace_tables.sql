-- Private book workspace tables (OPTIONAL / secondary storage).
--
-- The primary store for the memoir is the private markdown workspace at the repo
-- root (/content/book/). These tables exist only if/when book content is also
-- managed in the database.
--
-- SAFETY:
--   * RLS is ENABLED on every table and NO policies are defined, so the anon and
--     authenticated roles have NO access. Only the service role (which bypasses
--     RLS) can read/write — the same private pattern used by book_orders. Reach
--     these only from server code behind the is_admin gate.
--   * Do NOT add public read policies to these tables.
--   * This migration is intentionally NOT applied automatically. Apply it
--     deliberately (supabase db push / apply_migration) only when you want DB
--     storage. Creating the tables is harmless (they start empty).

-- book_memos ----------------------------------------------------------------
create table if not exists public.book_memos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text,
  slug text,
  source_date text,            -- fuzzy dates allowed ("mid-Dec 2020")
  source_type text,
  raw_text text,
  cleaned_summary text,
  time_period text,
  related_chapter text,
  related_people text[] default '{}',
  evidence_needed text[] default '{}',
  caution_level text default 'high',
  privacy text default 'private',
  status text default 'raw_source',
  tags text[] default '{}',
  notes text
);

-- book_people ---------------------------------------------------------------
create table if not exists public.book_people (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text,
  aliases text[] default '{}',
  profile_type text,
  relationship_to_ryan text,
  summary text,
  source_notes text,
  related_chapters text[] default '{}',
  related_memos text[] default '{}',
  related_evidence text[] default '{}',
  caution_level text default 'high',
  privacy text default 'private',
  status text default 'needs_evidence',
  allegations text,
  evidence_needed text[] default '{}',
  notes text
);

-- book_evidence -------------------------------------------------------------
create table if not exists public.book_evidence (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  evidence_id text,
  title text,
  evidence_type text,
  event_date text,
  source_url text,
  file_path text,
  related_chapter text,
  related_people text[] default '{}',
  related_memos text[] default '{}',
  public_status text default 'private',
  verification_status text default 'needs_evidence',
  notes text
);

-- book_timeline_events ------------------------------------------------------
create table if not exists public.book_timeline_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_date text,
  event_date_precision text,   -- exact | approximate | needs_verification
  title text,
  description text,
  related_chapter text,
  related_people text[] default '{}',
  related_memos text[] default '{}',
  related_evidence text[] default '{}',
  confidence_level text default 'recollection',
  notes text
);

-- book_chapters -------------------------------------------------------------
create table if not exists public.book_chapters (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  chapter_number int,
  slug text,
  title text,
  summary text,
  draft_text text,
  status text default 'stub',
  word_count int default 0,
  evidence_needed text[] default '{}',
  legal_review_needed boolean not null default true,
  public_preview_enabled boolean not null default false,
  notes text
);

-- Indexes -------------------------------------------------------------------
create index if not exists book_memos_slug_idx on public.book_memos (slug);
create index if not exists book_memos_source_date_idx on public.book_memos (source_date);
create index if not exists book_memos_caution_level_idx on public.book_memos (caution_level);
create index if not exists book_people_name_idx on public.book_people (name);
create index if not exists book_evidence_evidence_id_idx on public.book_evidence (evidence_id);
create index if not exists book_timeline_events_event_date_idx on public.book_timeline_events (event_date);
create index if not exists book_chapters_slug_idx on public.book_chapters (slug);

-- RLS: enabled, NO policies => service-role only (no anon/authenticated access).
alter table public.book_memos          enable row level security;
alter table public.book_people         enable row level security;
alter table public.book_evidence       enable row level security;
alter table public.book_timeline_events enable row level security;
alter table public.book_chapters       enable row level security;
