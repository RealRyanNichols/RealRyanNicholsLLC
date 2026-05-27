-- Fix undercounted stats. PostgREST caps row fetches at 1000, so any stat
-- computed by fetching rows and counting/summing in JS undercounts once a
-- table passes 1000 rows (case_people = 1571, case_documents = 1044). These
-- aggregations move server-side, where there is no cap.

-- site_totals(): add view/share sums + the unclaimed breakdown.
create or replace function public.site_totals()
returns jsonb
language sql
stable
security definer
set search_path to 'public','extensions','auth','pg_temp'
as $function$
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

-- Map-room "Patterns" aggregates (defendant status + document-type histogram),
-- correct past 1000 rows.
create or replace function public.case_pattern_stats()
returns jsonb
language sql
stable
security definer
set search_path to 'public','extensions','auth','pg_temp'
as $function$
  select jsonb_build_object(
    'defendants_total', (select count(*)::bigint from case_people where is_j6_defendant),
    'defendants_verified', (select count(*)::bigint from case_people where is_j6_defendant and claim_status = 'verified'),
    'defendants_pending', (select count(*)::bigint from case_people where is_j6_defendant and claim_status = 'pending'),
    'defendants_unclaimed', (select count(*)::bigint from case_people where is_j6_defendant and (claim_status = 'unclaimed' or claim_status is null)),
    'documents_total', (select count(*)::bigint from case_documents where visibility = 'public' and not archived),
    'doc_types', (
      select coalesce(jsonb_agg(jsonb_build_object('type', doc_type, 'n', n) order by n desc), '[]'::jsonb)
      from (
        select coalesce(doc_type::text, 'other') doc_type, count(*) n
        from case_documents where visibility = 'public' and not archived
        group by 1
      ) t
    )
  );
$function$;

revoke all on function public.case_pattern_stats() from public;
grant execute on function public.case_pattern_stats() to anon, authenticated;
