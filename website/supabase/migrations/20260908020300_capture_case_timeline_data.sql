-- Captured from production on 2026-09-08 (pg_get_functiondef, proacl).
-- No behavior change: created straight in production, no migration until now.
-- Feeds /case/timeline (components/CaseTimeline.tsx).
CREATE OR REPLACE FUNCTION public.case_timeline_data()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'auth', 'pg_temp'
AS $function$
  with rows as (
    select cp.id, cp.slug, cp.name, cp.case_number,
           cp.arrest_date, cp.plea_date, cp.sentence_date,
           cp.sentence_summary, cp.disposition, cp.charges,
           cp.claim_status,
           -- co-defendant count for the visual cluster grouping
           (select count(*) from case_people c2 where c2.case_number = cp.case_number)::int as cluster_size
    from case_people cp
    where cp.is_j6_defendant = true
      and (cp.arrest_date is not null or cp.sentence_date is not null or cp.plea_date is not null)
    order by coalesce(cp.sentence_date, cp.arrest_date, cp.plea_date) asc
  ),
  histogram as (
    -- Sentencings per (year, month) — drives the bar chart
    select
      extract(year from sentence_date)::int as y,
      extract(month from sentence_date)::int as m,
      count(*)::int as n
    from case_people
    where is_j6_defendant = true and sentence_date is not null
    group by y, m
    order by y, m
  ),
  arrests_hist as (
    select
      extract(year from arrest_date)::int as y,
      extract(month from arrest_date)::int as m,
      count(*)::int as n
    from case_people
    where is_j6_defendant = true and arrest_date is not null
    group by y, m
    order by y, m
  )
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id,
      'slug', slug,
      'name', name,
      'case_number', case_number,
      'arrest_date', arrest_date,
      'plea_date', plea_date,
      'sentence_date', sentence_date,
      'sentence_summary', sentence_summary,
      'disposition', disposition,
      'claim_status', claim_status,
      'cluster_size', cluster_size,
      'has_charges', charges is not null and array_length(charges, 1) > 0
    )) from rows), '[]'::jsonb),
    'histograms', jsonb_build_object(
      'sentencings', coalesce((select jsonb_agg(jsonb_build_object('y', y, 'm', m, 'n', n)) from histogram), '[]'::jsonb),
      'arrests', coalesce((select jsonb_agg(jsonb_build_object('y', y, 'm', m, 'n', n)) from arrests_hist), '[]'::jsonb)
    ),
    'totals', jsonb_build_object(
      'with_arrest', (select count(*) from case_people where is_j6_defendant and arrest_date is not null),
      'with_plea', (select count(*) from case_people where is_j6_defendant and plea_date is not null),
      'with_sentence', (select count(*) from case_people where is_j6_defendant and sentence_date is not null),
      'all_j6', (select count(*) from case_people where is_j6_defendant = true)
    )
  );
$function$;

-- Grants as in production: {public, postgres, anon, authenticated, service_role}.
grant execute on function public.case_timeline_data() to public, anon, authenticated, service_role;
