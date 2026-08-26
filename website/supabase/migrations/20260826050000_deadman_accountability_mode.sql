-- Deadman's Switch v3: enforce evidence-led accountability, keep sensitive
-- research private, and prevent unsupported allegations from reaching the
-- hourly public release path.

alter table public.deadman_incidents
  add column if not exists editorial_mode text not null
    default 'evidence_led_accountability_v3';

alter table public.deadman_updates
  add column if not exists editorial_mode text not null
    default 'evidence_led_accountability_v3',
  add column if not exists evidence_strength text not null
    default 'single_public_source'
    check (evidence_strength in (
      'primary_record',
      'corroborated',
      'direct_confirmation',
      'single_public_source',
      'no_new_information'
    )),
  add column if not exists accountability_targets text[] not null
    default array['Harrison County public agencies']::text[],
  add column if not exists related_topics text[] not null default '{}'::text[],
  add column if not exists claim_labels jsonb not null default jsonb_build_object(
    'verified_facts', '[]'::jsonb,
    'attributed_allegations', '[]'::jsonb,
    'editorial_inferences', '[]'::jsonb,
    'advocacy_positions', '[]'::jsonb,
    'unresolved_questions', '[]'::jsonb
  ),
  add column if not exists official_response_status text not null
    default 'not_requested'
    check (official_response_status in (
      'not_requested', 'requested', 'received', 'declined', 'no_response', 'not_applicable'
    )),
  add column if not exists priority smallint not null default 50
    check (priority between 1 and 100),
  add column if not exists expires_at timestamptz,
  add column if not exists supersedes_update_id uuid
    references public.deadman_updates(id) on delete set null,
  add column if not exists correction_summary text,
  add column if not exists validation_version text not null
    default 'accountability-v3',
  add column if not exists validated_at timestamptz;

create index if not exists deadman_updates_ready_priority_idx
  on public.deadman_updates (incident_id, status, priority desc, sequence_no)
  where status = 'ready';

create index if not exists deadman_updates_expires_idx
  on public.deadman_updates (expires_at)
  where status = 'ready' and expires_at is not null;

-- Private research ledger. A lead is not a publishable assertion. The
-- publication_ready flag must be affirmatively set only after source review.
create table if not exists public.deadman_research_leads (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.deadman_incidents(id) on delete cascade,
  topic_key text not null unique check (topic_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 8 and 200),
  jurisdiction text,
  research_question text not null check (char_length(research_question) between 20 and 4000),
  status text not null default 'source_needed'
    check (status in (
      'source_needed', 'needs_authentication', 'researching',
      'verified', 'held', 'published', 'closed'
    )),
  priority smallint not null default 50 check (priority between 1 and 100),
  source_manifest jsonb not null default '[]'::jsonb
    check (jsonb_typeof(source_manifest) = 'array'),
  supported_propositions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(supported_propositions) = 'array'),
  contrary_or_limiting_evidence jsonb not null default '[]'::jsonb
    check (jsonb_typeof(contrary_or_limiting_evidence) = 'array'),
  publication_ready boolean not null default false,
  publication_gate_note text not null,
  assigned_to text not null default 'custody-response-agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (publication_ready is false or status in ('verified', 'published'))
);

create index if not exists deadman_research_leads_work_idx
  on public.deadman_research_leads (status, priority desc, updated_at);

alter table public.deadman_research_leads enable row level security;
revoke all on table public.deadman_research_leads from public, anon, authenticated;
grant select on table public.deadman_research_leads to authenticated;
grant all on table public.deadman_research_leads to service_role;

drop policy if exists "Admins can read deadman research leads"
  on public.deadman_research_leads;
create policy "Admins can read deadman research leads"
  on public.deadman_research_leads for select
  to authenticated
  using (public.is_admin((select auth.uid())));

insert into public.deadman_research_leads (
  topic_key, title, jurisdiction, research_question, status, priority,
  publication_gate_note
) values
  (
    'east-mountain-record',
    'East Mountain encounter — source and authority audit',
    'East Mountain / Upshur County, Texas',
    'Authenticate the original recording, establish each participant public role and duty status, identify any lawful authority asserted, and determine whether any reliable evidence connects the encounter to the present Harrison County custody matter.',
    'needs_authentication',
    95,
    'PRIVATE RESEARCH LEAD. Do not publish East Mountain as misconduct, detention, search, conspiracy, or Harrison County coordination unless primary records establish the proposition and the publication gate is affirmatively opened.'
  ),
  (
    'custody-legal-basis',
    'Operative legal basis for custody',
    'Harrison County, Texas',
    'Obtain the operative order, alleged violation, notice, booking record, counsel response, and next hearing information from authoritative sources.',
    'researching',
    100,
    'Publish only source-linked facts, attributed official allegations, and clearly labeled advocacy.'
  ),
  (
    'harrison-county-decision-chain',
    'Harrison County public decision chain',
    'Harrison County, Texas',
    'Identify the public offices and officials whose sourced authority, acts, omissions, requests, approvals, or explanations are relevant to custody.',
    'researching',
    90,
    'Name an individual only when a reliable source establishes both the public role and relevant action or omission.'
  ),
  (
    'exculpatory-and-contrary-record',
    'Exculpatory, favorable, and contrary evidence',
    'Texas',
    'Locate evidence favorable to Ryan while also recording contrary material necessary to describe the record accurately and credibly.',
    'researching',
    90,
    'Do not omit material contrary evidence. Explain its weight and limitations alongside favorable evidence.'
  ),
  (
    'official-response-log',
    'Official response and unanswered-question log',
    'Harrison County, Texas',
    'Record the factual questions sent to public offices, the time allowed for response, and any answer, declination, or silence.',
    'source_needed',
    80,
    'Accurately quote or summarize official responses and link the underlying public record when available.'
  )
on conflict (topic_key) do nothing;

-- Validate every v3 update at the database boundary, including updates staged
-- by an automation or any future server worker.
create or replace function public.validate_deadman_accountability_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_heading text;
begin
  if new.editorial_mode <> 'evidence_led_accountability_v3' then
    return new;
  end if;

  if jsonb_typeof(new.fact_basis) <> 'object' then
    raise exception 'Accountability fact_basis must be a JSON object.';
  end if;
  if coalesce(new.fact_basis->>'editorial_mode', '') <> new.editorial_mode then
    raise exception 'fact_basis editorial_mode must match the update.';
  end if;
  if coalesce(array_length(new.accountability_targets, 1), 0) = 0 then
    raise exception 'At least one public accountability target is required.';
  end if;
  if jsonb_typeof(new.claim_labels) <> 'object'
     or jsonb_typeof(new.claim_labels->'verified_facts') <> 'array'
     or jsonb_typeof(new.claim_labels->'attributed_allegations') <> 'array'
     or jsonb_typeof(new.claim_labels->'editorial_inferences') <> 'array'
     or jsonb_typeof(new.claim_labels->'advocacy_positions') <> 'array'
     or jsonb_typeof(new.claim_labels->'unresolved_questions') <> 'array' then
    raise exception 'All five claim-label arrays are required.';
  end if;
  if jsonb_array_length(new.claim_labels->'verified_facts') = 0 then
    raise exception 'At least one source-linked verified fact is required.';
  end if;

  foreach v_heading in array array[
    '## Verified facts',
    '## Official account and allegations',
    '## Evidence, contradictions, and unanswered questions',
    '## Accountability notice',
    '## Advocacy position',
    '## How to help lawfully'
  ] loop
    if position(v_heading in new.body) = 0 then
      raise exception 'Missing required accountability section: %', v_heading;
    end if;
  end loop;

  if exists (
    select 1
    from jsonb_array_elements(new.public_record_sources) source
    where source ?| array['private_url', 'notion_page_id', 'drive_file_id', 'internal_id']
       or source->>'visibility' = 'private'
  ) then
    raise exception 'Private source identifiers cannot enter a public source manifest.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.claim_labels->'verified_facts') claim
    where coalesce(jsonb_typeof(claim->'source_ids'), '') <> 'array'
       or coalesce(jsonb_array_length(claim->'source_ids'), 0) = 0
  ) then
    raise exception 'Every verified fact must cite at least one source id.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.claim_labels->'attributed_allegations') claim
    where coalesce(trim(claim->>'attributed_to'), '') = ''
       or coalesce(jsonb_typeof(claim->'source_ids'), '') <> 'array'
       or coalesce(jsonb_array_length(claim->'source_ids'), 0) = 0
  ) then
    raise exception 'Every allegation must identify its source and attribution.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.claim_labels->'editorial_inferences') claim
    where coalesce(jsonb_typeof(claim->'basis_claim_ids'), '') <> 'array'
       or coalesce(jsonb_array_length(claim->'basis_claim_ids'), 0) = 0
  ) then
    raise exception 'Every editorial inference must cite its factual basis claims.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.claim_labels->'verified_facts') claim,
         jsonb_array_elements_text(claim->'source_ids') source_ref(value)
    where not exists (
      select 1
      from jsonb_array_elements(new.public_record_sources) source
      where source->>'id' = source_ref.value
    )
  ) or exists (
    select 1
    from jsonb_array_elements(new.claim_labels->'attributed_allegations') claim,
         jsonb_array_elements_text(claim->'source_ids') source_ref(value)
    where not exists (
      select 1
      from jsonb_array_elements(new.public_record_sources) source
      where source->>'id' = source_ref.value
    )
  ) then
    raise exception 'A fact or allegation cites a source id absent from the public source manifest.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.claim_labels->'editorial_inferences') inference,
         jsonb_array_elements_text(inference->'basis_claim_ids') basis_ref(value)
    where not exists (
      select 1
      from (
        select fact->>'id' as id
        from jsonb_array_elements(new.claim_labels->'verified_facts') fact
        union all
        select allegation->>'id' as id
        from jsonb_array_elements(new.claim_labels->'attributed_allegations') allegation
      ) factual_claim
      where factual_claim.id = basis_ref.value
    )
  ) then
    raise exception 'An inference cites a basis claim that is not a fact or attributed allegation.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.claim_labels->'verified_facts') claim
    where claim->>'claim' ~* '\m(this site|we) (call|calls|demand|demands)\M|\mmust release\M|\mshould (release|resign)\M'
  ) then
    raise exception 'Advocacy cannot be labeled as a verified fact.';
  end if;

  if exists (
    select 1
    from unnest(new.named_persons) person(name)
    where person.name <> 'Ryan Nichols'
      and not exists (
        select 1
        from jsonb_array_elements(
          case when jsonb_typeof(new.fact_basis->'named_public_roles') = 'array'
            then new.fact_basis->'named_public_roles' else '[]'::jsonb end
        ) role_record
        where role_record->>'name' = person.name
          and coalesce(trim(role_record->>'public_role'), '') <> ''
          and exists (
            select 1
            from jsonb_array_elements(new.public_record_sources) source
            where source->>'id' = role_record->>'source_id'
          )
      )
  ) then
    raise exception 'Every named person other than Ryan requires a sourced public-role record.';
  end if;

  if exists (
    select 1
    from unnest(new.accountability_targets) target(name)
    where target.name !~* '(county|office|department|court|agency|city|public|sheriff|police|district attorney|pretrial)'
      and not exists (
        select 1
        from jsonb_array_elements(
          case when jsonb_typeof(new.fact_basis->'named_public_roles') = 'array'
            then new.fact_basis->'named_public_roles' else '[]'::jsonb end
        ) role_record
        where role_record->>'name' = target.name
      )
  ) then
    raise exception 'Accountability targets must be public institutions or sourced public officials.';
  end if;

  if new.body ilike '%East Mountain%'
     and not exists (
       select 1
       from public.deadman_research_leads lead
       where lead.topic_key = 'east-mountain-record'
         and lead.publication_ready is true
         and lead.status in ('verified', 'published')
     ) then
    raise exception 'East Mountain remains behind its private publication gate.';
  end if;

  new.validated_at := now();
  new.validation_version := 'accountability-v3';
  return new;
end;
$$;

drop trigger if exists deadman_accountability_update_validation
  on public.deadman_updates;
create trigger deadman_accountability_update_validation
  before insert or update of body, fact_basis, public_record_sources,
    claim_labels, accountability_targets, editorial_mode
  on public.deadman_updates
  for each row execute function public.validate_deadman_accountability_update();

revoke all on function public.validate_deadman_accountability_update()
  from public, anon, authenticated;

-- Preserve the original RPC signature used by the site and automation. The
-- structured v3 fields travel inside fact_basis and are promoted to columns.
create or replace function public.stage_deadman_update(
  p_incident_id uuid,
  p_slug text,
  p_title text,
  p_body text,
  p_source_classification text,
  p_public_record_sources jsonb,
  p_fact_basis jsonb default '{}'::jsonb,
  p_seo_description text default null,
  p_created_by text default 'custody-response-agent',
  p_x_post text default null,
  p_facebook_post text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_update_id uuid;
  v_accountability_targets text[];
  v_related_topics text[];
  v_named_persons text[];
  v_claim_labels jsonb;
begin
  if not exists (
    select 1
    from public.deadman_incidents i
    where i.id = p_incident_id
      and i.status = 'active'
      and i.public_release_authorized is true
  ) then
    raise exception 'No active authorized incident.';
  end if;
  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid update slug.';
  end if;
  if char_length(trim(p_title)) not between 8 and 200 then
    raise exception 'Update title must be 8 to 200 characters.';
  end if;
  if char_length(trim(p_body)) not between 200 and 50000 then
    raise exception 'Update body must be 200 to 50000 characters.';
  end if;
  if jsonb_typeof(p_public_record_sources) <> 'array'
     or jsonb_array_length(p_public_record_sources) = 0 then
    raise exception 'At least one source record is required.';
  end if;
  if jsonb_typeof(p_fact_basis) <> 'object' then
    raise exception 'fact_basis must be a JSON object.';
  end if;
  if p_x_post is not null and char_length(
    replace(
      p_x_post,
      '{{ARTICLE_URL}}',
      'https://realryannichols.com/posts/' || p_slug
    )
  ) > 280 then
    raise exception 'X post exceeds 280 characters after URL expansion.';
  end if;

  select coalesce(array_agg(value), array['Harrison County public agencies']::text[])
  into v_accountability_targets
  from jsonb_array_elements_text(
    case when jsonb_typeof(p_fact_basis->'accountability_targets') = 'array'
      then p_fact_basis->'accountability_targets'
      else '["Harrison County public agencies"]'::jsonb end
  ) item(value);

  select coalesce(array_agg(value), '{}'::text[])
  into v_related_topics
  from jsonb_array_elements_text(
    case when jsonb_typeof(p_fact_basis->'related_topics') = 'array'
      then p_fact_basis->'related_topics' else '[]'::jsonb end
  ) item(value);

  select coalesce(array_agg(value), array['Ryan Nichols']::text[])
  into v_named_persons
  from jsonb_array_elements_text(
    case when jsonb_typeof(p_fact_basis->'named_persons') = 'array'
      then p_fact_basis->'named_persons' else '["Ryan Nichols"]'::jsonb end
  ) item(value);

  v_claim_labels := coalesce(p_fact_basis->'claim_labels', '{}'::jsonb);

  insert into public.deadman_updates (
    incident_id,
    slug,
    title,
    body,
    seo_title,
    seo_description,
    source_classification,
    public_record_sources,
    fact_basis,
    created_by,
    x_post,
    facebook_post,
    editorial_mode,
    evidence_strength,
    accountability_targets,
    related_topics,
    claim_labels,
    official_response_status,
    priority,
    expires_at,
    named_persons
  ) values (
    p_incident_id,
    p_slug,
    trim(p_title),
    trim(p_body),
    left(trim(p_title), 70),
    nullif(trim(p_seo_description), ''),
    p_source_classification,
    p_public_record_sources,
    p_fact_basis,
    coalesce(nullif(trim(p_created_by), ''), 'custody-response-agent'),
    nullif(trim(p_x_post), ''),
    nullif(trim(p_facebook_post), ''),
    coalesce(nullif(p_fact_basis->>'editorial_mode', ''), 'evidence_led_accountability_v3'),
    coalesce(nullif(p_fact_basis->>'evidence_strength', ''), 'single_public_source'),
    v_accountability_targets,
    v_related_topics,
    v_claim_labels,
    coalesce(nullif(p_fact_basis->>'official_response_status', ''), 'not_requested'),
    coalesce((p_fact_basis->>'priority')::smallint, 50),
    nullif(p_fact_basis->>'expires_at', '')::timestamptz,
    v_named_persons
  )
  returning id into v_update_id;

  insert into public.deadman_event_log (incident_id, event_type, actor_id, detail)
  values (
    p_incident_id,
    'accountability_update_staged',
    coalesce(nullif(trim(p_created_by), ''), 'custody-response-agent'),
    jsonb_build_object(
      'update_id', v_update_id,
      'slug', p_slug,
      'editorial_mode', 'evidence_led_accountability_v3'
    )
  );

  return v_update_id;
end;
$$;

revoke all on function public.stage_deadman_update(
  uuid, text, text, text, text, jsonb, jsonb, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.stage_deadman_update(
  uuid, text, text, text, text, jsonb, jsonb, text, text, text, text
) to service_role;

-- Rebuild the hourly release operation so stale research cannot publish and
-- the no-new-information backstop follows the same accountability contract.
create or replace function public.release_next_deadman_update(p_incident_id uuid)
returns table (
  released_update_id uuid,
  released_post_id uuid,
  reason text,
  next_eligible_at timestamptz,
  ready_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_incident public.deadman_incidents%rowtype;
  v_update public.deadman_updates%rowtype;
  v_previous public.deadman_updates%rowtype;
  v_post_id uuid;
  v_now timestamptz := now();
  v_central_label text;
  v_public_url text;
  v_status_source_id text;
  v_sources jsonb;
begin
  select * into v_incident
  from public.deadman_incidents
  where id = p_incident_id
  for update;

  if not found or v_incident.status <> 'active'
     or not v_incident.public_release_authorized then
    released_update_id := null;
    released_post_id := null;
    reason := 'inactive';
    next_eligible_at := null;
    ready_count := 0;
    return next;
    return;
  end if;

  update public.deadman_updates
  set status = 'withdrawn',
      correction_summary = coalesce(
        correction_summary,
        'Automatically withdrawn because the source-freshness window expired before publication.'
      )
  where incident_id = p_incident_id
    and status = 'ready'
    and expires_at is not null
    and expires_at <= v_now;

  select count(*)::integer into ready_count
  from public.deadman_updates u
  where u.incident_id = p_incident_id
    and u.status = 'ready'
    and (u.expires_at is null or u.expires_at > v_now);

  if v_incident.last_release_at is not null and
     date_trunc('hour', v_incident.last_release_at) = date_trunc('hour', v_now) then
    released_update_id := null;
    released_post_id := null;
    reason := 'already_released_this_hour';
    next_eligible_at := date_trunc('hour', v_now) + interval '1 hour';
    return next;
    return;
  end if;

  select * into v_update
  from public.deadman_updates u
  where u.incident_id = p_incident_id
    and u.status = 'ready'
    and (u.expires_at is null or u.expires_at > v_now)
  order by u.priority desc, u.sequence_no asc
  for update skip locked
  limit 1;

  if not found then
    select * into v_previous
    from public.deadman_updates u
    where u.incident_id = p_incident_id and u.status = 'published'
    order by u.sequence_no desc
    limit 1;

    if not found then
      released_update_id := null;
      released_post_id := null;
      reason := 'no_update_ready';
      next_eligible_at := null;
      return next;
      return;
    end if;

    v_central_label := to_char(
      v_now at time zone 'America/Chicago',
      'FMMonth FMDD, YYYY at FMHH12:MI AM'
    ) || ' Central';
    v_public_url := 'https://realryannichols.com/posts/ryan-nichols-custody-status-' ||
      to_char(v_now at time zone 'America/Chicago', 'YYYY-MM-DD-HH24');
    v_status_source_id := 'status-check-' ||
      to_char(v_now at time zone 'UTC', 'YYYYMMDDHH24');
    v_sources := v_previous.public_record_sources || jsonb_build_array(
      jsonb_build_object(
        'id', v_status_source_id,
        'type', 'hourly_status_check',
        'note', 'The custody-response workflow found no new verified source record ready for this hour.'
      )
    );

    insert into public.deadman_updates (
      incident_id,
      slug,
      title,
      body,
      seo_title,
      seo_description,
      source_classification,
      public_record_sources,
      fact_basis,
      x_post,
      facebook_post,
      created_by,
      editorial_mode,
      evidence_strength,
      accountability_targets,
      related_topics,
      claim_labels,
      official_response_status,
      priority
    ) values (
      p_incident_id,
      'ryan-nichols-custody-status-' ||
        to_char(v_now at time zone 'America/Chicago', 'YYYY-MM-DD-HH24'),
      'Ryan Nichols custody status: no new verified development as of ' || v_central_label,
      format($body$
This is the scheduled **%s** update in the public custody-response record for **Ryan Nichols**. The accountability record remains active even when the verified facts have not changed.

## Verified facts

The response workflow has received **no new verified development** since the previous published bulletin. There is no newly confirmed court order, booking change, facility change, release notice, or official explanation ready to report in this hour.

## Official account and allegations

No new official allegation or explanation has been verified for publication this hour. Earlier government claims remain allegations attributable to the office or record that made them unless a controlling record establishes otherwise.

## Evidence, contradictions, and unanswered questions

The legal basis for custody, controlling orders, release conditions, notice, booking information, counsel's response, exculpatory evidence, favorable context, contrary evidence, and procedural irregularities remain under active source review. No new allegation is being added merely to fill the hourly slot.

[Read the preceding source-labeled update](https://realryannichols.com/posts/%s).

## Accountability notice

Harrison County still must identify the public decision chain and produce the lawful, documented basis for holding Ryan. Silence or delay does not erase the questions. Every sourced public action, omission, explanation, correction, and response will remain in the timestamped record.

## Advocacy position

Ryan describes any unjustified detention as lawfare, political persecution, and unfair treatment. That is **Ryan's position and this site's advocacy**, not a judicial finding. This site continues to call for Ryan's release unless the government establishes a lawful, transparent, and documented basis for detention.

## How to help lawfully

Share this update locally and nationally. Ask public offices specific factual questions. Send original public records, direct source links, or first-hand material through the [evidence submission page](https://realryannichols.com/submit). Preserve originals and timestamps. Do not threaten, harass, dox, contact children, target witnesses, or publish sealed or private information.

{{report: Ryan Nichols hourly custody status}}

{{poll: Will you help keep attention on the verified record? | Share this update | Submit a source | Follow the hourly timeline}}

{{share}}
$body$, v_central_label, v_previous.slug),
      left('Ryan Nichols custody status: no new verified development', 70),
      'Hourly Ryan Nichols custody update covering Harrison County, due process, public accountability, exculpatory evidence, and the latest verified status.',
      'hourly_status_no_new_information',
      v_sources,
      jsonb_build_object(
        'editorial_mode', 'evidence_led_accountability_v3',
        'evidence_strength', 'no_new_information',
        'accountability_targets', jsonb_build_array('Harrison County public agencies'),
        'related_topics', jsonb_build_array(
          'custody legal basis',
          'Harrison County decision chain',
          'exculpatory evidence',
          'official response log'
        ),
        'official_response_status', 'requested',
        'claim_labels', jsonb_build_object(
          'verified_facts', jsonb_build_array(jsonb_build_object(
            'id', 'fact-no-new-' || to_char(v_now at time zone 'UTC', 'YYYYMMDDHH24'),
            'claim', 'No new verified development was ready for publication in this hourly status check.',
            'source_ids', jsonb_build_array(v_status_source_id)
          )),
          'attributed_allegations', '[]'::jsonb,
          'editorial_inferences', '[]'::jsonb,
          'advocacy_positions', jsonb_build_array(jsonb_build_object(
            'id', 'advocacy-release-' || to_char(v_now at time zone 'UTC', 'YYYYMMDDHH24'),
            'claim', 'This site calls for release unless a lawful and documented detention basis is established.'
          )),
          'unresolved_questions', jsonb_build_array(jsonb_build_object(
            'id', 'question-basis-' || to_char(v_now at time zone 'UTC', 'YYYYMMDDHH24'),
            'claim', 'What is the current lawful and documented basis for detention?'
          )),
          'no_new_verified_information', true,
          'previous_update_id', v_previous.id,
          'generated_at', v_now
        )
      ),
      'No new verified development this hour. Harrison County still must show the lawful basis for holding Ryan Nichols—or release him. The sourced public record remains active: ' || v_public_url,
      'There is no new verified development this hour, but the accountability record remains active. Harrison County still must identify the public decision chain and show a lawful, documented basis for holding Ryan Nichols—or release him. Read and share the source-labeled update; submit original records; do not threaten, harass, dox, or target private people.\n\n' || v_public_url,
      'deadman-hourly-backstop',
      'evidence_led_accountability_v3',
      'no_new_information',
      array['Harrison County public agencies']::text[],
      array[
        'custody legal basis',
        'Harrison County decision chain',
        'exculpatory evidence',
        'official response log'
      ]::text[],
      jsonb_build_object(
        'verified_facts', jsonb_build_array(jsonb_build_object(
          'id', 'fact-no-new-' || to_char(v_now at time zone 'UTC', 'YYYYMMDDHH24'),
          'claim', 'No new verified development was ready for publication in this hourly status check.',
          'source_ids', jsonb_build_array(v_status_source_id)
        )),
        'attributed_allegations', '[]'::jsonb,
        'editorial_inferences', '[]'::jsonb,
        'advocacy_positions', jsonb_build_array(jsonb_build_object(
          'id', 'advocacy-release-' || to_char(v_now at time zone 'UTC', 'YYYYMMDDHH24'),
          'claim', 'This site calls for release unless a lawful and documented detention basis is established.'
        )),
        'unresolved_questions', jsonb_build_array(jsonb_build_object(
          'id', 'question-basis-' || to_char(v_now at time zone 'UTC', 'YYYYMMDDHH24'),
          'claim', 'What is the current lawful and documented basis for detention?'
        ))
      ),
      'requested',
      10
    )
    returning * into v_update;

    insert into public.deadman_event_log (incident_id, event_type, actor_id, detail)
    values (
      p_incident_id,
      'no_new_information_update_created',
      'deadman-hourly-backstop',
      jsonb_build_object('update_id', v_update.id, 'previous_update_id', v_previous.id)
    );
  end if;

  insert into public.posts (
    slug,
    type,
    status,
    title,
    body,
    category,
    byline_override,
    pinned,
    published_at,
    og_image_url,
    seo_title,
    seo_description,
    approval_status,
    approved_at,
    deadman_eligible,
    requires_manual_review,
    risk_level,
    source_classification,
    named_persons,
    public_record_sources,
    tags
  ) values (
    v_update.slug,
    'text',
    'published',
    v_update.title,
    v_update.body,
    v_update.category,
    v_update.byline_override,
    true,
    v_now,
    v_update.og_image_url,
    v_update.seo_title,
    v_update.seo_description,
    'emergency_protocol',
    v_now,
    true,
    false,
    'high',
    v_update.source_classification,
    v_update.named_persons,
    v_update.public_record_sources,
    v_update.tags
  )
  returning id into v_post_id;

  update public.deadman_updates
  set status = 'published', published_at = v_now, post_id = v_post_id
  where id = v_update.id;

  if v_update.x_post is not null then
    insert into public.deadman_social_dispatches (
      incident_id, update_id, post_id, platform, body
    ) values (
      p_incident_id,
      v_update.id,
      v_post_id,
      'x',
      replace(v_update.x_post, '{{ARTICLE_URL}}', 'https://realryannichols.com/posts/' || v_update.slug)
    );
  end if;
  if v_update.facebook_post is not null then
    insert into public.deadman_social_dispatches (
      incident_id, update_id, post_id, platform, body
    ) values (
      p_incident_id,
      v_update.id,
      v_post_id,
      'facebook',
      replace(v_update.facebook_post, '{{ARTICLE_URL}}', 'https://realryannichols.com/posts/' || v_update.slug)
    );
  end if;

  update public.deadman_incidents
  set last_release_at = v_now,
      total_released = total_released + 1,
      updated_at = v_now
  where id = p_incident_id;

  insert into public.publishing_audit_log (post_id, post_slug, action, actor, detail)
  values (
    v_post_id,
    v_update.slug,
    'deadman_hourly_release',
    v_update.created_by,
    jsonb_build_object(
      'incident_id', p_incident_id,
      'update_id', v_update.id,
      'editorial_mode', v_update.editorial_mode,
      'validation_version', v_update.validation_version
    )
  );

  insert into public.deadman_event_log (incident_id, event_type, actor_id, detail)
  values (
    p_incident_id,
    'hourly_update_released',
    v_update.created_by,
    jsonb_build_object(
      'update_id', v_update.id,
      'post_id', v_post_id,
      'evidence_strength', v_update.evidence_strength,
      'official_response_status', v_update.official_response_status
    )
  );

  released_update_id := v_update.id;
  released_post_id := v_post_id;
  reason := 'released';
  next_eligible_at := date_trunc('hour', v_now) + interval '1 hour';
  ready_count := greatest(ready_count - 1, 0);
  return next;
end;
$$;

revoke all on function public.release_next_deadman_update(uuid)
  from public, anon, authenticated;
grant execute on function public.release_next_deadman_update(uuid) to service_role;

comment on table public.deadman_research_leads is
  'Private research leads and publication gates for the custody-response system.';
comment on function public.validate_deadman_accountability_update() is
  'Database-boundary validation for source-linked facts, attributed allegations, labeled inferences, and advocacy.';
