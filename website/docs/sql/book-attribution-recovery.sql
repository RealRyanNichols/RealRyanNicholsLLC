-- READ-ONLY recovery query for book orders that were saved without attribution.
-- Do not run as a migration. It only SELECTs; paste it into the Supabase SQL
-- editor (or psql) when you want to see where those buyers landed.
--
-- Before the rrn_ft / rrn_lt fix, a checkout with no utm, no click id and no
-- referrer (direct visits, dark social, in-app browsers that strip the
-- referrer, new tabs, day-2 buyers) wrote every attribution field as null.
-- The webhook still stored the analytics ids, so the landing can be recovered
-- from page_views:
--
--   book_orders.attribution->>'session_id'  = page_views.session_id
--     (rn_session_id, per browser tab: the tab that clicked "Pre-order")
--   book_orders.attribution->>'visitor_id'  → page_views.visitor_hash
--     visitor_hash = HMAC-SHA256(key = VISITOR_HASH_SALT || ':visitor',
--                                data = visitor_id), hex, first 32 chars
--     (lib/visitor-hash.ts). The salt lives only in Vercel env vars, so the
--     hash cannot be computed from SQL alone. This query therefore joins on
--     session_id. See the optional visitor-level variant at the bottom.
--
-- Limits: session_id is per tab, so a buyer who landed in one tab and paid in
-- another shows the checkout tab's first page, not the true landing. An order
-- with no stored session_id (storage blocked) cannot be matched.
--
-- Output: order id, created_at, and the earliest page view's landing path,
-- ref and referrer_host. No buyer PII (no email, name, customer id).

with unattributed as (
  select
    o.id,
    o.created_at,
    nullif(o.attribution->>'session_id', '') as session_id
  from public.book_orders o
  where coalesce(
          nullif(o.attribution->>'source', ''),
          nullif(o.attribution->>'medium', ''),
          nullif(o.attribution->>'campaign', ''),
          nullif(o.attribution->>'content', ''),
          nullif(o.attribution->>'term', ''),
          nullif(o.attribution->>'click_id', ''),
          nullif(o.attribution->>'landing_path', ''),
          nullif(o.attribution->>'referrer_host', ''),
          nullif(o.attribution->>'entry', '')
        ) is null
),
earliest_view as (
  select distinct on (u.id)
    u.id as order_id,
    pv.started_at,
    pv.path,
    pv.ref,
    pv.referrer_host
  from unattributed u
  join public.page_views pv
    on pv.session_id = u.session_id
   and pv.started_at <= u.created_at
  order by u.id, pv.started_at asc
)
select
  u.id                 as order_id,
  u.created_at,
  ev.started_at        as landing_at,
  ev.path              as landing_path,
  ev.ref,
  ev.referrer_host
from unattributed u
left join earliest_view ev on ev.order_id = u.id
order by u.created_at desc;

-- Optional visitor-level variant (catches earlier tabs and earlier days).
-- Needs pgcrypto (Supabase: extensions.hmac) and the VISITOR_HASH_SALT value
-- typed into your SQL session only. Never commit the salt. If the env var is
-- unset in production the code falls back to
-- 'realryannichols-default-rotate-salt'.
--
-- with unattributed as ( ...same CTE as above, plus:
--   nullif(o.attribution->>'visitor_id', '') as visitor_id ... )
-- select distinct on (u.id)
--   u.id as order_id, u.created_at, pv.started_at as landing_at,
--   pv.path as landing_path, pv.ref, pv.referrer_host
-- from unattributed u
-- join public.page_views pv
--   on pv.visitor_hash = left(encode(extensions.hmac(
--        convert_to(u.visitor_id, 'UTF8'),
--        convert_to('<VISITOR_HASH_SALT>' || ':visitor', 'UTF8'),
--        'sha256'), 'hex'), 32)
--  and pv.started_at <= u.created_at
-- order by u.id, pv.started_at asc;
