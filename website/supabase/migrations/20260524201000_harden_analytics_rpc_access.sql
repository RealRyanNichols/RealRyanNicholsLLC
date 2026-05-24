-- First-party analytics writes run through validated RPC functions.
-- The public tables stay RLS-protected and are readable only to admins.

revoke all on table public.page_views from anon, authenticated;
revoke all on table public.page_events from anon, authenticated;

grant select on table public.page_views to authenticated;
grant select on table public.page_events to authenticated;
grant select, insert, update on table public.page_views to anon;
grant insert on table public.page_events to anon;
grant usage on sequence public.page_views_id_seq to anon;
grant usage on sequence public.page_events_id_seq to anon;

drop policy if exists page_views_admin_read on public.page_views;
drop policy if exists page_events_admin_read on public.page_events;
drop policy if exists page_views_analytics_insert on public.page_views;
drop policy if exists page_views_analytics_touch_select on public.page_views;
drop policy if exists page_views_analytics_touch_update on public.page_views;
drop policy if exists page_events_analytics_insert on public.page_events;

create policy page_views_admin_read
on public.page_views
for select
to authenticated
using (public.is_admin((select auth.uid())));

create policy page_events_admin_read
on public.page_events
for select
to authenticated
using (public.is_admin((select auth.uid())));

create policy page_views_analytics_insert
on public.page_views
for insert
to anon
with check (
  current_setting('app.analytics_rpc', true) = 'record_page_view'
  and user_id is null
  and session_id is not null
  and length(session_id) between 8 and 64
  and path is not null
  and length(path) between 1 and 500
);

create policy page_views_analytics_touch_select
on public.page_views
for select
to anon
using (
  current_setting('app.analytics_touch_session_id', true) <> ''
  and session_id = current_setting('app.analytics_touch_session_id', true)
  and path = current_setting('app.analytics_touch_path', true)
);

create policy page_views_analytics_touch_update
on public.page_views
for update
to anon
using (
  current_setting('app.analytics_touch_session_id', true) <> ''
  and session_id = current_setting('app.analytics_touch_session_id', true)
  and path = current_setting('app.analytics_touch_path', true)
)
with check (
  current_setting('app.analytics_touch_session_id', true) <> ''
  and session_id = current_setting('app.analytics_touch_session_id', true)
  and path = current_setting('app.analytics_touch_path', true)
);

create policy page_events_analytics_insert
on public.page_events
for insert
to anon
with check (
  current_setting('app.analytics_rpc', true) = 'record_page_event'
  and user_id is null
  and session_id is not null
  and length(session_id) between 8 and 64
  and kind is not null
  and length(kind) between 1 and 50
  and path is not null
  and length(path) between 1 and 500
);

create or replace function public.record_page_view(
  p_session_id text,
  p_path text,
  p_ref text default null::text,
  p_ua text default null::text
) returns bigint
language plpgsql
security invoker
set search_path to 'public', 'extensions', 'auth', 'pg_temp'
as $function$
begin
  return public.record_page_view(
    p_session_id,
    p_path,
    p_ref,
    p_ua,
    null,
    null,
    null,
    null,
    null,
    null
  );
end;
$function$;

create or replace function public.record_page_view(
  p_session_id text,
  p_path text,
  p_ref text default null::text,
  p_ua text default null::text,
  p_country text default null::text,
  p_region text default null::text,
  p_city text default null::text,
  p_referrer_host text default null::text,
  p_visitor_hash text default null::text,
  p_device_kind text default null::text
) returns bigint
language plpgsql
security invoker
set search_path to 'public', 'extensions', 'auth', 'pg_temp'
as $function$
begin
  if p_session_id is null or length(p_session_id) < 8 or length(p_session_id) > 64 then
    return null;
  end if;
  if p_path is null or length(p_path) > 500 then
    return null;
  end if;

  perform set_config('app.analytics_rpc', 'record_page_view', true);

  insert into public.page_views (
    session_id, user_id, path, ref, ua,
    country, region, city, referrer_host, visitor_hash, device_kind
  )
  values (
    p_session_id,
    null,
    left(p_path, 500),
    nullif(left(p_ref, 500), ''),
    nullif(left(p_ua, 300), ''),
    nullif(left(p_country, 8), ''),
    nullif(left(p_region, 120), ''),
    nullif(left(p_city, 120), ''),
    nullif(left(p_referrer_host, 200), ''),
    nullif(left(p_visitor_hash, 64), ''),
    nullif(left(p_device_kind, 16), '')
  );

  return null;
end;
$function$;

create or replace function public.touch_page_view_by_session(
  p_session_id text,
  p_path text,
  p_scroll_max integer default null::integer
) returns void
language plpgsql
security invoker
set search_path to 'public', 'extensions', 'auth', 'pg_temp'
as $function$
begin
  if p_session_id is null or length(p_session_id) < 8 or length(p_session_id) > 64 then
    return;
  end if;

  perform set_config('app.analytics_touch_session_id', p_session_id, true);
  perform set_config('app.analytics_touch_path', left(coalesce(p_path, ''), 500), true);

  update public.page_views
  set last_activity_at = now(),
      scroll_max = greatest(coalesce(scroll_max, 0), coalesce(p_scroll_max, 0))
  where id = (
    select id from public.page_views
    where session_id = p_session_id
      and path = left(coalesce(p_path, ''), 500)
    order by started_at desc
    limit 1
  );
end;
$function$;

create or replace function public.record_page_event(
  p_session_id text,
  p_kind text,
  p_target text,
  p_path text
) returns void
language plpgsql
security invoker
set search_path to 'public', 'extensions', 'auth', 'pg_temp'
as $function$
begin
  if p_session_id is null or length(p_session_id) < 8 or length(p_session_id) > 64 then
    return;
  end if;
  if p_kind is null or length(p_kind) > 50 then
    return;
  end if;

  perform set_config('app.analytics_rpc', 'record_page_event', true);

  insert into public.page_events (session_id, user_id, kind, target, path)
  values (
    p_session_id,
    null,
    left(p_kind, 50),
    nullif(left(p_target, 500), ''),
    left(coalesce(p_path, ''), 500)
  );
end;
$function$;

alter function public.nexus_initial_seed(integer) security invoker;
alter function public.nexus_search(text) security invoker;
alter function public.nexus_neighbors(text, text) security invoker;

grant execute on function public.record_page_view(text, text, text, text) to anon;
grant execute on function public.record_page_view(text, text, text, text, text, text, text, text, text, text) to anon;
grant execute on function public.touch_page_view_by_session(text, text, integer) to anon;
grant execute on function public.record_page_event(text, text, text, text) to anon;
revoke execute on function public.record_page_view(text, text, text, text) from authenticated;
revoke execute on function public.record_page_view(text, text, text, text, text, text, text, text, text, text) from authenticated;
revoke execute on function public.touch_page_view_by_session(text, text, integer) from authenticated;
revoke execute on function public.record_page_event(text, text, text, text) from authenticated;
grant execute on function public.nexus_initial_seed(integer) to anon, authenticated;
grant execute on function public.nexus_search(text) to anon, authenticated;
grant execute on function public.nexus_neighbors(text, text) to anon, authenticated;
