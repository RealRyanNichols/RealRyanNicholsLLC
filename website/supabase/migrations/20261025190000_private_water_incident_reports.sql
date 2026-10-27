-- Private leads only. No case_tips/intake_items trigger, publication or email.
create table public.water_incident_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  incident_key text not null default 'fiber-water' check (incident_key = 'fiber-water'),
  town text not null check (length(town) between 2 and 100),
  county text check (length(county) <= 100),
  incident_date date not null,
  utility text check (length(utility) <= 120),
  general_location text check (length(general_location) <= 160),
  knowledge_basis text not null check (knowledge_basis in ('firsthand', 'secondhand', 'mixed')),
  observed_details text not null default '' check (length(observed_details) <= 4000),
  heard_details text not null default '' check (length(heard_details) <= 4000),
  notice_context text check (length(notice_context) <= 2000),
  notice_url text check (length(notice_url) <= 2048 and notice_url ~ '^https?://'),
  contact_email text check (length(contact_email) <= 254),
  contact_permission boolean not null default false,
  private_review_consent boolean not null check (private_review_consent),
  publication_consent boolean not null default false check (not publication_consent),
  source_claims_verified boolean not null default false,
  source_post_slug text check (length(source_post_slug) <= 120 and source_post_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'closed')),
  ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  check (knowledge_basis = 'secondhand' or length(observed_details) >= 20),
  check (knowledge_basis = 'firsthand' or length(heard_details) >= 20),
  check ((contact_permission and contact_email is not null) or (not contact_permission and contact_email is null))
);

create index water_incident_reports_created_idx on public.water_incident_reports (created_at desc);
create index water_incident_reports_rate_idx on public.water_incident_reports (ip_hash, created_at desc);
alter table public.water_incident_reports enable row level security;
alter table public.water_incident_reports force row level security;
revoke all on public.water_incident_reports from public, anon, authenticated;
grant select on public.water_incident_reports to authenticated;
grant select, insert, update, delete on public.water_incident_reports to service_role;
create policy water_incident_reports_admin_read on public.water_incident_reports
  for select to authenticated using (public.is_admin((select auth.uid())));

-- Service-only and atomic, so concurrent requests cannot bypass the private
-- report limit even if the shared attempt limiter is temporarily unavailable.
create function public.submit_water_incident_report(p_report jsonb, p_ip_hash text)
returns uuid language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'INVALID_WATER_REPORT';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 20261025));
  if (select count(*) from public.water_incident_reports
      where ip_hash = p_ip_hash and created_at >= now() - interval '1 hour') >= 3 then
    raise exception 'WATER_REPORT_RATE_LIMITED';
  end if;
  insert into public.water_incident_reports (
    town, county, incident_date, utility, general_location, knowledge_basis,
    observed_details, heard_details, notice_context, notice_url, contact_email,
    contact_permission, private_review_consent, source_post_slug, ip_hash
  ) values (
    trim(p_report->>'town'), nullif(trim(p_report->>'county'), ''),
    (p_report->>'incident_date')::date, nullif(trim(p_report->>'utility'), ''),
    nullif(trim(p_report->>'general_location'), ''), p_report->>'knowledge_basis',
    coalesce(trim(p_report->>'observed_details'), ''), coalesce(trim(p_report->>'heard_details'), ''),
    nullif(trim(p_report->>'notice_context'), ''), nullif(trim(p_report->>'notice_url'), ''),
    nullif(trim(p_report->>'contact_email'), ''),
    coalesce((p_report->>'contact_permission')::boolean, false),
    coalesce((p_report->>'private_review_consent')::boolean, false),
    nullif(p_report->>'source_post_slug', ''), p_ip_hash
  ) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.submit_water_incident_report(jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_water_incident_report(jsonb, text) to service_role;
