-- Per-bucket funding progress for the gamified donation allocator.
-- Sums this month's donations designated to each active monthly line item
-- (campaign = 'fund:' || line_item_id) alongside that bucket's monthly goal.
-- SECURITY DEFINER so the public allocator can read aggregates without exposing
-- the RLS-protected donations rows. Aggregates only — no PII.
create or replace function public.funding_buckets()
returns table (
  id uuid,
  label text,
  blurb text,
  goal_cents bigint,
  raised_cents bigint,
  sort_order integer
)
language sql
security definer
set search_path = public
as $$
  select
    li.id,
    li.label,
    li.blurb,
    li.amount_cents::bigint as goal_cents,
    coalesce((
      select sum(d.amount_cents)
      from donations d
      where d.refunded_at is null
        and d.campaign = 'fund:' || li.id::text
        and d.created_at >= date_trunc('month', now())
    ), 0)::bigint as raised_cents,
    li.sort_order
  from funding_line_items li
  where li.is_active and li.cadence = 'monthly'
  order by li.sort_order, li.label;
$$;

revoke all on function public.funding_buckets() from public;
grant execute on function public.funding_buckets() to anon, authenticated;
