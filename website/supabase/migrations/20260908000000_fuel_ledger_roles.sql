-- Token Fund roles on the funding ledger.
--
-- 'subscription': what Ryan pays himself every month (Claude Max, ChatGPT
--   Pro, X Premium). Shown on /fuel as context and excluded from every public
--   goal, because he is not asking anyone to cover it.
-- 'overage': the one fundable AI line. Usage credits bought at published API
--   rates when the week's included usage runs dry. It is the /fuel meter
--   target and the "month" tier; never a number typed in code.
-- Every other line item keeps a null role and behaves as before.
alter table public.funding_line_items
  add column if not exists fuel_role text
  check (fuel_role is null or fuel_role in ('subscription', 'overage'));

comment on column public.funding_line_items.fuel_role is
  'Token Fund role: subscription (paid by Ryan, shown as context, excluded from goals) or overage (the fundable ask; the /fuel target). Null for every other line.';

-- funding_buckets(): subscription context rows are not buckets anyone funds.
-- Same body as 20260531150000_funding_buckets_unified.sql plus that filter.
create or replace function public.funding_buckets()
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
    and li.fuel_role is distinct from 'subscription'
  order by (li.cadence = 'monthly') desc, li.sort_order, li.label;
$$;

revoke all on function public.funding_buckets() from public;
grant execute on function public.funding_buckets() to anon, authenticated;
