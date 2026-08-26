-- Deadman's Switch v4: keep the complete investigative universe private while
-- requiring source-level proof before a topic or cross-incident connection can
-- enter an hourly public update.

alter table public.deadman_research_leads
  add column if not exists publication_terms text[] not null default '{}'::text[],
  add column if not exists subject_classification text not null default 'unclassified'
    check (subject_classification in (
      'incident', 'public_agency', 'public_official', 'public_employee',
      'public_record_party', 'public_record_witness', 'private_person',
      'organization', 'unclassified'
    )),
  add column if not exists identity_confidence text not null default 'unverified'
    check (identity_confidence in (
      'unverified', 'probable', 'verified_public_record',
      'verified_primary_source'
    )),
  add column if not exists legal_restrictions text[] not null default '{}'::text[],
  add column if not exists public_safe_scope text not null default '',
  add column if not exists scope text not null default 'incident'
    check (scope in ('incident', 'global')),
  add column if not exists global_applicability text not null default '',
  add column if not exists last_source_review_at timestamptz,
  add column if not exists publication_opened_at timestamptz,
  add column if not exists publication_opened_by text,
  add column if not exists publication_open_reason text;

-- The earlier protocol seeded this one named incident before literal-term
-- gating existed. Backfill it before the validator is installed so the legacy
-- row cannot silently remain outside the new publication boundary.
update public.deadman_research_leads
set publication_terms = array['East Mountain']::text[],
    subject_classification = 'incident',
    identity_confidence = 'unverified',
    legal_restrictions = array['identity_unverified']::text[],
    public_safe_scope = '',
    publication_ready = false,
    publication_opened_at = null,
    publication_opened_by = null,
    publication_open_reason = null,
    updated_at = now()
where topic_key = 'east-mountain-record'
  and coalesce(array_length(publication_terms, 1), 0) = 0;

-- Only the four protocol-wide baseline questions are globally reusable. Every
-- named incident/person/organization remains incident-scoped and must be
-- attached through an explicit junction before an update may reference it.
update public.deadman_research_leads
set scope = 'global',
    global_applicability = case topic_key
      when 'custody-legal-basis' then
        'Applies to every activated custody incident because each public bulletin must identify the operative source-supported legal basis.'
      when 'harrison-county-decision-chain' then
        'Applies to every activated custody incident involving Harrison County because public authority and each relevant official act must be sourced.'
      when 'exculpatory-and-contrary-record' then
        'Applies to every activated custody incident because favorable evidence and material contrary evidence must be evaluated together.'
      when 'official-response-log' then
        'Applies to every activated custody incident because official questions, responses, declinations, and silence must be recorded accurately.'
      else global_applicability
    end,
    updated_at = now()
where topic_key in (
  'custody-legal-basis',
  'harrison-county-decision-chain',
  'exculpatory-and-contrary-record',
  'official-response-log'
);

-- v3 publication_ready values did not carry the v4 identity, source-freshness,
-- scope, or human-audit proof. They must be re-opened under the v4 RPC.
update public.deadman_research_leads
set publication_ready = false,
    publication_opened_at = null,
    publication_opened_by = null,
    publication_open_reason = null,
    updated_at = now()
where publication_ready;

alter table public.deadman_research_leads
  add constraint deadman_research_leads_scope_integrity
  check (
    (
      scope = 'global'
      and incident_id is null
      and char_length(trim(global_applicability)) between 40 and 4000
    )
    or (
      scope = 'incident'
      and global_applicability = ''
    )
  );

create index if not exists deadman_research_leads_publication_gate_idx
  on public.deadman_research_leads (publication_ready, status, priority desc);

create table if not exists public.deadman_research_gate_audit (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('lead', 'connection')),
  entity_id uuid not null,
  action text not null check (action in ('opened', 'closed', 'auto_closed')),
  actor_uid uuid,
  actor_label text not null,
  reason text not null check (char_length(reason) between 20 and 4000),
  gate_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists deadman_research_gate_audit_entity_idx
  on public.deadman_research_gate_audit (
    entity_type, entity_id, created_at desc
  );

alter table public.deadman_research_gate_audit enable row level security;
revoke all on table public.deadman_research_gate_audit
  from public, anon, authenticated;
grant select on table public.deadman_research_gate_audit to authenticated;
revoke insert, update, delete, truncate
  on table public.deadman_research_gate_audit from service_role;
grant select on table public.deadman_research_gate_audit to service_role;

drop policy if exists "Admins can read deadman research gate audit"
  on public.deadman_research_gate_audit;
create policy "Admins can read deadman research gate audit"
  on public.deadman_research_gate_audit for select
  to authenticated
  using (public.is_admin((select auth.uid())));

create or replace function public.validate_deadman_research_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_term text;
begin
  if tg_op = 'INSERT' and new.publication_ready then
    raise exception 'New research leads must begin behind a closed publication gate.';
  end if;

  if tg_op = 'UPDATE' and old.publication_ready and (
    old.incident_id is distinct from new.incident_id
    or old.status is distinct from new.status
    or old.title is distinct from new.title
    or old.jurisdiction is distinct from new.jurisdiction
    or old.research_question is distinct from new.research_question
    or old.publication_terms is distinct from new.publication_terms
    or old.subject_classification is distinct from new.subject_classification
    or old.identity_confidence is distinct from new.identity_confidence
    or old.legal_restrictions is distinct from new.legal_restrictions
    or old.public_safe_scope is distinct from new.public_safe_scope
    or old.scope is distinct from new.scope
    or old.global_applicability is distinct from new.global_applicability
    or old.source_manifest is distinct from new.source_manifest
    or old.supported_propositions is distinct from new.supported_propositions
    or old.contrary_or_limiting_evidence is distinct from new.contrary_or_limiting_evidence
    or old.publication_gate_note is distinct from new.publication_gate_note
    or old.last_source_review_at is distinct from new.last_source_review_at
  ) then
    new.publication_ready := false;
    new.publication_opened_at := null;
    new.publication_opened_by := null;
    new.publication_open_reason := null;
    insert into public.deadman_research_gate_audit (
      entity_type, entity_id, action, actor_label, reason, gate_snapshot
    ) values (
      'lead', new.id, 'auto_closed', 'database:material-change',
      'The publication gate closed automatically because material research or public-scope fields changed.',
      jsonb_build_object('topic_key', new.topic_key)
    );
  end if;

  if coalesce(array_length(new.publication_terms, 1), 0) > 25 then
    raise exception 'A research lead may have at most 25 publication terms.';
  end if;
  foreach v_term in array new.publication_terms loop
    if char_length(trim(v_term)) < 5
       or char_length(v_term) > 160
       or v_term <> trim(v_term) then
      raise exception 'Research publication terms must be trimmed and 5 to 160 characters.';
    end if;
  end loop;

  if exists (
    select 1
    from unnest(new.publication_terms) publication_term(value)
    group by lower(publication_term.value)
    having count(*) > 1
  ) then
    raise exception 'Research publication terms must be unique.';
  end if;

  if new.subject_classification in (
    'incident', 'public_agency', 'public_official', 'public_employee',
    'public_record_party', 'public_record_witness', 'private_person',
    'organization'
  ) and coalesce(array_length(new.publication_terms, 1), 0) = 0 then
    raise exception 'A named person, organization, or incident requires a literal publication term.';
  end if;

  if not (
    (
      new.scope = 'global'
      and new.incident_id is null
      and char_length(trim(new.global_applicability)) between 40 and 4000
    )
    or (
      new.scope = 'incident'
      and new.global_applicability = ''
    )
  ) then
    raise exception 'Research scope and global applicability are inconsistent.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.source_manifest) source
    where jsonb_typeof(source) <> 'object'
       or coalesce(source->>'id', '') !~
         '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$'
  ) or exists (
    select 1
    from jsonb_array_elements(new.source_manifest) source
    group by source->>'id'
    having count(*) > 1
  ) then
    raise exception 'Research source manifest ids must be valid and unique.';
  end if;

  if exists (
    select 1
    from unnest(new.legal_restrictions) restriction(value)
    where restriction.value not in (
      'sealed', 'privileged', 'minor', 'medical', 'mental_health',
      'private_address', 'personal_contact_information', 'victim_identity',
      'court_prohibited', 'nonpublic_family_matter', 'needs_counsel_review',
      'identity_unverified', 'never_publish'
    )
  ) then
    raise exception 'Unknown research legal restriction.';
  end if;

  if new.publication_ready then
    if coalesce(array_length(new.publication_terms, 1), 0) = 0 then
      raise exception 'A publication-ready lead requires a literal publication term.';
    end if;
    if new.status not in ('verified', 'published') then
      raise exception 'A publication-ready lead must be verified or published.';
    end if;
    if new.identity_confidence not in (
      'verified_public_record', 'verified_primary_source'
    ) then
      raise exception 'A publication-ready lead requires a verified identity.';
    end if;
    if new.last_source_review_at is null
       or new.last_source_review_at < now() - interval '7 days'
       or new.last_source_review_at > now() + interval '5 minutes' then
      raise exception 'A publication-ready lead requires a current, non-future source review.';
    end if;
    if new.publication_opened_at is null
       or coalesce(new.publication_opened_by, '') !~
         '^(admin|editor|counsel):[a-zA-Z0-9._@-]{3,}$'
       or char_length(trim(coalesce(new.publication_open_reason, ''))) < 20 then
      raise exception 'A publication-ready lead requires an auditable human gate opening.';
    end if;
    if char_length(trim(new.public_safe_scope)) < 20 then
      raise exception 'A publication-ready lead requires a meaningful public-safe scope.';
    end if;
    if jsonb_array_length(new.source_manifest) = 0
       or jsonb_array_length(new.supported_propositions) = 0 then
      raise exception 'A publication-ready lead requires sources and supported propositions.';
    end if;
    if new.legal_restrictions && array[
      'sealed', 'privileged', 'minor', 'medical', 'mental_health',
      'private_address', 'personal_contact_information', 'victim_identity',
      'court_prohibited', 'nonpublic_family_matter', 'needs_counsel_review',
      'identity_unverified', 'never_publish'
    ]::text[] then
      raise exception 'A publication-ready lead cannot retain a publication restriction.';
    end if;
    if not exists (
      select 1
      from jsonb_array_elements(new.source_manifest) source
      where jsonb_typeof(source) = 'object'
        and source->>'visibility' = 'public'
        and coalesce(source->>'public_url', source->>'url', '') ~ '^https://[^[:space:]]+$'
    ) then
      raise exception 'A publication-ready lead requires a public source URL.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(new.supported_propositions) proposition
      where jsonb_typeof(proposition) <> 'object'
         or coalesce(proposition->>'id', '') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$'
         or char_length(trim(coalesce(proposition->>'claim', ''))) < 8
         or coalesce(jsonb_typeof(proposition->'source_ids'), '') <> 'array'
         or coalesce(jsonb_array_length(proposition->'source_ids'), 0) = 0
    ) then
      raise exception 'Every supported proposition requires an id, claim, and source ids.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(new.supported_propositions) proposition
      cross join lateral jsonb_array_elements_text(
        proposition->'source_ids'
      ) source_ref(value)
      group by proposition->>'id', source_ref.value
      having count(*) > 1
    ) then
      raise exception 'Supported proposition source ids must be unique.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(new.supported_propositions) proposition
      group by proposition->>'id'
      having count(*) > 1
    ) then
      raise exception 'Supported proposition ids must be unique within a lead.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(new.supported_propositions) proposition
      where coalesce(
          proposition->'publication_ready', 'false'::jsonb
        ) = 'true'::jsonb
        and (
          char_length(trim(coalesce(proposition->>'public_wording', ''))) < 8
          or coalesce(proposition->>'claim_class', '') not in (
            'verified_fact', 'attributed_allegation', 'supported_inference'
          )
        )
    ) then
      raise exception 'A reviewed proposition requires exact public wording and claim class.';
    end if;
    if not exists (
      select 1
      from jsonb_array_elements(new.supported_propositions) proposition
      where coalesce(
        proposition->'publication_ready', 'false'::jsonb
      ) = 'true'::jsonb
        and char_length(trim(coalesce(proposition->>'public_wording', ''))) >= 8
        and coalesce(proposition->>'claim_class', '') in (
          'verified_fact', 'attributed_allegation', 'supported_inference'
        )
    ) then
      raise exception 'A publication-ready lead requires a reviewed public proposition.';
    end if;
    if new.subject_classification in (
      'public_agency', 'public_official', 'public_employee'
    )
       and not exists (
         select 1
         from jsonb_array_elements(new.supported_propositions) proposition
         where coalesce(
             proposition->'publication_ready', 'false'::jsonb
           ) = 'true'::jsonb
           and proposition->>'proposition_kind' = 'public_role'
           and proposition->>'claim_class' = 'verified_fact'
       ) then
      raise exception 'A public agency, official, or employee requires a verified public-role proposition.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(new.supported_propositions) proposition,
           jsonb_array_elements_text(proposition->'source_ids') source_ref(value)
      where coalesce(
          proposition->'publication_ready', 'false'::jsonb
        ) = 'true'::jsonb
        and not exists (
        select 1
        from jsonb_array_elements(new.source_manifest) source
        where source->>'id' = source_ref.value
          and source->>'visibility' = 'public'
          and coalesce(source->>'public_url', source->>'url', '') ~ '^https://[^[:space:]]+$'
      )
    ) then
      raise exception 'A supported proposition cites a source that is not public and linked.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists deadman_research_lead_validation
  on public.deadman_research_leads;
create trigger deadman_research_lead_validation
  before insert or update
  on public.deadman_research_leads
  for each row execute function public.validate_deadman_research_lead();

revoke all on function public.validate_deadman_research_lead()
  from public, anon, authenticated;

-- A connection is a research hypothesis until its own evidence gate and both
-- endpoint gates are open. This prevents proximity, timing, or a shared name
-- from silently becoming a claim of coordination.
create table if not exists public.deadman_research_connections (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.deadman_incidents(id) on delete cascade,
  scope text not null default 'incident'
    check (scope in ('incident', 'global')),
  global_applicability text not null default '',
  connection_key text not null unique
    check (connection_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  from_lead_id uuid not null
    references public.deadman_research_leads(id) on delete cascade,
  to_lead_id uuid not null
    references public.deadman_research_leads(id) on delete cascade,
  connection_summary text not null
    check (char_length(connection_summary) between 12 and 4000),
  connection_class text not null default 'unknown'
    check (connection_class in (
      'alleged_by_ryan', 'temporal_overlap', 'shared_actor', 'shared_record',
      'supported_inference', 'verified_record', 'disputed', 'unknown'
    )),
  relationship_kind text not null default 'unclassified'
    check (relationship_kind in (
      'same_event', 'shared_public_record', 'shared_public_actor',
      'procedural_sequence', 'alleged_coordination',
      'documented_coordination', 'contrary_or_disputed', 'unclassified'
    )),
  confidence text not null default 'unverified'
    check (confidence in (
      'unverified', 'single_source', 'corroborated', 'primary_record'
    )),
  status text not null default 'researching'
    check (status in ('researching', 'verified', 'held', 'published', 'closed')),
  source_manifest jsonb not null default '[]'::jsonb
    check (jsonb_typeof(source_manifest) = 'array'),
  supported_claims jsonb not null default '[]'::jsonb
    check (jsonb_typeof(supported_claims) = 'array'),
  contrary_or_limiting_evidence jsonb not null default '[]'::jsonb
    check (jsonb_typeof(contrary_or_limiting_evidence) = 'array'),
  publication_ready boolean not null default false,
  public_summary text not null default '',
  publication_gate_note text not null,
  publication_opened_at timestamptz,
  publication_opened_by text,
  publication_open_reason text,
  last_source_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_lead_id <> to_lead_id),
  check (
    (
      scope = 'global'
      and incident_id is null
      and char_length(trim(global_applicability)) between 40 and 4000
    )
    or (
      scope = 'incident'
      and global_applicability = ''
    )
  )
);

create index if not exists deadman_research_connections_incident_idx
  on public.deadman_research_connections (incident_id)
  where incident_id is not null;
create index if not exists deadman_research_connections_from_idx
  on public.deadman_research_connections (from_lead_id);
create index if not exists deadman_research_connections_to_idx
  on public.deadman_research_connections (to_lead_id);
create index if not exists deadman_research_connections_work_idx
  on public.deadman_research_connections (
    publication_ready, status, confidence, updated_at desc
  );
create index if not exists deadman_research_connections_pair_class_idx
  on public.deadman_research_connections (
    least(from_lead_id, to_lead_id),
    greatest(from_lead_id, to_lead_id),
    connection_class
  );

alter table public.deadman_research_connections enable row level security;
revoke all on table public.deadman_research_connections
  from public, anon, authenticated;
grant select on table public.deadman_research_connections to authenticated;
grant all on table public.deadman_research_connections to service_role;

drop policy if exists "Admins can read deadman research connections"
  on public.deadman_research_connections;
create policy "Admins can read deadman research connections"
  on public.deadman_research_connections for select
  to authenticated
  using (public.is_admin((select auth.uid())));

create table if not exists public.deadman_incident_research_leads (
  incident_id uuid not null
    references public.deadman_incidents(id) on delete cascade,
  lead_id uuid not null
    references public.deadman_research_leads(id) on delete cascade,
  relevance_note text not null default '',
  created_at timestamptz not null default now(),
  primary key (incident_id, lead_id)
);

create table if not exists public.deadman_incident_research_connections (
  incident_id uuid not null
    references public.deadman_incidents(id) on delete cascade,
  connection_id uuid not null
    references public.deadman_research_connections(id) on delete cascade,
  relevance_note text not null default '',
  created_at timestamptz not null default now(),
  primary key (incident_id, connection_id)
);

-- Preserve explicit incident ownership from the v3 single-incident column in
-- the new many-to-many model. These rows predate the scope-closing triggers.
insert into public.deadman_incident_research_leads (
  incident_id, lead_id, relevance_note
)
select
  lead.incident_id,
  lead.id,
  'Backfilled from the v3 incident_id ownership field.'
from public.deadman_research_leads lead
where lead.incident_id is not null
on conflict (incident_id, lead_id) do nothing;

insert into public.deadman_incident_research_connections (
  incident_id, connection_id, relevance_note
)
select
  connection.incident_id,
  connection.id,
  'Backfilled from the connection incident_id ownership field.'
from public.deadman_research_connections connection
where connection.incident_id is not null
on conflict (incident_id, connection_id) do nothing;

create index if not exists deadman_incident_research_leads_lead_idx
  on public.deadman_incident_research_leads (lead_id);
create index if not exists deadman_incident_research_connections_connection_idx
  on public.deadman_incident_research_connections (connection_id);

alter table public.deadman_incident_research_leads enable row level security;
alter table public.deadman_incident_research_connections enable row level security;
revoke all on table public.deadman_incident_research_leads
  from public, anon, authenticated;
revoke all on table public.deadman_incident_research_connections
  from public, anon, authenticated;
grant select on table public.deadman_incident_research_leads to authenticated;
grant select on table public.deadman_incident_research_connections to authenticated;
grant all on table public.deadman_incident_research_leads to service_role;
grant all on table public.deadman_incident_research_connections to service_role;

drop policy if exists "Admins can read deadman incident research leads"
  on public.deadman_incident_research_leads;
create policy "Admins can read deadman incident research leads"
  on public.deadman_incident_research_leads for select
  to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "Admins can read deadman incident research connections"
  on public.deadman_incident_research_connections;
create policy "Admins can read deadman incident research connections"
  on public.deadman_incident_research_connections for select
  to authenticated
  using (public.is_admin((select auth.uid())));

-- Service workers may organize private research into an incident, but a new
-- incident attachment broadens publication scope. Close any already-open
-- entity gate so an administrator must re-open it with the attachment present.
create or replace function public.close_deadman_gate_for_incident_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entity_id uuid;
  v_entity_key text;
  v_entity_type text;
  v_was_ready boolean;
begin
  if tg_op = 'UPDATE'
     and to_jsonb(old)->>'incident_id' = to_jsonb(new)->>'incident_id'
     and coalesce(
       to_jsonb(old)->>'lead_id', to_jsonb(old)->>'connection_id'
     ) = coalesce(
       to_jsonb(new)->>'lead_id', to_jsonb(new)->>'connection_id'
     ) then
    return new;
  end if;

  if tg_table_name = 'deadman_incident_research_leads' then
    select lead.id, lead.topic_key, lead.publication_ready
    into v_entity_id, v_entity_key, v_was_ready
    from public.deadman_research_leads lead
    where lead.id = new.lead_id
    for update of lead;

    if not found then
      raise exception 'Incident research lead link references a missing lead.';
    end if;

    if v_was_ready then
    update public.deadman_research_leads lead
    set publication_ready = false,
        publication_opened_at = null,
        publication_opened_by = null,
        publication_open_reason = null
    where lead.id = new.lead_id
      and lead.publication_ready;
    end if;
    v_entity_type := 'lead';
  else
    select connection.id, connection.connection_key,
           connection.publication_ready
    into v_entity_id, v_entity_key, v_was_ready
    from public.deadman_research_connections connection
    where connection.id = new.connection_id
    for update of connection;

    if not found then
      raise exception 'Incident research connection link references a missing connection.';
    end if;

    if v_was_ready then
    update public.deadman_research_connections connection
    set publication_ready = false,
        publication_opened_at = null,
        publication_opened_by = null,
        publication_open_reason = null
    where connection.id = new.connection_id
      and connection.publication_ready;
    end if;
    v_entity_type := 'connection';
  end if;

  if v_was_ready then
    insert into public.deadman_research_gate_audit (
      entity_type, entity_id, action, actor_label, reason, gate_snapshot
    ) values (
      v_entity_type,
      v_entity_id,
      'auto_closed',
      'database:incident-link-change',
      'The publication gate closed because the research entity was attached to an additional incident scope.',
      jsonb_build_object(
        'entity_key', v_entity_key,
        'incident_id', new.incident_id
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists deadman_incident_research_lead_gate_close
  on public.deadman_incident_research_leads;
create trigger deadman_incident_research_lead_gate_close
  after insert or update
  on public.deadman_incident_research_leads
  for each row execute function public.close_deadman_gate_for_incident_link();

drop trigger if exists deadman_incident_research_connection_gate_close
  on public.deadman_incident_research_connections;
create trigger deadman_incident_research_connection_gate_close
  after insert or update
  on public.deadman_incident_research_connections
  for each row execute function public.close_deadman_gate_for_incident_link();

revoke all on function public.close_deadman_gate_for_incident_link()
  from public, anon, authenticated, service_role;

create or replace function public.validate_deadman_research_connection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.publication_ready then
    raise exception 'New research connections must begin behind a closed publication gate.';
  end if;

  if tg_op = 'UPDATE' and old.publication_ready and (
    old.incident_id is distinct from new.incident_id
    or old.scope is distinct from new.scope
    or old.global_applicability is distinct from new.global_applicability
    or old.status is distinct from new.status
    or old.connection_key is distinct from new.connection_key
    or old.from_lead_id is distinct from new.from_lead_id
    or old.to_lead_id is distinct from new.to_lead_id
    or old.connection_summary is distinct from new.connection_summary
    or old.connection_class is distinct from new.connection_class
    or old.relationship_kind is distinct from new.relationship_kind
    or old.confidence is distinct from new.confidence
    or old.source_manifest is distinct from new.source_manifest
    or old.supported_claims is distinct from new.supported_claims
    or old.contrary_or_limiting_evidence is distinct from new.contrary_or_limiting_evidence
    or old.public_summary is distinct from new.public_summary
    or old.publication_gate_note is distinct from new.publication_gate_note
    or old.last_source_review_at is distinct from new.last_source_review_at
  ) then
    new.publication_ready := false;
    new.publication_opened_at := null;
    new.publication_opened_by := null;
    new.publication_open_reason := null;
    insert into public.deadman_research_gate_audit (
      entity_type, entity_id, action, actor_label, reason, gate_snapshot
    ) values (
      'connection', new.id, 'auto_closed', 'database:material-change',
      'The publication gate closed automatically because material connection evidence or wording changed.',
      jsonb_build_object('connection_key', new.connection_key)
    );
  end if;

  if not (
    (
      new.scope = 'global'
      and new.incident_id is null
      and char_length(trim(new.global_applicability)) between 40 and 4000
    )
    or (
      new.scope = 'incident'
      and new.global_applicability = ''
    )
  ) then
    raise exception 'Connection scope and global applicability are inconsistent.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.source_manifest) source
    where jsonb_typeof(source) <> 'object'
       or coalesce(source->>'id', '') !~
         '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$'
  ) or exists (
    select 1
    from jsonb_array_elements(new.source_manifest) source
    group by source->>'id'
    having count(*) > 1
  ) then
    raise exception 'Connection source manifest ids must be valid and unique.';
  end if;

  if new.publication_ready then
    if new.status not in ('verified', 'published') then
      raise exception 'A publication-ready connection must be verified or published.';
    end if;
    if new.connection_class not in ('supported_inference', 'verified_record') then
      raise exception 'Temporal proximity or an allegation alone cannot be publication ready.';
    end if;
    if new.confidence not in ('corroborated', 'primary_record') then
      raise exception 'A publication-ready connection must be corroborated.';
    end if;
    if new.last_source_review_at is null
       or new.last_source_review_at < now() - interval '7 days'
       or new.last_source_review_at > now() + interval '5 minutes' then
      raise exception 'A publication-ready connection requires a current, non-future source review.';
    end if;
    if char_length(trim(new.public_summary)) < 30 then
      raise exception 'A publication-ready connection requires a public summary.';
    end if;
    if new.publication_opened_at is null
       or coalesce(new.publication_opened_by, '') !~
         '^(admin|editor|counsel):[a-zA-Z0-9._@-]{3,}$'
       or char_length(trim(coalesce(new.publication_open_reason, ''))) < 20 then
      raise exception 'A publication-ready connection requires an auditable human gate opening.';
    end if;
    if jsonb_array_length(new.source_manifest) = 0
       or not exists (
         select 1
         from jsonb_array_elements(new.source_manifest) source
         where jsonb_typeof(source) = 'object'
           and source->>'visibility' = 'public'
           and coalesce(source->>'public_url', source->>'url', '') ~ '^https://[^[:space:]]+$'
       ) then
      raise exception 'A publication-ready connection requires a public source URL.';
    end if;
    if new.confidence = 'primary_record' and not exists (
      select 1
      from jsonb_array_elements(new.source_manifest) source
      where source->>'visibility' = 'public'
        and source->>'authentication' = 'authenticated_primary'
        and coalesce(source->>'public_url', source->>'url', '') ~ '^https://[^[:space:]]+$'
    ) then
      raise exception 'Primary-record confidence requires an authenticated primary source.';
    end if;
    if new.confidence = 'corroborated' and (
      select count(distinct source->>'source_family')
      from jsonb_array_elements(new.source_manifest) source
      where source->>'visibility' = 'public'
        and coalesce(source->>'source_family', '') <> ''
        and coalesce(source->>'public_url', source->>'url', '') ~ '^https://[^[:space:]]+$'
    ) < 2 then
      raise exception 'Corroborated confidence requires two distinct public source families.';
    end if;
    if jsonb_array_length(new.supported_claims) = 0
       or exists (
         select 1
         from jsonb_array_elements(new.supported_claims) claim
         where jsonb_typeof(claim) <> 'object'
            or coalesce(claim->>'id', '') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$'
            or char_length(trim(coalesce(claim->>'claim', ''))) < 8
            or coalesce(claim->'publication_ready', 'false'::jsonb) <> 'true'::jsonb
            or char_length(trim(coalesce(claim->>'public_wording', ''))) < 8
            or coalesce(claim->>'claim_class', '') not in (
              'verified_record', 'supported_inference'
            )
            or coalesce(jsonb_typeof(claim->'source_ids'), '') <> 'array'
            or coalesce(jsonb_array_length(claim->'source_ids'), 0) = 0
       ) then
      raise exception 'A publication-ready connection requires reviewed claim-level support.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(new.supported_claims) claim
      group by claim->>'id'
      having count(*) > 1
    ) then
      raise exception 'Supported connection claim ids must be unique.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(new.supported_claims) claim
      cross join lateral jsonb_array_elements_text(
        claim->'source_ids'
      ) source_ref(value)
      group by claim->>'id', source_ref.value
      having count(*) > 1
    ) then
      raise exception 'Supported connection claim source ids must be unique.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(new.supported_claims) claim,
           jsonb_array_elements_text(claim->'source_ids') source_ref(value)
      where not exists (
        select 1
        from jsonb_array_elements(new.source_manifest) source
        where source->>'id' = source_ref.value
          and source->>'visibility' = 'public'
          and coalesce(source->>'public_url', source->>'url', '') ~ '^https://[^[:space:]]+$'
      )
    ) then
      raise exception 'A connection claim cites a source that is not public and linked.';
    end if;
    if new.confidence = 'corroborated' and exists (
      select 1
      from jsonb_array_elements(new.supported_claims) claim
      where (
        select count(distinct source->>'source_family')
        from jsonb_array_elements_text(claim->'source_ids') source_ref(value)
        join lateral jsonb_array_elements(new.source_manifest) source
          on source->>'id' = source_ref.value
        where source->>'visibility' = 'public'
          and coalesce(source->>'source_family', '') <> ''
          and coalesce(source->>'public_url', source->>'url', '') ~
            '^https://[^[:space:]]+$'
      ) < 2
    ) then
      raise exception 'Every corroborated connection claim requires two distinct public source families.';
    end if;
    if new.confidence = 'primary_record' and exists (
      select 1
      from jsonb_array_elements(new.supported_claims) claim
      where not exists (
        select 1
        from jsonb_array_elements_text(claim->'source_ids') source_ref(value)
        join lateral jsonb_array_elements(new.source_manifest) source
          on source->>'id' = source_ref.value
        where source->>'visibility' = 'public'
          and source->>'authentication' = 'authenticated_primary'
          and coalesce(source->>'public_url', source->>'url', '') ~
            '^https://[^[:space:]]+$'
      )
    ) then
      raise exception 'Every primary-record connection claim requires its own authenticated primary source.';
    end if;
    if not exists (
      select 1
      from public.deadman_research_leads lead
      where lead.id = new.from_lead_id
        and lead.publication_ready
        and lead.status in ('verified', 'published')
    ) or not exists (
      select 1
      from public.deadman_research_leads lead
      where lead.id = new.to_lead_id
        and lead.publication_ready
        and lead.status in ('verified', 'published')
    ) then
      raise exception 'Both research leads must be publication ready first.';
    end if;
    if new.scope = 'global' and exists (
      select 1
      from public.deadman_research_leads lead
      where lead.id in (new.from_lead_id, new.to_lead_id)
        and lead.scope <> 'global'
    ) then
      raise exception 'A global connection may use only global endpoint leads.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists deadman_research_connection_validation
  on public.deadman_research_connections;
create trigger deadman_research_connection_validation
  before insert or update
  on public.deadman_research_connections
  for each row execute function public.validate_deadman_research_connection();

revoke all on function public.validate_deadman_research_connection()
  from public, anon, authenticated;

-- Research workers may prepare and revise closed records, but they cannot set
-- or forge publication-gate fields. Only the authenticated-admin RPCs below
-- can open a gate; automation may close a gate through the fail-safe RPC.
revoke update on table public.deadman_research_leads from service_role;
grant update (
  incident_id, title, jurisdiction, research_question, status, priority,
  source_manifest, supported_propositions, contrary_or_limiting_evidence,
  publication_gate_note, assigned_to,
  subject_classification, identity_confidence, legal_restrictions,
  public_safe_scope, scope, global_applicability, last_source_review_at,
  updated_at
) on table public.deadman_research_leads to service_role;
revoke delete, truncate on table public.deadman_research_leads
  from service_role;

revoke update on table public.deadman_research_connections from service_role;
grant update (
  incident_id, scope, global_applicability, connection_key,
  from_lead_id, to_lead_id,
  connection_summary, connection_class, relationship_kind, confidence,
  status, source_manifest, supported_claims, contrary_or_limiting_evidence,
  public_summary, publication_gate_note, last_source_review_at, updated_at
) on table public.deadman_research_connections to service_role;
revoke delete, truncate on table public.deadman_research_connections
  from service_role;

create or replace function public.open_deadman_research_lead_gate(
  p_lead_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_snapshot jsonb;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'An authenticated administrator must open this publication gate.';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 20 then
    raise exception 'A specific gate-opening reason is required.';
  end if;

  update public.deadman_research_leads lead
  set publication_ready = true,
      publication_opened_at = now(),
      publication_opened_by = 'admin:' || v_actor::text,
      publication_open_reason = trim(p_reason)
  where lead.id = p_lead_id
  returning jsonb_build_object(
    'topic_key', lead.topic_key,
    'status', lead.status,
    'identity_confidence', lead.identity_confidence,
      'public_safe_scope', lead.public_safe_scope,
      'scope', lead.scope,
      'global_applicability', lead.global_applicability,
      'last_source_review_at', lead.last_source_review_at,
      'incident_ids', (
        select coalesce(jsonb_agg(incident_lead.incident_id), '[]'::jsonb)
        from public.deadman_incident_research_leads incident_lead
        where incident_lead.lead_id = lead.id
      )
  ) into v_snapshot;

  if v_snapshot is null then
    raise exception 'Research lead not found.';
  end if;

  insert into public.deadman_research_gate_audit (
    entity_type, entity_id, action, actor_uid, actor_label, reason,
    gate_snapshot
  ) values (
    'lead', p_lead_id, 'opened', v_actor, 'admin:' || v_actor::text,
    trim(p_reason), v_snapshot
  );
end;
$$;

create or replace function public.open_deadman_research_connection_gate(
  p_connection_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_snapshot jsonb;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'An authenticated administrator must open this publication gate.';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 20 then
    raise exception 'A specific gate-opening reason is required.';
  end if;

  update public.deadman_research_connections connection
  set publication_ready = true,
      publication_opened_at = now(),
      publication_opened_by = 'admin:' || v_actor::text,
      publication_open_reason = trim(p_reason)
  where connection.id = p_connection_id
  returning jsonb_build_object(
    'connection_key', connection.connection_key,
    'status', connection.status,
    'connection_class', connection.connection_class,
      'relationship_kind', connection.relationship_kind,
      'confidence', connection.confidence,
      'public_summary', connection.public_summary,
      'last_source_review_at', connection.last_source_review_at,
      'incident_ids', (
        select coalesce(
          jsonb_agg(incident_connection.incident_id), '[]'::jsonb
        )
        from public.deadman_incident_research_connections incident_connection
        where incident_connection.connection_id = connection.id
      )
  ) into v_snapshot;

  if v_snapshot is null then
    raise exception 'Research connection not found.';
  end if;

  insert into public.deadman_research_gate_audit (
    entity_type, entity_id, action, actor_uid, actor_label, reason,
    gate_snapshot
  ) values (
    'connection', p_connection_id, 'opened', v_actor,
    'admin:' || v_actor::text, trim(p_reason), v_snapshot
  );
end;
$$;

create or replace function public.close_deadman_research_lead_gate(
  p_lead_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_label text;
  v_snapshot jsonb;
begin
  if char_length(trim(coalesce(p_reason, ''))) < 20 then
    raise exception 'A specific gate-closing reason is required.';
  end if;
  if coalesce(auth.jwt()->>'role', '') = 'service_role' then
    v_actor_label := 'service:fail-safe-close';
  elsif v_actor is not null and public.is_admin(v_actor) then
    v_actor_label := 'admin:' || v_actor::text;
  else
    raise exception 'Not authorized to close this publication gate.';
  end if;

  update public.deadman_research_leads lead
  set publication_ready = false,
      publication_opened_at = null,
      publication_opened_by = null,
      publication_open_reason = null
  where lead.id = p_lead_id
  returning jsonb_build_object('topic_key', lead.topic_key) into v_snapshot;

  if v_snapshot is null then
    raise exception 'Research lead not found.';
  end if;

  insert into public.deadman_research_gate_audit (
    entity_type, entity_id, action, actor_uid, actor_label, reason,
    gate_snapshot
  ) values (
    'lead', p_lead_id, 'closed', v_actor, v_actor_label,
    trim(p_reason), v_snapshot
  );
end;
$$;

create or replace function public.close_deadman_research_connection_gate(
  p_connection_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_label text;
  v_snapshot jsonb;
begin
  if char_length(trim(coalesce(p_reason, ''))) < 20 then
    raise exception 'A specific gate-closing reason is required.';
  end if;
  if coalesce(auth.jwt()->>'role', '') = 'service_role' then
    v_actor_label := 'service:fail-safe-close';
  elsif v_actor is not null and public.is_admin(v_actor) then
    v_actor_label := 'admin:' || v_actor::text;
  else
    raise exception 'Not authorized to close this publication gate.';
  end if;

  update public.deadman_research_connections connection
  set publication_ready = false,
      publication_opened_at = null,
      publication_opened_by = null,
      publication_open_reason = null
  where connection.id = p_connection_id
  returning jsonb_build_object(
    'connection_key', connection.connection_key
  ) into v_snapshot;

  if v_snapshot is null then
    raise exception 'Research connection not found.';
  end if;

  insert into public.deadman_research_gate_audit (
    entity_type, entity_id, action, actor_uid, actor_label, reason,
    gate_snapshot
  ) values (
    'connection', p_connection_id, 'closed', v_actor, v_actor_label,
    trim(p_reason), v_snapshot
  );
end;
$$;

revoke all on function public.open_deadman_research_lead_gate(uuid, text)
  from public, anon, authenticated;
revoke all on function public.open_deadman_research_connection_gate(uuid, text)
  from public, anon, authenticated;
revoke all on function public.close_deadman_research_lead_gate(uuid, text)
  from public, anon, authenticated;
revoke all on function public.close_deadman_research_connection_gate(uuid, text)
  from public, anon, authenticated;
grant execute on function public.open_deadman_research_lead_gate(uuid, text)
  to authenticated;
grant execute on function public.open_deadman_research_connection_gate(uuid, text)
  to authenticated;
grant execute on function public.close_deadman_research_lead_gate(uuid, text)
  to authenticated, service_role;
grant execute on function public.close_deadman_research_connection_gate(uuid, text)
  to authenticated, service_role;

create or replace function public.normalize_deadman_hourly_backstop()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old_slug text;
  v_sources jsonb;
begin
  if new.source_classification <> 'hourly_status_no_new_information' then
    return new;
  end if;

  v_old_slug := new.slug;
  new.slug := 'ryan-nichols-custody-status-' ||
    to_char(new.submitted_at at time zone 'UTC', 'YYYY-MM-DD-HH24MI-SS') ||
    '-utc';

  select coalesce(jsonb_agg(source), '[]'::jsonb)
  into v_sources
  from jsonb_array_elements(new.public_record_sources) source
  where source->>'type' = 'hourly_status_check';

  if jsonb_array_length(v_sources) = 0 then
    raise exception 'An hourly backstop requires its fresh status-check source.';
  end if;
  new.public_record_sources := v_sources;
  new.x_post := replace(new.x_post, '/posts/' || v_old_slug, '/posts/' || new.slug);
  new.facebook_post := replace(
    new.facebook_post, '/posts/' || v_old_slug, '/posts/' || new.slug
  );
  return new;
end;
$$;

drop trigger if exists deadman_00_hourly_backstop_normalization
  on public.deadman_updates;
create trigger deadman_00_hourly_backstop_normalization
  before insert or update
  on public.deadman_updates
  for each row execute function public.normalize_deadman_hourly_backstop();

revoke all on function public.normalize_deadman_hourly_backstop()
  from public, anon, authenticated;

-- Re-check private publication gates when an update is first staged and again
-- when its status changes at release time. Generic errors avoid leaking a
-- private lead name through an API response.
create or replace function public.deadman_evidence_network_gate_error(
  p_update public.deadman_updates
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_public_text text;
  v_body_normalized text;
  v_restricted_surface_text text;
begin
  if p_update.status in ('withdrawn', 'failed') then
    return null;
  end if;
  if p_update.editorial_mode <> 'evidence_led_accountability_v3' then
    return 'unsupported_editorial_mode';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_update.public_record_sources) source
    where coalesce(source->>'id', '') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$'
  ) or exists (
    select 1
    from jsonb_array_elements(p_update.public_record_sources) source
    group by source->>'id'
    having count(*) > 1
  ) then
    return 'invalid_or_duplicate_public_source_id';
  end if;

  if exists (
    select 1
    from (
      select claim->>'id' as id
      from jsonb_array_elements(p_update.claim_labels->'verified_facts') claim
      union all
      select claim->>'id'
      from jsonb_array_elements(p_update.claim_labels->'attributed_allegations') claim
      union all
      select claim->>'id'
      from jsonb_array_elements(p_update.claim_labels->'editorial_inferences') claim
      union all
      select claim->>'id'
      from jsonb_array_elements(p_update.claim_labels->'advocacy_positions') claim
      union all
      select claim->>'id'
      from jsonb_array_elements(p_update.claim_labels->'unresolved_questions') claim
    ) all_claims
    group by all_claims.id
    having coalesce(all_claims.id, '') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$'
       or count(*) > 1
  ) then
    return 'invalid_or_duplicate_claim_id';
  end if;

  -- Claims that participate in the private graph carry their lead mapping on
  -- the claim itself. Missing mappings remain compatible with ordinary v3
  -- custody facts, but a supplied mapping must be a unique subset of the
  -- update-level research_lead_keys array.
  if exists (
    select 1
    from (
      select claim
      from jsonb_array_elements(
        p_update.claim_labels->'verified_facts'
      ) claim
      union all
      select claim
      from jsonb_array_elements(
        p_update.claim_labels->'attributed_allegations'
      ) claim
      union all
      select claim
      from jsonb_array_elements(
        p_update.claim_labels->'editorial_inferences'
      ) claim
    ) graph_claim
    where (
      graph_claim.claim ? 'mapped_lead_keys'
      and jsonb_typeof(graph_claim.claim->'mapped_lead_keys') <> 'array'
    ) or exists (
      select 1
      from jsonb_array_elements_text(
        case when jsonb_typeof(
          graph_claim.claim->'mapped_lead_keys'
        ) = 'array' then graph_claim.claim->'mapped_lead_keys'
        else '[]'::jsonb end
      ) mapped_lead(value)
      group by mapped_lead.value
      having mapped_lead.value !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
         or count(*) > 1
         or not coalesce(
           p_update.fact_basis->'research_lead_keys' ? mapped_lead.value,
           false
         )
    ) or (
      graph_claim.claim ? 'source_ids'
      and jsonb_typeof(graph_claim.claim->'source_ids') <> 'array'
    ) or exists (
      select 1
      from jsonb_array_elements_text(
        case when jsonb_typeof(graph_claim.claim->'source_ids') = 'array'
          then graph_claim.claim->'source_ids' else '[]'::jsonb end
      ) claim_source(value)
      group by claim_source.value
      having claim_source.value !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$'
         or count(*) > 1
    )
  ) then
    return 'invalid_claim_graph_mapping_or_source_ids';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(
      p_update.claim_labels->'editorial_inferences'
    ) inference,
    jsonb_array_elements_text(inference->'basis_claim_ids') basis_ref(value)
    where not exists (
      select 1
      from jsonb_array_elements(
        p_update.claim_labels->'verified_facts'
      ) verified_fact
      where verified_fact->>'id' = basis_ref.value
    )
  ) then
    return 'inference_basis_must_be_verified_fact';
  end if;

  if exists (
    select 1
    from unnest(p_update.accountability_targets) target(name)
    where coalesce(lower(trim(target.name)), '') <> all (array[
      'harrison county public agencies',
      'harrison county, texas',
      'harrison county sheriff''s office',
      'harrison county pretrial services',
      'harrison county district attorney''s office',
      'harrison county courts'
    ]::text[])
      and not exists (
        select 1
        from public.deadman_research_leads lead
        where lead.publication_ready
          and lead.status in ('verified', 'published')
          and lead.last_source_review_at >= now() - interval '7 days'
          and lead.last_source_review_at <= now() + interval '5 minutes'
          and lead.subject_classification in (
            'public_official', 'public_employee', 'public_agency'
          )
          and exists (
            select 1
            from jsonb_array_elements(lead.supported_propositions) proposition
            where coalesce(
              proposition->'publication_ready', 'false'::jsonb
            ) = 'true'::jsonb
              and proposition->>'proposition_kind' = 'public_role'
              and proposition->>'claim_class' = 'verified_fact'
          )
          and exists (
            select 1
            from unnest(lead.publication_terms) publication_term(value)
            where lower(publication_term.value) = lower(target.name)
          )
      )
  ) then
    return 'accountability_target_not_verified_public_role';
  end if;

  v_public_text := lower(regexp_replace(concat_ws(
    ' ', p_update.slug, p_update.title, p_update.body, p_update.category,
    p_update.seo_title,
    p_update.seo_description, p_update.x_post, p_update.facebook_post,
    array_to_string(p_update.accountability_targets, ' '),
    array_to_string(p_update.named_persons, ' '),
    array_to_string(p_update.related_topics, ' '),
    array_to_string(p_update.tags, ' ')
  ), '\s+', ' ', 'g'));
  v_body_normalized := lower(regexp_replace(p_update.body, '\s+', ' ', 'g'));
  v_restricted_surface_text := lower(regexp_replace(concat_ws(
    ' ', p_update.slug, p_update.title, p_update.category,
    p_update.seo_title, p_update.seo_description, p_update.x_post,
    p_update.facebook_post,
    array_to_string(p_update.accountability_targets, ' '),
    array_to_string(p_update.named_persons, ' '),
    array_to_string(p_update.related_topics, ' '),
    array_to_string(p_update.tags, ' ')
  ), '\s+', ' ', 'g'));

  -- Lock every lead implicated by literal text or an explicit reference. A
  -- concurrent gate-closing transaction must finish before release continues.
  perform lead.id
  from public.deadman_research_leads lead
  where exists (
    select 1
    from unnest(lead.publication_terms) publication_term(value)
    where position(
      lower(regexp_replace(publication_term.value, '\s+', ' ', 'g'))
      in v_public_text
    ) > 0
  ) or lead.topic_key in (
    select lead_ref.value
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_update.fact_basis->'research_lead_keys') = 'array'
        then p_update.fact_basis->'research_lead_keys' else '[]'::jsonb end
    ) lead_ref(value)
  )
  for share of lead;

  perform connection.id
  from public.deadman_research_connections connection
  where connection.id::text in (
    select connection_ref->>'connection_id'
    from jsonb_array_elements(
      case when jsonb_typeof(p_update.fact_basis->'evidence_network_connection_refs') = 'array'
        then p_update.fact_basis->'evidence_network_connection_refs'
        else '[]'::jsonb end
    ) connection_ref
  )
  for share of connection;

  if exists (
    select 1
    from public.deadman_research_leads lead
    cross join lateral unnest(lead.publication_terms) publication_term(value)
    where position(
      lower(regexp_replace(publication_term.value, '\s+', ' ', 'g'))
      in v_public_text
    ) > 0
      and not (
        lead.publication_ready
        and lead.status in ('verified', 'published')
        and lead.last_source_review_at >= now() - interval '7 days'
        and lead.last_source_review_at <= now() + interval '5 minutes'
      )
  ) then
    return 'closed_private_research_term';
  end if;

  if p_update.fact_basis ? 'research_lead_keys'
     and jsonb_typeof(p_update.fact_basis->'research_lead_keys') <> 'array' then
    return 'invalid_research_lead_keys';
  end if;
  if p_update.fact_basis ? 'research_claim_refs'
     and jsonb_typeof(p_update.fact_basis->'research_claim_refs') <> 'array' then
    return 'invalid_research_claim_refs';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_update.fact_basis->'research_lead_keys') = 'array'
        then p_update.fact_basis->'research_lead_keys' else '[]'::jsonb end
    ) lead_ref(value)
    group by lead_ref.value
    having lead_ref.value !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
       or count(*) > 1
  ) then
    return 'invalid_or_duplicate_research_lead_key';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_update.fact_basis->'research_lead_keys') = 'array'
        then p_update.fact_basis->'research_lead_keys' else '[]'::jsonb end
    ) lead_ref(value)
    where not exists (
      select 1
      from public.deadman_research_leads lead
      where lead.topic_key = lead_ref.value
        and lead.publication_ready
        and lead.status in ('verified', 'published')
        and lead.last_source_review_at >= now() - interval '7 days'
        and lead.last_source_review_at <= now() + interval '5 minutes'
        and (
          (
            lead.scope = 'global'
            and char_length(trim(lead.global_applicability)) between 40 and 4000
          )
          or exists (
            select 1
            from public.deadman_incident_research_leads incident_lead
            where incident_lead.incident_id = p_update.incident_id
              and incident_lead.lead_id = lead.id
          )
        )
    )
  ) then
    return 'research_lead_not_ready_or_not_in_incident_scope';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_update.fact_basis->'research_lead_keys') = 'array'
        then p_update.fact_basis->'research_lead_keys' else '[]'::jsonb end
    ) lead_ref(value)
    where not exists (
      select 1
      from jsonb_array_elements(
        case when jsonb_typeof(p_update.fact_basis->'research_claim_refs') = 'array'
          then p_update.fact_basis->'research_claim_refs' else '[]'::jsonb end
      ) claim_ref
      where claim_ref->>'lead_key' = lead_ref.value
    )
  ) then
    return 'research_lead_missing_claim_ref';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(
      case when jsonb_typeof(p_update.fact_basis->'research_claim_refs') = 'array'
        then p_update.fact_basis->'research_claim_refs' else '[]'::jsonb end
    ) claim_ref
    group by claim_ref->>'lead_key', claim_ref->>'research_claim_id'
    having count(*) > 1
  ) or exists (
    select 1
    from jsonb_array_elements(
      case when jsonb_typeof(p_update.fact_basis->'research_claim_refs') = 'array'
        then p_update.fact_basis->'research_claim_refs' else '[]'::jsonb end
    ) claim_ref
    group by
      claim_ref->>'lead_key',
      claim_ref->>'update_claim_id',
      claim_ref->>'update_claim_class'
    having count(*) > 1
  ) then
    return 'duplicate_or_non_unique_research_claim_ref';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(
      case when jsonb_typeof(p_update.fact_basis->'research_claim_refs') = 'array'
        then p_update.fact_basis->'research_claim_refs' else '[]'::jsonb end
    ) claim_ref
    where jsonb_typeof(claim_ref) <> 'object'
       or coalesce(claim_ref->>'lead_key', '') = ''
       or coalesce(claim_ref->>'research_claim_id', '') = ''
       or coalesce(claim_ref->>'update_claim_id', '') = ''
       or coalesce(claim_ref->>'update_claim_class', '') not in (
         'verified_facts', 'attributed_allegations', 'editorial_inferences'
       )
       or not coalesce(
         p_update.fact_basis->'research_lead_keys' ? (claim_ref->>'lead_key'),
         false
       )
       or not exists (
         select 1
         from public.deadman_research_leads lead
         cross join lateral jsonb_array_elements(
           lead.supported_propositions
         ) proposition
         cross join lateral jsonb_array_elements(
           case when jsonb_typeof(
             p_update.claim_labels->(claim_ref->>'update_claim_class')
           ) = 'array'
             then p_update.claim_labels->(claim_ref->>'update_claim_class')
             else '[]'::jsonb end
         ) update_claim
         where lead.topic_key = claim_ref->>'lead_key'
           and lead.publication_ready
           and lead.status in ('verified', 'published')
           and proposition->>'id' = claim_ref->>'research_claim_id'
           and coalesce(
             proposition->'publication_ready', 'false'::jsonb
           ) = 'true'::jsonb
           and update_claim->>'id' = claim_ref->>'update_claim_id'
           and jsonb_typeof(update_claim->'mapped_lead_keys') = 'array'
           and update_claim->'mapped_lead_keys' ? lead.topic_key
           and lower(regexp_replace(
             trim(update_claim->>'claim'), '\s+', ' ', 'g'
           )) = lower(regexp_replace(
             trim(proposition->>'public_wording'), '\s+', ' ', 'g'
           ))
           and claim_ref->>'update_claim_class' = case
             proposition->>'claim_class'
             when 'verified_fact' then 'verified_facts'
             when 'attributed_allegation' then 'attributed_allegations'
             when 'supported_inference' then 'editorial_inferences'
             else ''
           end
           and jsonb_typeof(update_claim->'source_ids') = 'array'
           and jsonb_array_length(update_claim->'source_ids') > 0
           and not exists (
             select update_source_ref.value
             from jsonb_array_elements_text(
               update_claim->'source_ids'
             ) update_source_ref(value)
             except
             select reviewed_source_ref.value
             from jsonb_array_elements_text(
               proposition->'source_ids'
             ) reviewed_source_ref(value)
           )
           and not exists (
             select reviewed_source_ref.value
             from jsonb_array_elements_text(
               proposition->'source_ids'
             ) reviewed_source_ref(value)
             except
             select update_source_ref.value
             from jsonb_array_elements_text(
               update_claim->'source_ids'
             ) update_source_ref(value)
           )
           and not exists (
             select 1
             from jsonb_array_elements_text(
               update_claim->'source_ids'
             ) update_source_ref(value)
             where not exists (
               select 1
               from jsonb_array_elements(
                 p_update.public_record_sources
               ) update_source
               join lateral jsonb_array_elements(
                 lead.source_manifest
               ) reviewed_source
                 on reviewed_source->>'id' = update_source_ref.value
               where update_source->>'id' = update_source_ref.value
                 and reviewed_source->>'visibility' = 'public'
                 and coalesce(
                   update_source->>'public_url', update_source->>'url', ''
                 ) = coalesce(
                   reviewed_source->>'public_url', reviewed_source->>'url', ''
                 )
                 and coalesce(
                   reviewed_source->>'public_url', reviewed_source->>'url', ''
                 ) ~ '^https://[^[:space:]]+$'
             )
           )
       )
  ) then
    return 'research_claim_not_publication_ready';
  end if;

  -- A gated term may appear only inside the article body, and only as part of
  -- exact reviewed proposition wording mapped to this update. This prevents a
  -- safe claim-label entry from laundering an unreviewed headline, SEO field,
  -- social caption, tag, or additional body mention about the same subject.
  if exists (
    select 1
    from public.deadman_research_leads lead
    cross join lateral unnest(lead.publication_terms) publication_term(value)
    cross join lateral (
      select lower(regexp_replace(publication_term.value, '\s+', ' ', 'g'))
        as normalized_term
    ) term
    where lead.publication_ready
      and lead.status in ('verified', 'published')
      and position(term.normalized_term in v_public_text) > 0
      and (
        position(term.normalized_term in v_restricted_surface_text) > 0
        or not exists (
          select 1
          from jsonb_array_elements(
            case when jsonb_typeof(p_update.fact_basis->'research_claim_refs') = 'array'
              then p_update.fact_basis->'research_claim_refs' else '[]'::jsonb end
          ) claim_ref
          join lateral jsonb_array_elements(
            lead.supported_propositions
          ) proposition on proposition->>'id' = claim_ref->>'research_claim_id'
          cross join lateral (
            select lower(regexp_replace(
              trim(proposition->>'public_wording'), '\s+', ' ', 'g'
            )) as normalized_wording
          ) wording
          where claim_ref->>'lead_key' = lead.topic_key
            and coalesce(
              proposition->'publication_ready', 'false'::jsonb
            ) = 'true'::jsonb
            and position(term.normalized_term in wording.normalized_wording) > 0
            and position(wording.normalized_wording in v_body_normalized) > 0
        )
        or (
          char_length(v_body_normalized) - char_length(replace(
            v_body_normalized, term.normalized_term, ''
          ))
        ) / char_length(term.normalized_term) > coalesce((
          select sum((
            char_length(wording.normalized_wording) - char_length(replace(
              wording.normalized_wording, term.normalized_term, ''
            ))
          ) / char_length(term.normalized_term))
          from jsonb_array_elements(
            case when jsonb_typeof(p_update.fact_basis->'research_claim_refs') = 'array'
              then p_update.fact_basis->'research_claim_refs' else '[]'::jsonb end
          ) claim_ref
          join lateral jsonb_array_elements(
            lead.supported_propositions
          ) proposition on proposition->>'id' = claim_ref->>'research_claim_id'
          cross join lateral (
            select lower(regexp_replace(
              trim(proposition->>'public_wording'), '\s+', ' ', 'g'
            )) as normalized_wording
          ) wording
          where claim_ref->>'lead_key' = lead.topic_key
            and coalesce(
              proposition->'publication_ready', 'false'::jsonb
            ) = 'true'::jsonb
            and position(term.normalized_term in wording.normalized_wording) > 0
            and position(wording.normalized_wording in v_body_normalized) > 0
        ), 0)
      )
  ) then
    return 'gated_term_outside_exact_reviewed_body_wording';
  end if;

  if exists (
    select 1
    from public.deadman_research_leads lead
    cross join lateral unnest(lead.publication_terms) publication_term(value)
    cross join lateral (
      select 'verified_facts'::text as claim_class, claim
      from jsonb_array_elements(p_update.claim_labels->'verified_facts') claim
      union all
      select 'attributed_allegations'::text, claim
      from jsonb_array_elements(p_update.claim_labels->'attributed_allegations') claim
      union all
      select 'editorial_inferences'::text, claim
      from jsonb_array_elements(p_update.claim_labels->'editorial_inferences') claim
    ) update_claim
    where lead.publication_ready
      and lead.status in ('verified', 'published')
      and position(
        lower(regexp_replace(publication_term.value, '\s+', ' ', 'g'))
        in lower(regexp_replace(
          update_claim.claim->>'claim', '\s+', ' ', 'g'
        ))
      ) > 0
      and not exists (
        select 1
        from jsonb_array_elements(
          case when jsonb_typeof(p_update.fact_basis->'research_claim_refs') = 'array'
            then p_update.fact_basis->'research_claim_refs' else '[]'::jsonb end
        ) claim_ref
        where claim_ref->>'lead_key' = lead.topic_key
          and claim_ref->>'update_claim_id' = update_claim.claim->>'id'
          and claim_ref->>'update_claim_class' = update_claim.claim_class
      )
  ) then
    return 'gated_claim_missing_exact_research_mapping';
  end if;

  if exists (
    select 1
    from public.deadman_research_leads lead
    cross join lateral unnest(lead.publication_terms) publication_term(value)
    where position(
      lower(regexp_replace(publication_term.value, '\s+', ' ', 'g'))
      in v_public_text
    ) > 0
      and lead.publication_ready
      and lead.status in ('verified', 'published')
      and not exists (
        select 1
        from jsonb_array_elements_text(
          case when jsonb_typeof(p_update.fact_basis->'research_lead_keys') = 'array'
            then p_update.fact_basis->'research_lead_keys' else '[]'::jsonb end
        ) lead_ref(value)
        where lead_ref.value = lead.topic_key
      )
  ) then
    return 'research_term_missing_lead_ref';
  end if;

  if p_update.fact_basis ? 'evidence_network_connection_refs'
     and jsonb_typeof(p_update.fact_basis->'evidence_network_connection_refs') <> 'array' then
    return 'invalid_connection_refs';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(
      case when jsonb_typeof(
        p_update.fact_basis->'evidence_network_connection_refs'
      ) = 'array' then
        p_update.fact_basis->'evidence_network_connection_refs'
      else '[]'::jsonb end
    ) connection_ref
    group by
      connection_ref->>'connection_id',
      connection_ref->>'connection_claim_id',
      connection_ref->>'update_claim_id',
      connection_ref->>'update_claim_class'
    having count(*) > 1
  ) then
    return 'duplicate_connection_claim_ref';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(
      case when jsonb_typeof(p_update.fact_basis->'evidence_network_connection_refs') = 'array'
        then p_update.fact_basis->'evidence_network_connection_refs'
        else '[]'::jsonb end
    ) connection_ref
    where jsonb_typeof(connection_ref) <> 'object'
       or coalesce(connection_ref->>'connection_id', '') !~
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or coalesce(connection_ref->>'connection_claim_id', '') = ''
       or coalesce(connection_ref->>'update_claim_id', '') = ''
       or coalesce(connection_ref->>'update_claim_class', '') not in (
         'verified_facts', 'attributed_allegations', 'editorial_inferences'
       )
       or not exists (
         select 1
         from public.deadman_research_connections connection
         cross join lateral jsonb_array_elements(
           connection.supported_claims
         ) connection_claim
         cross join lateral jsonb_array_elements(
           case when jsonb_typeof(
             p_update.claim_labels->(connection_ref->>'update_claim_class')
           ) = 'array'
             then p_update.claim_labels->(connection_ref->>'update_claim_class')
             else '[]'::jsonb end
         ) update_claim
         where connection.id::text = connection_ref->>'connection_id'
           and connection.publication_ready
           and connection.status in ('verified', 'published')
           and connection.last_source_review_at >= now() - interval '7 days'
           and connection.last_source_review_at <= now() + interval '5 minutes'
           and (
             (
               connection.scope = 'global'
               and char_length(trim(connection.global_applicability))
                 between 40 and 4000
             )
             or exists (
               select 1
               from public.deadman_incident_research_connections incident_connection
               where incident_connection.incident_id = p_update.incident_id
                 and incident_connection.connection_id = connection.id
             )
           )
           and connection.connection_class in ('supported_inference', 'verified_record')
           and connection.confidence in ('corroborated', 'primary_record')
           and connection_claim->>'id' = connection_ref->>'connection_claim_id'
           and coalesce(
             connection_claim->'publication_ready', 'false'::jsonb
           ) = 'true'::jsonb
           and update_claim->>'id' = connection_ref->>'update_claim_id'
           and jsonb_typeof(update_claim->'mapped_lead_keys') = 'array'
           and lower(regexp_replace(
             trim(update_claim->>'claim'), '\s+', ' ', 'g'
           )) = lower(regexp_replace(
             trim(connection_claim->>'public_wording'), '\s+', ' ', 'g'
           ))
           and connection_ref->>'update_claim_class' = case
             connection_claim->>'claim_class'
             when 'verified_record' then 'verified_facts'
             when 'supported_inference' then 'editorial_inferences'
             else ''
           end
           and jsonb_typeof(update_claim->'source_ids') = 'array'
           and jsonb_array_length(update_claim->'source_ids') > 0
           and not exists (
             select update_source_ref.value
             from jsonb_array_elements_text(
               update_claim->'source_ids'
             ) update_source_ref(value)
             except
             select reviewed_source_ref.value
             from jsonb_array_elements_text(
               connection_claim->'source_ids'
             ) reviewed_source_ref(value)
           )
           and not exists (
             select reviewed_source_ref.value
             from jsonb_array_elements_text(
               connection_claim->'source_ids'
             ) reviewed_source_ref(value)
             except
             select update_source_ref.value
             from jsonb_array_elements_text(
               update_claim->'source_ids'
             ) update_source_ref(value)
           )
           and not exists (
             select 1
             from jsonb_array_elements_text(
               update_claim->'source_ids'
             ) update_source_ref(value)
             where not exists (
               select 1
               from jsonb_array_elements(
                 p_update.public_record_sources
               ) update_source
               join lateral jsonb_array_elements(
                 connection.source_manifest
               ) reviewed_source
                 on reviewed_source->>'id' = update_source_ref.value
               where update_source->>'id' = update_source_ref.value
                 and reviewed_source->>'visibility' = 'public'
                 and coalesce(
                   update_source->>'public_url', update_source->>'url', ''
                 ) = coalesce(
                   reviewed_source->>'public_url', reviewed_source->>'url', ''
                 )
                 and coalesce(
                   reviewed_source->>'public_url', reviewed_source->>'url', ''
                 ) ~ '^https://[^[:space:]]+$'
             )
           )
       )
  ) then
    return 'connection_claim_not_publication_ready';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(
      case when jsonb_typeof(p_update.fact_basis->'evidence_network_connection_refs') = 'array'
        then p_update.fact_basis->'evidence_network_connection_refs'
        else '[]'::jsonb end
    ) connection_ref
    join public.deadman_research_connections connection
      on connection.id::text = connection_ref->>'connection_id'
    join public.deadman_research_leads from_lead
      on from_lead.id = connection.from_lead_id
    join public.deadman_research_leads to_lead
      on to_lead.id = connection.to_lead_id
    join lateral jsonb_array_elements(
      case when jsonb_typeof(
        p_update.claim_labels->(connection_ref->>'update_claim_class')
      ) = 'array' then
        p_update.claim_labels->(connection_ref->>'update_claim_class')
      else '[]'::jsonb end
    ) update_claim
      on update_claim->>'id' = connection_ref->>'update_claim_id'
    where not (
      coalesce(
        p_update.fact_basis->'research_lead_keys' ? from_lead.topic_key,
        false
      )
      and coalesce(
        p_update.fact_basis->'research_lead_keys' ? to_lead.topic_key,
        false
      )
      and coalesce(
        update_claim->'mapped_lead_keys' ? from_lead.topic_key,
        false
      )
      and coalesce(
        update_claim->'mapped_lead_keys' ? to_lead.topic_key,
        false
      )
    )
  ) then
    return 'connection_endpoints_missing_article_or_claim_lead_refs';
  end if;

  -- Apply the connection rule at claim granularity. A multi-lead fact,
  -- attributed allegation, or inference must have exact reviewed connection
  -- references that cover every mapped lead; unrelated single-lead claims in
  -- the same article do not inherit this requirement.
  if exists (
    select 1
    from (
      select 'verified_facts'::text as claim_class, claim
      from jsonb_array_elements(
        p_update.claim_labels->'verified_facts'
      ) claim
      union all
      select 'attributed_allegations'::text, claim
      from jsonb_array_elements(
        p_update.claim_labels->'attributed_allegations'
      ) claim
      union all
      select 'editorial_inferences'::text, claim
      from jsonb_array_elements(
        p_update.claim_labels->'editorial_inferences'
      ) claim
    ) update_claim
    where (
      select count(distinct mapped_lead.value)
      from jsonb_array_elements_text(
        case when jsonb_typeof(
          update_claim.claim->'mapped_lead_keys'
        ) = 'array' then update_claim.claim->'mapped_lead_keys'
        else '[]'::jsonb end
      ) mapped_lead(value)
    ) > 1
      and exists (
        select 1
        from jsonb_array_elements_text(
          update_claim.claim->'mapped_lead_keys'
        ) mapped_lead(value)
        where not exists (
          select 1
          from jsonb_array_elements(
            case when jsonb_typeof(
              p_update.fact_basis->'evidence_network_connection_refs'
            ) = 'array' then
              p_update.fact_basis->'evidence_network_connection_refs'
            else '[]'::jsonb end
          ) connection_ref
          join public.deadman_research_connections connection
            on connection.id::text = connection_ref->>'connection_id'
          join public.deadman_research_leads from_lead
            on from_lead.id = connection.from_lead_id
          join public.deadman_research_leads to_lead
            on to_lead.id = connection.to_lead_id
          where connection_ref->>'update_claim_id' =
              update_claim.claim->>'id'
            and connection_ref->>'update_claim_class' =
              update_claim.claim_class
            and mapped_lead.value in (
              from_lead.topic_key, to_lead.topic_key
            )
        )
      )
  ) then
    return 'cross_lead_claim_missing_exact_connection_coverage';
  end if;

  return null;
end;
$$;

revoke all on function public.deadman_evidence_network_gate_error(
  public.deadman_updates
) from public, anon, authenticated;
grant execute on function public.deadman_evidence_network_gate_error(
  public.deadman_updates
) to service_role;

create or replace function public.validate_deadman_evidence_network_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_gate_error text;
begin
  v_gate_error := public.deadman_evidence_network_gate_error(new);
  if v_gate_error is not null then
    raise exception 'Evidence-network publication gate rejected this update.'
      using
        errcode = 'P0001',
        hint = 'deadman_evidence_network_gate';
  end if;
  return new;
end;
$$;

drop trigger if exists deadman_evidence_network_update_validation
  on public.deadman_updates;
create trigger deadman_evidence_network_update_validation
  before insert or update
  on public.deadman_updates
  for each row execute function public.validate_deadman_evidence_network_update();

revoke all on function public.validate_deadman_evidence_network_update()
  from public, anon, authenticated;

create or replace function public.reconcile_deadman_evidence_network_queue(
  p_incident_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_withdrawn integer := 0;
  v_detail jsonb := '[]'::jsonb;
begin
  with invalid as materialized (
    select
      update_row.id,
      public.deadman_evidence_network_gate_error(update_row) as reason
    from public.deadman_updates update_row
    where update_row.incident_id = p_incident_id
      and update_row.status = 'ready'
  ), withdrawn as (
    update public.deadman_updates update_row
    set status = 'withdrawn',
        correction_summary = coalesce(
          update_row.correction_summary,
          'Withdrawn because a private evidence-network publication gate closed or became incomplete.'
        )
    from invalid
    where update_row.id = invalid.id
      and invalid.reason is not null
    returning update_row.id, invalid.reason
  )
  select count(*)::integer,
         coalesce(
           jsonb_agg(jsonb_build_object(
             'update_id', withdrawn.id,
             'reason', withdrawn.reason
           )),
           '[]'::jsonb
         )
  into v_withdrawn, v_detail
  from withdrawn;

  if v_withdrawn > 0 then
    insert into public.deadman_event_log (
      incident_id, event_type, actor_id, detail
    ) values (
      p_incident_id,
      'evidence_network_queue_reconciled',
      'deadman-release-worker',
      jsonb_build_object(
        'withdrawn_count', v_withdrawn,
        'updates', v_detail
      )
    );
  end if;

  return v_withdrawn;
end;
$$;

revoke all on function public.reconcile_deadman_evidence_network_queue(uuid)
  from public, anon, authenticated;
grant execute on function public.reconcile_deadman_evidence_network_queue(uuid)
  to service_role;

create or replace function public.get_deadman_research_dashboard(
  p_incident_id uuid default null
)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_leads jsonb;
  v_connections jsonb;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'Not authorized to read the private research dashboard.';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', lead.id,
      'topic_key', lead.topic_key,
      'title', lead.title,
      'jurisdiction', lead.jurisdiction,
      'status', lead.status,
      'priority', lead.priority,
      'subject_classification', lead.subject_classification,
      'identity_confidence', lead.identity_confidence,
      'publication_ready', lead.publication_ready,
      'publication_gate_note', lead.publication_gate_note,
      'public_safe_scope', lead.public_safe_scope,
      'legal_restrictions', lead.legal_restrictions,
      'source_count', jsonb_array_length(lead.source_manifest),
      'proposition_count', jsonb_array_length(lead.supported_propositions),
      'limitation_count', jsonb_array_length(lead.contrary_or_limiting_evidence),
      'last_source_review_at', lead.last_source_review_at,
      'review_stale', lead.last_source_review_at is null
        or lead.last_source_review_at < now() - interval '7 days'
        or lead.last_source_review_at > now() + interval '5 minutes',
      'gate_actor', gate_audit.actor_label,
      'gate_action_at', gate_audit.created_at,
      'gate_reason', gate_audit.reason
    ) order by lead.priority desc, lead.title
  ), '[]'::jsonb)
  into v_leads
  from public.deadman_research_leads lead
  left join lateral (
    select audit.actor_label, audit.created_at, audit.reason
    from public.deadman_research_gate_audit audit
    where audit.entity_type = 'lead' and audit.entity_id = lead.id
    order by audit.created_at desc
    limit 1
  ) gate_audit on true
  where p_incident_id is null
     or lead.scope = 'global'
     or lead.incident_id = p_incident_id
     or exists (
       select 1
       from public.deadman_incident_research_leads incident_lead
       where incident_lead.incident_id = p_incident_id
         and incident_lead.lead_id = lead.id
     );

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', connection.id,
      'connection_key', connection.connection_key,
      'from_title', from_lead.title,
      'to_title', to_lead.title,
      'connection_class', connection.connection_class,
      'relationship_kind', connection.relationship_kind,
      'confidence', connection.confidence,
      'scope', connection.scope,
      'status', connection.status,
      'publication_ready', connection.publication_ready,
      'publication_gate_note', connection.publication_gate_note,
      'public_summary', connection.public_summary,
      'source_count', jsonb_array_length(connection.source_manifest),
      'claim_count', jsonb_array_length(connection.supported_claims),
      'limitation_count', jsonb_array_length(connection.contrary_or_limiting_evidence),
      'last_source_review_at', connection.last_source_review_at,
      'review_stale', connection.last_source_review_at is null
        or connection.last_source_review_at < now() - interval '7 days'
        or connection.last_source_review_at > now() + interval '5 minutes',
      'gate_actor', gate_audit.actor_label,
      'gate_action_at', gate_audit.created_at,
      'gate_reason', gate_audit.reason
    ) order by connection.publication_ready desc, connection.updated_at desc
  ), '[]'::jsonb)
  into v_connections
  from public.deadman_research_connections connection
  join public.deadman_research_leads from_lead
    on from_lead.id = connection.from_lead_id
  join public.deadman_research_leads to_lead
    on to_lead.id = connection.to_lead_id
  left join lateral (
    select audit.actor_label, audit.created_at, audit.reason
    from public.deadman_research_gate_audit audit
    where audit.entity_type = 'connection'
      and audit.entity_id = connection.id
    order by audit.created_at desc
    limit 1
  ) gate_audit on true
  where p_incident_id is null
     or connection.scope = 'global'
     or connection.incident_id = p_incident_id
     or exists (
       select 1
       from public.deadman_incident_research_connections incident_connection
       where incident_connection.incident_id = p_incident_id
         and incident_connection.connection_id = connection.id
     );

  return jsonb_build_object(
    'leads', v_leads,
    'connections', v_connections,
    'lead_count', jsonb_array_length(v_leads),
    'connection_count', jsonb_array_length(v_connections),
    'publication_ready_connection_count', (
      select count(*)
      from jsonb_array_elements(v_connections) connection
      where connection->>'publication_ready' = 'true'
    )
  );
end;
$$;

revoke all on function public.get_deadman_research_dashboard(uuid)
  from public, anon, authenticated;
grant execute on function public.get_deadman_research_dashboard(uuid)
  to authenticated;

comment on table public.deadman_research_connections is
  'Private evidence-network hypotheses. A row is not a public assertion; both endpoint leads and the connection require independent publication review.';
comment on column public.deadman_research_leads.publication_terms is
  'Private literal terms blocked from public updates until this lead is publication ready.';
comment on column public.deadman_research_leads.public_safe_scope is
  'The narrow, source-supported scope permitted in public reporting after the gate opens.';
comment on column public.deadman_research_leads.scope is
  'Incident leads require an explicit incident junction; only audited protocol-wide baseline questions may use global scope.';
comment on column public.deadman_research_leads.global_applicability is
  'Human-reviewable explanation required before a global lead can bypass incident junction scoping.';
comment on column public.deadman_research_connections.scope is
  'Incident connections require an explicit incident junction; global connections must join only global leads.';
comment on column public.deadman_research_connections.last_source_review_at is
  'Freshness boundary rechecked when the gate opens and again whenever a queued update is released.';
comment on function public.deadman_evidence_network_gate_error(
  public.deadman_updates
) is
  'Private release validator: exact claim wording, source ids/URLs, incident scope, and per-claim multi-lead connection coverage must all match reviewed graph records.';
