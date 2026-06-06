-- Phase 2: book email list.
-- Applied to the Supabase project as migration `create_book_email_signups`.
-- Kept here for reproducibility / review.

create table if not exists public.book_email_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique,
  name text,
  source_page text,
  consent boolean not null default false,
  notes text
);

create index if not exists book_email_signups_source_page_idx
  on public.book_email_signups (source_page);
create index if not exists book_email_signups_created_at_idx
  on public.book_email_signups (created_at desc);

-- RLS on, no policies: anon/auth roles have no access; the service role
-- (used by /api/book-signup) bypasses RLS. Matches public.book_waitlist.
alter table public.book_email_signups enable row level security;
