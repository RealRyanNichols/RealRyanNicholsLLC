-- Deadman's Switch v2: attributable activation, durable incident/audit state,
-- and an atomic one-post-per-calendar-hour release gate.

create table if not exists public.deadman_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_code text not null unique,
  status text not null default 'verifying'
    check (status in ('verifying', 'active', 'resolved', 'false_alarm', 'activation_failed')),
  activator_id text not null,
  activator_label text not null,
  confirmation_type text not null
    check (confirmation_type in (
      'official_booking_record',
      'filed_court_order',
      'attorney_or_designated_contact',
      'authenticated_contact_from_custody',
      'custodial_agency_confirmation'
    )),
  confirmation_summary text not null,
  source_url text,
  agency text,
  facility text,
  public_release_authorized boolean not null default false,
  reported_at timestamptz not null default now(),
  activated_at timestamptz,
  resolved_at timestamptz,
  last_release_at timestamptz,
  total_released integer not null default 0 check (total_released >= 0),
  resolution_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one live or activating incident may exist. This makes repeated or
-- concurrent activation requests idempotent instead of publishing twice.
create unique index if not exists deadman_one_live_incident_idx
  on public.deadman_incidents ((true))
  where status in ('verifying', 'active');

create index if not exists deadman_incidents_reported_at_idx
  on public.deadman_incidents (reported_at desc);

-- Updates are editorial work records, not pre-approved posts. A post row is
-- created only when the hourly release function publishes an update.
create table if not exists public.deadman_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.deadman_incidents(id) on delete cascade,
  sequence_no bigint generated always as identity,
  status text not null default 'ready'
    check (status in ('ready', 'published', 'withdrawn', 'failed')),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 8 and 200),
  body text not null check (char_length(body) between 200 and 50000),
  category text not null default 'Legal Update',
  byline_override text not null default 'Real Ryan Nichols Editorial Team',
  og_image_url text not null default '/og/custody-status',
  seo_title text,
  seo_description text,
  source_classification text not null,
  public_record_sources jsonb not null,
  fact_basis jsonb not null default '{}'::jsonb,
  x_post text check (x_post is null or char_length(x_post) between 20 and 280),
  facebook_post text check (facebook_post is null or char_length(facebook_post) between 20 and 5000),
  named_persons text[] not null default array['Ryan Nichols']::text[],
  tags text[] not null default array['Ryan Nichols', 'custody update', 'Harrison County']::text[],
  created_by text not null default 'custody-response-agent',
  submitted_at timestamptz not null default now(),
  published_at timestamptz,
  post_id uuid unique references public.posts(id) on delete set null,
  check (jsonb_typeof(public_record_sources) = 'array'),
  check (jsonb_array_length(public_record_sources) > 0)
);

create index if not exists deadman_updates_release_idx
  on public.deadman_updates (incident_id, status, sequence_no);

create table if not exists public.deadman_social_dispatches (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.deadman_incidents(id) on delete cascade,
  update_id uuid not null references public.deadman_updates(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  platform text not null check (platform in ('x', 'facebook')),
  body text not null,
  status text not null default 'ready'
    check (status in ('ready', 'posted', 'failed', 'skipped')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  posted_at timestamptz,
  external_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (update_id, platform)
);

create index if not exists deadman_social_dispatch_ready_idx
  on public.deadman_social_dispatches (status, created_at)
  where status in ('ready', 'failed');

create table if not exists public.deadman_event_log (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.deadman_incidents(id) on delete set null,
  event_type text not null,
  actor_id text not null,
  request_fingerprint text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists deadman_event_log_incident_idx
  on public.deadman_event_log (incident_id, created_at desc);

alter table public.deadman_incidents enable row level security;
alter table public.deadman_updates enable row level security;
alter table public.deadman_social_dispatches enable row level security;
alter table public.deadman_event_log enable row level security;

revoke all on table public.deadman_incidents from anon, authenticated;
revoke all on table public.deadman_updates from anon, authenticated;
revoke all on table public.deadman_social_dispatches from anon, authenticated;
revoke all on table public.deadman_event_log from anon, authenticated;
grant select, update on table public.deadman_incidents to authenticated;
grant select on table public.deadman_updates to authenticated;
grant select on table public.deadman_social_dispatches to authenticated;
grant select on table public.deadman_event_log to authenticated;
grant all on table public.deadman_incidents to service_role;
grant all on table public.deadman_updates to service_role;
grant all on table public.deadman_social_dispatches to service_role;
grant all on table public.deadman_event_log to service_role;

drop policy if exists "Admins can read deadman incidents" on public.deadman_incidents;
create policy "Admins can read deadman incidents"
  on public.deadman_incidents for select
  to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "Admins can update deadman incidents" on public.deadman_incidents;
create policy "Admins can update deadman incidents"
  on public.deadman_incidents for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists "Admins can read deadman event log" on public.deadman_event_log;
create policy "Admins can read deadman event log"
  on public.deadman_event_log for select
  to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "Admins can read deadman updates" on public.deadman_updates;
create policy "Admins can read deadman updates"
  on public.deadman_updates for select
  to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "Admins can read deadman social dispatches" on public.deadman_social_dispatches;
create policy "Admins can read deadman social dispatches"
  on public.deadman_social_dispatches for select
  to authenticated
  using (public.is_admin((select auth.uid())));

-- Service-role-only staging RPC for the custody-response agent. This records
-- a source-backed update but does not create a draft post.
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
  if p_x_post is not null and char_length(
    replace(
      p_x_post,
      '{{ARTICLE_URL}}',
      'https://realryannichols.com/posts/' || p_slug
    )
  ) > 280 then
    raise exception 'X post exceeds 280 characters after URL expansion.';
  end if;

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
    facebook_post
  ) values (
    p_incident_id,
    p_slug,
    trim(p_title),
    trim(p_body),
    left(trim(p_title), 70),
    nullif(trim(p_seo_description), ''),
    p_source_classification,
    p_public_record_sources,
    coalesce(p_fact_basis, '{}'::jsonb),
    coalesce(nullif(trim(p_created_by), ''), 'custody-response-agent'),
    nullif(trim(p_x_post), ''),
    nullif(trim(p_facebook_post), '')
  )
  returning id into v_update_id;

  insert into public.deadman_event_log (incident_id, event_type, actor_id, detail)
  values (
    p_incident_id,
    'update_staged',
    coalesce(nullif(trim(p_created_by), ''), 'custody-response-agent'),
    jsonb_build_object('update_id', v_update_id, 'slug', p_slug)
  );

  return v_update_id;
end;
$$;

-- Service-role-only release RPC. A post is created only at publication time.
-- The incident row lock plus a calendar-hour check prevents double releases.
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
begin
  select * into v_incident
  from public.deadman_incidents
  where id = p_incident_id
  for update;

  if not found or v_incident.status <> 'active' or not v_incident.public_release_authorized then
    released_update_id := null;
    released_post_id := null;
    reason := 'inactive';
    next_eligible_at := null;
    ready_count := 0;
    return next;
    return;
  end if;

  select count(*)::integer into ready_count
  from public.deadman_updates u
  where u.incident_id = p_incident_id and u.status = 'ready';

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
  where u.incident_id = p_incident_id and u.status = 'ready'
  order by u.sequence_no asc
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
      created_by
    ) values (
      p_incident_id,
      'ryan-nichols-custody-status-' ||
        to_char(v_now at time zone 'America/Chicago', 'YYYY-MM-DD-HH24'),
      'Ryan Nichols custody status: no new verified development as of ' || v_central_label,
      format($body$
This is the scheduled **%s** update in the public custody-response record for **Ryan Nichols**.

## Current verified status

The response workflow has received **no new verified development** since the previous published bulletin. That means there is no newly confirmed court order, booking change, facility change, release notice, or official explanation ready to report in this hour. It does not mean reporting has stopped.

## What remains under review

The record concerning Ryan Nichols, Harrison County, Texas, pretrial services, custody, due process, and the government's stated basis remains under active review. The team is prioritizing original records, exculpatory evidence, favorable context, witness material, inconsistencies, and procedural irregularities that can be documented responsibly.

Ryan has described any unjustified detention as lawfare, political persecution, and unfair treatment. That is **Ryan's stated position and this site's accountability view**, not a judicial finding. Harrison County agencies and public officials should be judged by their documented authority, actions, omissions, and compliance with the controlling record.

[Read the preceding sourced update](https://realryannichols.com/posts/%s).

## Help get the verified record seen

Share this update locally and nationally. Send original public records, direct source links, or first-hand material through the [evidence submission page](https://realryannichols.com/submit). Preserve originals and timestamps. Do not threaten, harass, dox, contact children, target witnesses, or publish sealed or private information.

{{report: Ryan Nichols hourly custody status}}

{{poll: Will you help keep attention on the verified record? | Share this update | Submit a source | Follow the hourly timeline}}

{{share}}
$body$, v_central_label, v_previous.slug),
      left('Ryan Nichols custody status: no new verified development', 70),
      'Hourly Ryan Nichols custody update covering Harrison County, Texas, pretrial services, due process, exculpatory evidence, and the latest verified status.',
      'hourly_status_no_new_information',
      v_previous.public_record_sources,
      jsonb_build_object(
        'no_new_verified_information', true,
        'previous_update_id', v_previous.id,
        'generated_at', v_now
      ),
      'No new verified development in the Ryan Nichols custody record this hour. The Harrison County and due process timeline remains active. Read, share, and submit original records: ' || v_public_url,
      'There is no new verified development in the Ryan Nichols custody record this hour, but the public timeline remains active.\n\nWe are continuing to examine Harrison County''s documented role, due process, exculpatory evidence, favorable context, and procedural irregularities. Read and share the status update, and submit original public records without harassing or targeting anyone.\n\n' || v_public_url,
      'deadman-hourly-backstop'
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
    jsonb_build_object('incident_id', p_incident_id, 'update_id', v_update.id)
  );

  insert into public.deadman_event_log (incident_id, event_type, actor_id, detail)
  values (
    p_incident_id,
    'hourly_update_released',
    v_update.created_by,
    jsonb_build_object('update_id', v_update.id, 'post_id', v_post_id)
  );

  released_update_id := v_update.id;
  released_post_id := v_post_id;
  reason := 'released';
  next_eligible_at := date_trunc('hour', v_now) + interval '1 hour';
  ready_count := greatest(ready_count - 1, 0);
  return next;
end;
$$;

revoke all on function public.stage_deadman_update(uuid, text, text, text, text, jsonb, jsonb, text, text, text, text) from public;
revoke all on function public.stage_deadman_update(uuid, text, text, text, text, jsonb, jsonb, text, text, text, text) from anon;
revoke all on function public.stage_deadman_update(uuid, text, text, text, text, jsonb, jsonb, text, text, text, text) from authenticated;
grant execute on function public.stage_deadman_update(uuid, text, text, text, text, jsonb, jsonb, text, text, text, text) to service_role;

revoke all on function public.release_next_deadman_update(uuid) from public;
revoke all on function public.release_next_deadman_update(uuid) from anon;
revoke all on function public.release_next_deadman_update(uuid) from authenticated;
grant execute on function public.release_next_deadman_update(uuid) to service_role;

comment on table public.deadman_incidents is
  'Private custody-response incident control. Never exposed directly to anonymous users.';
comment on table public.deadman_updates is
  'Private source-backed hourly update records. Public posts are created only when released.';
comment on table public.deadman_social_dispatches is
  'Private X and Facebook post queue for hourly custody-response articles.';
comment on table public.deadman_event_log is
  'Private append-only audit history for activation, reversal, release, and failed attempts.';
comment on function public.stage_deadman_update(uuid, text, text, text, text, jsonb, jsonb, text, text, text, text) is
  'Stages one source-backed custody-response update without creating a draft post.';
comment on function public.release_next_deadman_update(uuid) is
  'Atomically publishes at most one custody-response update per calendar hour.';
