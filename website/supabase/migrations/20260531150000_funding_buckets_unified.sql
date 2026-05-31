-- Unified funding tool: funding_buckets() returns BOTH monthly and one-time
-- active line items with their cadence, so a single client component can render
-- the whole picture (the $5k monthly goal split into buckets + the one-time
-- legal war chest). Monthly raised = this month's designated gifts
-- (campaign = fund:<id>); one-time raised = all-time designated gifts.
-- SECURITY DEFINER so the public tool reads aggregates without exposing the
-- RLS-protected donations rows. Aggregates only — no PII.
drop function if exists public.funding_buckets();

create function public.funding_buckets()
returns table (
  id uuid,
  label text,
  blurb text,
  goal_cents bigint,
  raised_cents bigint,
  cadence text,
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
        and (li.cadence <> 'monthly' or d.created_at >= date_trunc('month', now()))
    ), 0)::bigint as raised_cents,
    li.cadence,
    li.sort_order
  from funding_line_items li
  where li.is_active
  order by (li.cadence = 'monthly') desc, li.sort_order, li.label;
$$;

revoke all on function public.funding_buckets() from public;
grant execute on function public.funding_buckets() to anon, authenticated;
