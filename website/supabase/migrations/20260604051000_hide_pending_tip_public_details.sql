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
  v_public_status text;
  v_public_subject text;
  v_public_location text;
  v_summary text;
begin
  v_subject := nullif(trim(coalesce(new.defendant_name, '')), '');
  v_category := nullif(trim(coalesce(new.category, 'other')), '');
  v_location := nullif(trim(coalesce(new.location, '')), '');
  v_public_status := private.intake_status_from_tip(coalesce(new.status, 'pending'));
  v_public_subject := case when v_public_status = 'received' then null else v_subject end;
  v_public_location := case when v_public_status = 'received' then null else v_location end;
  v_summary :=
    case
      when v_public_subject is not null then
        'A ' || coalesce(v_category, 'other') || ' tip was received about ' || v_public_subject || '.'
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
    v_public_subject,
    v_public_location,
    v_summary,
    coalesce(new.status, 'pending'),
    v_public_status,
    private.intake_tags('tip', coalesce(v_category, 'other'), v_public_subject, v_public_location),
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

update public.intake_items
set
  subject = null,
  location = null,
  public_summary = 'A ' || category ||
    ' tip was received. It is now in the intake ledger for review, verification, and connection mapping.',
  clue_tags = private.intake_tags('tip', category, null, null),
  updated_at = now()
where source_type = 'tip'
  and public_status = 'received';
