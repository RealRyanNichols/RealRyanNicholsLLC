create table if not exists public.support_intents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  purpose text not null check (purpose in ('site', 'children', 'officials', 'community', 'needed')),
  intended_amount text check (intended_amount is null or char_length(intended_amount) <= 20),
  display_name text check (display_name is null or char_length(display_name) <= 120),
  email text,
  message text check (message is null or char_length(message) <= 2000),
  publish_message boolean not null default false,
  display_as text not null default 'anonymous' check (display_as in ('name', 'anonymous')),
  show_amount boolean not null default false,
  status text not null default 'started' check (status in ('started', 'paid', 'reviewed', 'published', 'archived')),
  ip_hash text
);

alter table public.support_intents enable row level security;

grant select, update on public.support_intents to authenticated;
grant select, insert, update, delete on public.support_intents to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'support_intents'
      and policyname = 'Admins can read support intents'
  ) then
    create policy "Admins can read support intents"
    on public.support_intents
    for select
    to authenticated
    using (public.is_admin((select auth.uid())));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'support_intents'
      and policyname = 'Admins can update support intents'
  ) then
    create policy "Admins can update support intents"
    on public.support_intents
    for update
    to authenticated
    using (public.is_admin((select auth.uid())))
    with check (public.is_admin((select auth.uid())));
  end if;
end $$;

create index if not exists support_intents_created_at_idx
on public.support_intents (created_at desc);

create index if not exists support_intents_purpose_idx
on public.support_intents (purpose);

create index if not exists support_intents_status_idx
on public.support_intents (status);
