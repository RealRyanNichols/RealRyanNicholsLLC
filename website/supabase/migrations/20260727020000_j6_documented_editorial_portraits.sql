-- Permit a narrowly defined editorial-display state without describing the
-- underlying image as licensed, public domain, owner approved, or reusable.

alter table public.case_people
  drop constraint if exists case_people_photo_rights_status_check;

alter table public.case_people
  add constraint case_people_photo_rights_status_check
  check (
    photo_rights_status is null
    or photo_rights_status in (
      'portrait-needed',
      'owner-approved',
      'verified-public-domain',
      'licensed',
      'documented-editorial-use',
      'editorial-source-review',
      'rejected'
    )
  );

comment on constraint case_people_photo_rights_status_check
  on public.case_people is
  'Allowed portrait review states. documented-editorial-use is distinct from licensed, public-domain, and owner-approved images.';

comment on column public.case_people.photo_rights_status is
  'Publication state. documented-editorial-use means identity and source are documented for archive reporting; it does not claim a license, public-domain status, or downstream reuse permission.';
