alter table public.posts
  add column if not exists byline_override text;

comment on column public.posts.byline_override is
  'Optional per-post public byline and structured-data author name. Null falls back to the site author.';
