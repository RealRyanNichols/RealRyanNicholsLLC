-- PHASE B: make page_arrivals (captured by edge middleware) the SINGLE source
-- of posts.views_count going forward. Forward-only; existing counts untouched.

-- 1) Stop the JS page_views trigger from bumping views_count. page_views inserts
--    continue (engagement / post_live_pulse); the inbound-shares trigger stays.
drop trigger if exists trg_bump_post_views_on_first_pageview on public.page_views;

-- 2) No-op the SSR/client RPC (keep signature/return) so any residual caller
--    neither errors nor double-counts. Views are now counted by the trigger.
create or replace function public.increment_post_views(post_slug text)
returns bigint
language sql
security definer
set search_path to 'public','extensions','auth','pg_temp'
as $function$
  select views_count from public.posts where slug = post_slug;
$function$;

-- 3) Per-source arrival log (edge middleware writes here on every tracked GET).
create table if not exists public.page_arrivals (
  id bigserial primary key,
  at timestamptz not null default now(),
  path text not null,
  ua_class text not null,
  country text,
  region text,
  city text,
  referrer_host text,
  ua text,
  viewer_id uuid,
  is_self boolean not null default false
);
create index if not exists page_arrivals_path_at_idx on public.page_arrivals (path, at desc);
create index if not exists page_arrivals_uaclass_at_idx on public.page_arrivals (ua_class, at desc);
create index if not exists page_arrivals_self_path_idx on public.page_arrivals (viewer_id, path) where is_self;

alter table public.page_arrivals enable row level security;
drop policy if exists "page_arrivals admin read" on public.page_arrivals;
create policy "page_arrivals admin read" on public.page_arrivals
  for select using (is_admin((select auth.uid())));

-- 4) RPC the middleware calls (anon-callable, SECURITY DEFINER to insert).
create or replace function public.record_page_arrival(
  p_path text,
  p_ua_class text,
  p_country text default null,
  p_region text default null,
  p_city text default null,
  p_referrer_host text default null,
  p_ua text default null,
  p_viewer_id uuid default null
)
returns void
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_is_self boolean := false;
begin
  if p_path is null
     or p_path like '/_next/%'
     or p_path like '/api/%'
     or p_path ~ '\.[a-z0-9]+$' then
    return;
  end if;
  if p_viewer_id is not null then
    v_is_self := coalesce(public.is_admin(p_viewer_id), false);
  end if;
  insert into public.page_arrivals
    (path, ua_class, country, region, city, referrer_host, ua, viewer_id, is_self)
  values
    (p_path, coalesce(nullif(p_ua_class, ''), 'unknown'), p_country, p_region, p_city,
     p_referrer_host, left(p_ua, 400), p_viewer_id, v_is_self);
end;
$function$;

revoke all on function public.record_page_arrival(text,text,text,text,text,text,text,uuid) from public;
grant execute on function public.record_page_arrival(text,text,text,text,text,text,text,uuid) to anon, authenticated;

-- 5) THE one place views_count increments. Admin (self) counts once per post;
--    everyone else (humans, social/AI/search/uptime bots) counts every arrival.
create or replace function public.bump_views_on_arrival()
returns trigger
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_slug text;
begin
  if new.path like '/posts/%' then
    v_slug := split_part(split_part(new.path, '?', 1), '/', 3);
    if v_slug is null or v_slug = '' then
      return new;
    end if;
    if new.is_self then
      if exists (
        select 1 from public.page_arrivals
        where viewer_id = new.viewer_id and path = new.path and is_self and id < new.id
      ) then
        return new;
      end if;
    end if;
    update public.posts
      set views_count = views_count + 1
      where slug = v_slug and status::text = 'published';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_bump_views_on_arrival on public.page_arrivals;
create trigger trg_bump_views_on_arrival
  after insert on public.page_arrivals
  for each row execute function public.bump_views_on_arrival();
