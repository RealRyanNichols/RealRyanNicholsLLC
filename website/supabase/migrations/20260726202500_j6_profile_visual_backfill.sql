-- Give every January 6 profile a truthful visual state without inventing a
-- likeness. Missing portraits receive a face-free archive card in the UI;
-- authentic portraits remain gated by identity and publication-rights review.

alter table public.case_people
  add column if not exists photo_alt_text text,
  add column if not exists photo_source_name text,
  add column if not exists photo_source_url text,
  add column if not exists photo_credit text,
  add column if not exists photo_rights_status text,
  add column if not exists photo_identity_status text,
  add column if not exists photo_verification_notes text,
  add column if not exists photo_verified_at timestamptz,
  add column if not exists photo_is_placeholder boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'case_people_photo_rights_status_check'
      and conrelid = 'public.case_people'::regclass
  ) then
    alter table public.case_people
      add constraint case_people_photo_rights_status_check
      check (
        photo_rights_status is null
        or photo_rights_status in (
          'portrait-needed',
          'owner-approved',
          'verified-public-domain',
          'licensed',
          'editorial-source-review',
          'rejected'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'case_people_photo_identity_status_check'
      and conrelid = 'public.case_people'::regclass
  ) then
    alter table public.case_people
      add constraint case_people_photo_identity_status_check
      check (
        photo_identity_status is null
        or photo_identity_status in ('placeholder', 'pending', 'verified', 'rejected')
      );
  end if;
end
$$;

-- Ryan's owner-supplied portrait is the only existing image with enough
-- identity and ownership context to approve in this deterministic pass.
update public.case_people
set
  photo_alt_text = coalesce(
    nullif(trim(photo_alt_text), ''),
    'Ryan Nichols profile photograph in the January 6 case archive'
  ),
  photo_source_name = coalesce(nullif(trim(photo_source_name), ''), 'Ryan Nichols'),
  photo_source_url = coalesce(
    nullif(trim(photo_source_url), ''),
    '/case/people/ryan-nichols'
  ),
  photo_credit = coalesce(nullif(trim(photo_credit), ''), 'Owner-supplied photograph'),
  photo_rights_status = 'owner-approved',
  photo_identity_status = 'verified',
  photo_verification_notes = coalesce(
    nullif(trim(photo_verification_notes), ''),
    'Identity and publication approval confirmed by the profile owner.'
  ),
  photo_verified_at = coalesce(photo_verified_at, now()),
  photo_is_placeholder = false
where is_j6_defendant = true
  and slug = 'ryan-nichols'
  and nullif(trim(coalesce(photo_url, '')), '') is not null;

-- Existing external image hotlinks remain stored for review, but are not
-- presented as cleared portraits until identity and rights are both approved.
update public.case_people
set
  photo_alt_text = coalesce(
    nullif(trim(photo_alt_text), ''),
    name || ' portrait candidate in the January 6 case archive'
  ),
  photo_source_url = coalesce(nullif(trim(photo_source_url), ''), photo_url),
  photo_rights_status = 'editorial-source-review',
  photo_identity_status = 'pending',
  photo_verification_notes = coalesce(
    nullif(trim(photo_verification_notes), ''),
    'Existing external image requires identity and publication-rights review.'
  ),
  photo_verified_at = null,
  photo_is_placeholder = false
where is_j6_defendant = true
  and slug <> 'ryan-nichols'
  and nullif(trim(coalesce(photo_url, '')), '') is not null;

-- Every remaining J6 row gets an explicit, name-specific archive-card state.
-- The card itself is rendered by /api/j6/profile-image/[slug].
update public.case_people
set
  photo_alt_text = 'Archive identity card for ' || name || '; verified portrait not yet available',
  photo_source_name = 'Real Ryan Nichols January 6 Archive',
  photo_source_url = '/case/people/' || slug,
  photo_credit = 'Archive identity card; not a photograph',
  photo_rights_status = 'portrait-needed',
  photo_identity_status = 'placeholder',
  photo_verification_notes = 'Face-free fallback assigned until an authentic portrait and its reuse basis are verified.',
  photo_verified_at = null,
  photo_is_placeholder = true
where is_j6_defendant = true
  and nullif(trim(coalesce(photo_url, '')), '') is null;

create index if not exists case_people_j6_visual_status_idx
  on public.case_people (
    photo_is_placeholder,
    photo_identity_status,
    photo_rights_status
  )
  where is_j6_defendant = true;

comment on column public.case_people.photo_is_placeholder is
  'True only for a face-free archive identity card. Never present this as a photograph.';

comment on column public.case_people.photo_identity_status is
  'Whether the depicted person has been verified independently of publication rights.';

comment on column public.case_people.photo_rights_status is
  'Structured publication-rights state; a portrait is public only for an approved value.';
