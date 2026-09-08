-- Captured from production on 2026-09-08 (pg_get_functiondef, proacl).
-- No behavior change: this function was created straight in production and
-- had no migration. The site reads it through lib/site-totals.ts.
CREATE OR REPLACE FUNCTION public.site_totals()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'auth', 'pg_temp'
AS $function$
  with pardon as (
    select '2025-01-20'::date as pardon_date, '2025-01-20'::date as dismissed_date
  )
  select jsonb_build_object(
    'defendants', (select count(*)::bigint from case_people where is_j6_defendant),
    'defendants_verified', (select count(*)::bigint from case_people where is_j6_defendant and claim_status = 'verified'),
    'defendants_pending', (select count(*)::bigint from case_people where is_j6_defendant and claim_status = 'pending'),
    'defendants_unclaimed', (select count(*)::bigint from case_people where is_j6_defendant and (claim_status = 'unclaimed' or claim_status is null)),
    'documents', (select count(*)::bigint from case_documents where visibility = 'public' and not archived),
    'grievances', (select count(*)::bigint from case_grievances where visibility = 'public'),
    'events', (select count(*)::bigint from case_events where visibility = 'public'),
    'total_views', (
      (select coalesce(sum(views_count),0) from posts where status = 'published')
      + (select coalesce(sum(views_count),0) from case_people where visibility = 'public')
      + (select coalesce(sum(views_count),0) from case_documents where visibility = 'public' and not archived)
      + (select coalesce(sum(views_count),0) from case_grievances where visibility = 'public')
      + (select coalesce(sum(views_count),0) from case_events where visibility = 'public')
    )::bigint,
    'total_shares', (
      (select coalesce(sum(shares_count),0) from posts where status = 'published')
      + (select coalesce(sum(shares_count),0) from case_people where visibility = 'public')
      + (select coalesce(sum(shares_count),0) from case_documents where visibility = 'public' and not archived)
      + (select coalesce(sum(shares_count),0) from case_grievances where visibility = 'public')
      + (select coalesce(sum(shares_count),0) from case_events where visibility = 'public')
    )::bigint,
    'days_since_pardon', (select greatest(0, (current_date - pardon_date))::int from pardon),
    'days_since_dismissal', (select greatest(0, (current_date - dismissed_date))::int from pardon),
    'live_now', (
      select count(distinct session_id)::int from page_views
      where last_activity_at >= now() - interval '5 minutes' and session_id is not null
    ),
    'countries_now', (
      select count(distinct country)::int from page_views
      where last_activity_at >= now() - interval '5 minutes' and country is not null and session_id is not null
    )
  );
$function$;

-- Grants as in production: {postgres, anon, authenticated, service_role}.
revoke all on function public.site_totals() from public;
grant execute on function public.site_totals() to anon, authenticated, service_role;
