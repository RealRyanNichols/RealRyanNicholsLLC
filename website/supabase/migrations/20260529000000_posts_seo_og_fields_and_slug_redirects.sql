-- Post Media & SEO Editor: per-post share/OG image + SEO meta overrides, and a
-- slug-redirect table so renaming a published post's slug 301s the old path.
-- Forward-only; no existing rows are modified. New columns are nullable so all
-- existing reads keep working.

-- 1) Per-post overrides on the posts table.
--    og_image_url    — custom social/share card image for ANY post type; when set
--                      it wins over the type-based fallback in generateMetadata().
--    seo_title       — meta/OG title override (else the post title / derived).
--    seo_description — meta/OG description override (else the auto excerpt).
--    thumbnail_url already exists and is reused as the feed/share thumbnail.
alter table public.posts
  add column if not exists og_image_url text,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

-- 2) Old-slug -> new-slug redirect map. The public post route resolves a 404
--    slug against this table and issues a permanent redirect to the current
--    slug, preserving SEO equity after a rename.
create table if not exists public.slug_redirects (
  old_slug text primary key,
  new_slug text not null,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists slug_redirects_post_id_idx on public.slug_redirects (post_id);

alter table public.slug_redirects enable row level security;

-- Public read: the [slug] route resolves redirects with the anon/static client.
drop policy if exists "slug_redirects_public_read" on public.slug_redirects;
create policy "slug_redirects_public_read" on public.slug_redirects
  for select using (true);

-- Admin write (insert/update/delete), matching posts_admin_* policies.
drop policy if exists "slug_redirects_admin_insert" on public.slug_redirects;
create policy "slug_redirects_admin_insert" on public.slug_redirects
  for insert with check (is_admin(auth.uid()));

drop policy if exists "slug_redirects_admin_update" on public.slug_redirects;
create policy "slug_redirects_admin_update" on public.slug_redirects
  for update using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

drop policy if exists "slug_redirects_admin_delete" on public.slug_redirects;
create policy "slug_redirects_admin_delete" on public.slug_redirects
  for delete using (is_admin(auth.uid()));
