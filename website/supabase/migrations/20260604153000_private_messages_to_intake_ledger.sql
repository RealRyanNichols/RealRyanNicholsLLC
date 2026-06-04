alter table public.intake_items
  drop constraint if exists intake_items_source_type_check;

alter table public.intake_items
  add constraint intake_items_source_type_check
  check (source_type in ('tip', 'submission', 'tool', 'private_message'));

create or replace function private.intake_status_from_private_message(p_status text)
returns text
language sql
stable
as $$
  select case
    when p_status = 'archived' then 'merged'
    when p_status in ('reviewed', 'replied') then 'needs_verification'
    else 'received'
  end;
$$;

create or replace function private.private_message_public_category(
  p_subject text,
  p_source_path text
)
returns text
language sql
stable
as $$
  select case
    when coalesce(p_subject, '') ilike 'Story web:%' then 'story'
    when coalesce(p_source_path, '') ilike '%contact%' then 'contact'
    when coalesce(p_source_path, '') ilike '%tell-your-story%' then 'story'
    when coalesce(p_source_path, '') ilike '%store%' then 'service_question'
    else 'private_message'
  end;
$$;

create or replace function private.upsert_intake_from_private_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_category text;
  v_public_status text;
  v_summary text;
begin
  v_category := private.private_message_public_category(new.subject, new.source_path);
  v_public_status := private.intake_status_from_private_message(coalesce(new.status, 'new'));
  v_summary :=
    case v_category
      when 'story' then 'A private story intake was received.'
      when 'contact' then 'A private contact message was received.'
      when 'service_question' then 'A private service question was received.'
      else 'A private message was received.'
    end ||
    ' The body, contact information, and identifying details stay in the private admin inbox. The public receipt shows action happened and can be connected after review.';

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
    visibility,
    created_at,
    last_action_at
  )
  values (
    'private_message',
    new.id,
    private.intake_public_ref(new.id, 'MSG'),
    v_category,
    case
      when v_category = 'story' then 'Private story lead'
      when v_category = 'contact' then 'Private contact message'
      when v_category = 'service_question' then 'Private service question'
      else 'Private message'
    end,
    null,
    v_summary,
    coalesce(new.status, 'new'),
    v_public_status,
    private.intake_tags('private_message', v_category, null, new.source_path),
    'public',
    new.created_at,
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
    clue_tags = excluded.clue_tags,
    visibility = excluded.visibility;

  return new;
end;
$$;

drop trigger if exists private_messages_intake_after_insert_update on public.private_messages;
create trigger private_messages_intake_after_insert_update
after insert or update of status, subject, source_path
on public.private_messages
for each row
execute function private.upsert_intake_from_private_message();

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
  visibility,
  created_at,
  last_action_at
)
select
  'private_message',
  m.id,
  private.intake_public_ref(m.id, 'MSG'),
  private.private_message_public_category(m.subject, m.source_path),
  case
    when private.private_message_public_category(m.subject, m.source_path) = 'story' then 'Private story lead'
    when private.private_message_public_category(m.subject, m.source_path) = 'contact' then 'Private contact message'
    when private.private_message_public_category(m.subject, m.source_path) = 'service_question' then 'Private service question'
    else 'Private message'
  end,
  null,
  case private.private_message_public_category(m.subject, m.source_path)
    when 'story' then 'A private story intake was received.'
    when 'contact' then 'A private contact message was received.'
    when 'service_question' then 'A private service question was received.'
    else 'A private message was received.'
  end || ' The body, contact information, and identifying details stay in the private admin inbox. The public receipt shows action happened and can be connected after review.',
  coalesce(m.status, 'new'),
  private.intake_status_from_private_message(coalesce(m.status, 'new')),
  private.intake_tags(
    'private_message',
    private.private_message_public_category(m.subject, m.source_path),
    null,
    m.source_path
  ),
  'public',
  m.created_at,
  coalesce(m.updated_at, m.created_at)
from public.private_messages m
on conflict (source_type, source_id)
where source_id is not null
do nothing;
