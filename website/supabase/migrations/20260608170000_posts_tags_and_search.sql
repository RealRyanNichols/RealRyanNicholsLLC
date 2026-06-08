-- Posts: tags + keyword search.
--
-- Articles, notes, photos, and videos all live in the `posts` table, so one
-- search covers everything. This migration:
--   1. adds a `tags text[]` column (with a GIN index for tag filtering), and
--   2. creates a SECURITY DEFINER `search_posts(q, max_results)` RPC that ranks
--      PUBLISHED posts by full-text relevance with an ILIKE fallback for
--      partial words. It only ever returns published rows and pins its
--      search_path, so it is safe to grant to anonymous visitors.

alter table public.posts
  add column if not exists tags text[] not null default '{}';

create index if not exists posts_tags_gin
  on public.posts using gin (tags);

-- No precomputed FTS index: the post table is small, so search_posts builds the
-- tsvector per row at query time (a Postgres expression index here would require
-- an IMMUTABLE wrapper and buys nothing at this scale). Revisit if posts grow
-- into the thousands.

drop function if exists public.search_posts(text, integer);

create function public.search_posts(q text, max_results integer default 30)
returns table (
  slug text,
  type text,
  title text,
  category text,
  tags text[],
  excerpt text,
  thumbnail_url text,
  mux_playback_id text,
  published_at timestamptz,
  rank real
)
language sql
stable
security definer
set search_path = public
as $$
  with needle as (
    select
      nullif(btrim(q), '') as raw,
      websearch_to_tsquery('english', coalesce(q, '')) as tsq
  ),
  doc as (
    select
      p.slug,
      p.type,
      p.title,
      p.category,
      p.tags,
      p.seo_description,
      p.body,
      p.thumbnail_url,
      p.mux_playback_id,
      p.published_at,
      to_tsvector(
        'english',
        coalesce(p.title, '') || ' ' ||
        coalesce(p.category, '') || ' ' ||
        array_to_string(p.tags, ' ') || ' ' ||
        coalesce(p.seo_description, '') || ' ' ||
        coalesce(p.body, '')
      ) as tsv
    from public.posts p
    where p.status = 'published'
  )
  select
    doc.slug,
    doc.type,
    doc.title,
    doc.category,
    doc.tags,
    left(
      btrim(
        regexp_replace(
          regexp_replace(coalesce(doc.seo_description, doc.body, ''), '\{\{[^}]*\}\}', ' ', 'g'),
          '\s+', ' ', 'g'
        )
      ),
      240
    ) as excerpt,
    doc.thumbnail_url,
    doc.mux_playback_id,
    doc.published_at,
    ts_rank(doc.tsv, (select tsq from needle)) as rank
  from doc, needle
  where
    (needle.tsq @@ doc.tsv)
    or (
      needle.raw is not null and (
        doc.title ilike '%' || needle.raw || '%'
        or doc.category ilike '%' || needle.raw || '%'
        or array_to_string(doc.tags, ' ') ilike '%' || needle.raw || '%'
        or doc.body ilike '%' || needle.raw || '%'
      )
    )
  order by rank desc nulls last, doc.published_at desc nulls last
  limit greatest(1, least(coalesce(max_results, 30), 100));
$$;

grant execute on function public.search_posts(text, integer) to anon, authenticated;
