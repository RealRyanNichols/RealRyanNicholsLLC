-- Public Supporters Wall: a curated, consent-respecting projection over
-- support_intents, exposed as a SECURITY DEFINER function (matching this
-- project's existing anon-callable definer RPCs like site_live_pulse).
-- Exposes ONLY notes Ryan has published (status='published') and ONLY the
-- fields each supporter opted to share:
--   * name shows only when display_as='name'
--   * message shows only when publish_message=true
--   * amount shows only when show_amount=true
-- It NEVER exposes email or ip_hash. The base table stays admin-read-only.
create or replace function public.get_public_supporters(p_limit int default 100)
returns table (
  id uuid,
  created_at timestamptz,
  purpose text,
  display_name text,
  message text,
  amount text
)
language sql
security definer
set search_path = public
as $$
  select
    si.id,
    si.created_at,
    si.purpose,
    case when si.display_as = 'name' then nullif(btrim(si.display_name), '') end,
    case when si.publish_message then nullif(btrim(si.message), '') end,
    case when si.show_amount then nullif(btrim(si.intended_amount), '') end
  from public.support_intents si
  where si.status = 'published'
  order by si.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

revoke all on function public.get_public_supporters(int) from public;
grant execute on function public.get_public_supporters(int) to anon, authenticated;
