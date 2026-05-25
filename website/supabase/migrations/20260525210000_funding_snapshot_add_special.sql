-- Add special_month_cents so the public meter can subtract off-the-books
-- "special" native gifts from the authoritative Stripe total (which includes
-- every charge). Return-type change requires a drop first.
drop function if exists public.funding_snapshot();

create or replace function public.funding_snapshot()
returns table (
  donated_month_cents bigint,
  special_month_cents bigint,
  manual_cents integer,
  raised_cents bigint
)
language sql
security definer
set search_path = public
as $$
  with d as (
    select coalesce(sum(amount_cents), 0)::bigint as cents
    from donations
    where refunded_at is null
      and coalesce(campaign, '') <> 'special'
      and created_at >= date_trunc('month', now())
  ),
  s as (
    select coalesce(sum(amount_cents), 0)::bigint as cents
    from donations
    where refunded_at is null
      and coalesce(campaign, '') = 'special'
      and created_at >= date_trunc('month', now())
  ),
  m as (
    select coalesce((select manual_raised_cents from funding_settings where id = 'default'), 0) as cents
  )
  select d.cents,
         s.cents,
         m.cents,
         (d.cents + m.cents)::bigint
  from d, s, m;
$$;

revoke all on function public.funding_snapshot() from public;
grant execute on function public.funding_snapshot() to anon, authenticated;
