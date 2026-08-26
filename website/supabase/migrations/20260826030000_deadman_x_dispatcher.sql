-- Atomic, service-role-only claim operation for unattended X publishing.
-- Failed or ambiguous attempts are not automatically retried; that prevents a
-- network timeout after a successful X mutation from producing a duplicate.

alter table public.deadman_social_dispatches
  drop constraint if exists deadman_social_dispatches_status_check;

alter table public.deadman_social_dispatches
  add constraint deadman_social_dispatches_status_check
  check (status in ('ready', 'posting', 'posted', 'failed', 'skipped'));

create or replace function public.claim_next_deadman_social_dispatch(
  p_platform text default 'x'
)
returns setof public.deadman_social_dispatches
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_platform not in ('x', 'facebook') then
    raise exception 'Unsupported social platform.' using errcode = '22023';
  end if;

  return query
  with candidate as (
    select dispatch.id
    from public.deadman_social_dispatches dispatch
    join public.deadman_incidents incident on incident.id = dispatch.incident_id
    where dispatch.platform = p_platform
      and dispatch.status = 'ready'
      and incident.status = 'active'
    order by dispatch.created_at, dispatch.id
    for update of dispatch skip locked
    limit 1
  )
  update public.deadman_social_dispatches dispatch
  set status = 'posting',
      attempt_count = dispatch.attempt_count + 1,
      last_attempt_at = now(),
      error = null,
      updated_at = now()
  from candidate
  where dispatch.id = candidate.id
  returning dispatch.*;
end;
$$;

revoke all on function public.claim_next_deadman_social_dispatch(text) from public;
revoke all on function public.claim_next_deadman_social_dispatch(text) from anon;
revoke all on function public.claim_next_deadman_social_dispatch(text) from authenticated;
grant execute on function public.claim_next_deadman_social_dispatch(text) to service_role;

comment on function public.claim_next_deadman_social_dispatch(text) is
  'Atomically claims one active-incident social dispatch for a service-role worker.';
