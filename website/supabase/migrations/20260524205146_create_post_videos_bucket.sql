insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'post-videos',
  'post-videos',
  true,
  52428800,
  array[
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-matroska',
    'video/x-msvideo'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists post_videos_admin_write on storage.objects;
create policy post_videos_admin_write
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'post-videos'
  and is_admin((select auth.uid()))
);

drop policy if exists post_videos_admin_update on storage.objects;
create policy post_videos_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'post-videos'
  and is_admin((select auth.uid()))
)
with check (
  bucket_id = 'post-videos'
  and is_admin((select auth.uid()))
);

drop policy if exists post_videos_admin_delete on storage.objects;
create policy post_videos_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'post-videos'
  and is_admin((select auth.uid()))
);
