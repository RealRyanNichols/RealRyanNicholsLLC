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

update public.intake_items
set
  subject = 'Evidence submission',
  public_summary = 'A claimant submitted ' || category ||
    ' evidence to the case archive. It is now in the intake ledger for review, verification, and connection mapping.',
  clue_tags = private.intake_tags('submission', category, 'Evidence submission', null),
  updated_at = now()
where source_type = 'submission';
