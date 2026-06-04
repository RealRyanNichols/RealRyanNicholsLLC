create table if not exists public.intake_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_action_at timestamptz not null default now(),
  source_type text not null check (source_type in ('tip', 'submission')),
  source_id uuid,
  public_ref text not null unique,
  category text not null default 'other',
  subject text,
  location text,
  public_summary text not null,
  source_status text not null default 'pending',
  public_status text not null default 'received' check (
    public_status in ('received', 'triage', 'needs_verification', 'verified', 'merged', 'rejected')
  ),
  verify_count integer not null default 0 check (verify_count >= 0),
  dispute_count integer not null default 0 check (dispute_count >= 0),
  context_count integer not null default 0 check (context_count >= 0),
  connection_count integer not null default 0 check (connection_count >= 0),
  clue_tags text[] not null default '{}',
  visibility text not null default 'public' check (visibility in ('public', 'private'))
);

create unique index if not exists intake_items_source_unique
  on public.intake_items (source_type, source_id)
  where source_id is not null;

create index if not exists intake_items_public_feed_idx
  on public.intake_items (visibility, public_status, created_at desc);

create index if not exists intake_items_clue_tags_idx
  on public.intake_items using gin (clue_tags);

create table if not exists public.intake_verifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  intake_item_id uuid not null references public.intake_items(id) on delete cascade,
  action text not null check (action in ('verify', 'dispute', 'context')),
  note text,
  display_name text,
  email text,
  ip_hash text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'hidden'))
);

create index if not exists intake_verifications_item_idx
  on public.intake_verifications (intake_item_id, created_at desc);

create index if not exists intake_verifications_action_idx
  on public.intake_verifications (action, created_at desc);

grant select on public.intake_items to authenticated;
grant select, insert, update, delete on public.intake_items to service_role;
grant insert on public.intake_verifications to anon, authenticated;
grant select, insert, update, delete on public.intake_verifications to service_role;

alter table public.intake_items enable row level security;
alter table public.intake_verifications enable row level security;

drop policy if exists intake_items_admin_all on public.intake_items;
create policy intake_items_admin_all
on public.intake_items
for all
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));

drop policy if exists intake_verifications_public_insert on public.intake_verifications;
create policy intake_verifications_public_insert
on public.intake_verifications
for insert
to anon, authenticated
with check (
  action in ('verify', 'dispute', 'context')
  and (note is null or char_length(note) <= 2000)
  and (display_name is null or char_length(display_name) <= 120)
  and (email is null or char_length(email) <= 254)
);

drop policy if exists intake_verifications_admin_all on public.intake_verifications;
create policy intake_verifications_admin_all
on public.intake_verifications
for all
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));

create schema if not exists private;

create or replace function private.intake_public_ref(p_id uuid, p_prefix text)
returns text
language sql
stable
as $$
  select upper(coalesce(nullif(p_prefix, ''), 'RRN')) || '-' || upper(substr(replace(p_id::text, '-', ''), 1, 8));
$$;

create or replace function private.intake_status_from_tip(p_status text)
returns text
language sql
stable
as $$
  select case
    when p_status = 'merged' then 'merged'
    when p_status = 'rejected' then 'rejected'
    when p_status = 'reviewed' then 'needs_verification'
    else 'received'
  end;
$$;

create or replace function private.intake_status_from_submission(p_status text)
returns text
language sql
stable
as $$
  select case
    when p_status = 'approved' then 'verified'
    when p_status = 'rejected' then 'rejected'
    else 'received'
  end;
$$;

create or replace function private.intake_tags(
  p_source_type text,
  p_category text,
  p_subject text,
  p_location text
)
returns text[]
language sql
stable
as $$
  select array_remove(array[
    lower(nullif(p_source_type, '')),
    lower(nullif(p_category, '')),
    lower(nullif(split_part(coalesce(p_subject, ''), ' ', 1), '')),
    lower(nullif(p_location, ''))
  ], null);
$$;

create or replace function private.upsert_intake_from_tip()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subject text;
  v_category text;
  v_location text;
  v_summary text;
begin
  v_subject := nullif(trim(coalesce(new.defendant_name, '')), '');
  v_category := nullif(trim(coalesce(new.category, 'other')), '');
  v_location := nullif(trim(coalesce(new.location, '')), '');
  v_summary :=
    case
      when v_subject is not null then
        'A ' || coalesce(v_category, 'other') || ' tip was received about ' || v_subject || '.'
      else
        'A ' || coalesce(v_category, 'other') || ' tip was received.'
    end ||
    ' It is now in the intake ledger for review, verification, and connection mapping.';

  insert into public.intake_items (
    source_type,
    source_id,
    public_ref,
    category,
    subject,
    location,
    public_summary,
    source_status,
    public_status,
    clue_tags,
    last_action_at
  )
  values (
    'tip',
    new.id,
    private.intake_public_ref(new.id, 'TIP'),
    coalesce(v_category, 'other'),
    v_subject,
    v_location,
    v_summary,
    coalesce(new.status, 'pending'),
    private.intake_status_from_tip(coalesce(new.status, 'pending')),
    private.intake_tags('tip', coalesce(v_category, 'other'), v_subject, v_location),
    now()
  )
  on conflict (source_type, source_id)
  where source_id is not null
  do update set
    updated_at = now(),
    last_action_at = now(),
    category = excluded.category,
    subject = excluded.subject,
    location = excluded.location,
    public_summary = excluded.public_summary,
    source_status = excluded.source_status,
    public_status = excluded.public_status,
    clue_tags = excluded.clue_tags;

  return new;
end;
$$;

create or replace function private.upsert_intake_from_submission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_category text;
  v_subject text;
  v_summary text;
begin
  if new.submitted_by_user_id is null then
    return new;
  end if;

  v_category := coalesce(nullif(new.media_kind, ''), nullif(new.doc_type::text, ''), 'evidence');
  v_subject := 'Evidence submission';
  v_summary :=
    'A claimant submitted ' || v_category ||
    ' evidence to the case archive. It is now in the intake ledger for review, verification, and connection mapping.';

  insert into public.intake_items (
    source_type,
    source_id,
    public_ref,
    category,
    subject,
    location,
    public_summary,
    source_status,
    public_status,
    clue_tags,
    last_action_at
  )
  values (
    'submission',
    new.id,
    private.intake_public_ref(new.id, 'SUB'),
    v_category,
    v_subject,
    null,
    v_summary,
    coalesce(new.submission_status, 'pending'),
    private.intake_status_from_submission(coalesce(new.submission_status, 'pending')),
    private.intake_tags('submission', v_category, v_subject, null),
    now()
  )
  on conflict (source_type, source_id)
  where source_id is not null
  do update set
    updated_at = now(),
    last_action_at = now(),
    category = excluded.category,
    subject = excluded.subject,
    public_summary = excluded.public_summary,
    source_status = excluded.source_status,
    public_status = excluded.public_status,
    clue_tags = excluded.clue_tags;

  return new;
end;
$$;

drop trigger if exists case_tips_intake_after_insert_update on public.case_tips;
create trigger case_tips_intake_after_insert_update
after insert or update of status, category, defendant_name, location
on public.case_tips
for each row
execute function private.upsert_intake_from_tip();

drop trigger if exists case_documents_intake_after_insert_update on public.case_documents;
create trigger case_documents_intake_after_insert_update
after insert or update of submission_status, title, media_kind, doc_type, submitted_by_user_id
on public.case_documents
for each row
when (new.submitted_by_user_id is not null)
execute function private.upsert_intake_from_submission();

insert into public.intake_items (
  source_type,
  source_id,
  public_ref,
  category,
  subject,
  location,
  public_summary,
  source_status,
  public_status,
  clue_tags,
  created_at,
  last_action_at
)
select
  'tip',
  t.id,
  private.intake_public_ref(t.id, 'TIP'),
  coalesce(nullif(trim(coalesce(t.category, 'other')), ''), 'other'),
  nullif(trim(coalesce(t.defendant_name, '')), ''),
  nullif(trim(coalesce(t.location, '')), ''),
  case
    when nullif(trim(coalesce(t.defendant_name, '')), '') is not null then
      'A ' || coalesce(nullif(trim(coalesce(t.category, 'other')), ''), 'other') ||
      ' tip was received about ' || nullif(trim(coalesce(t.defendant_name, '')), '') || '.'
    else
      'A ' || coalesce(nullif(trim(coalesce(t.category, 'other')), ''), 'other') || ' tip was received.'
  end || ' It is now in the intake ledger for review, verification, and connection mapping.',
  coalesce(t.status, 'pending'),
  private.intake_status_from_tip(coalesce(t.status, 'pending')),
  private.intake_tags(
    'tip',
    coalesce(nullif(trim(coalesce(t.category, 'other')), ''), 'other'),
    nullif(trim(coalesce(t.defendant_name, '')), ''),
    nullif(trim(coalesce(t.location, '')), '')
  ),
  t.created_at,
  coalesce(t.reviewed_at, t.created_at)
from public.case_tips t
on conflict (source_type, source_id)
where source_id is not null
do nothing;

insert into public.intake_items (
  source_type,
  source_id,
  public_ref,
  category,
  subject,
  location,
  public_summary,
  source_status,
  public_status,
  clue_tags,
  created_at,
  last_action_at
)
select
  'submission',
  d.id,
  private.intake_public_ref(d.id, 'SUB'),
  coalesce(nullif(d.media_kind, ''), nullif(d.doc_type::text, ''), 'evidence'),
  'Evidence submission',
  null,
  'A claimant submitted ' || coalesce(nullif(d.media_kind, ''), nullif(d.doc_type::text, ''), 'evidence') ||
    ' evidence to the case archive. It is now in the intake ledger for review, verification, and connection mapping.',
  coalesce(d.submission_status, 'pending'),
  private.intake_status_from_submission(coalesce(d.submission_status, 'pending')),
  private.intake_tags(
    'submission',
    coalesce(nullif(d.media_kind, ''), nullif(d.doc_type::text, ''), 'evidence'),
    'Evidence submission',
    null
  ),
  d.created_at,
  coalesce(d.curated_at, d.created_at)
from public.case_documents d
where d.submitted_by_user_id is not null
on conflict (source_type, source_id)
where source_id is not null
do nothing;
