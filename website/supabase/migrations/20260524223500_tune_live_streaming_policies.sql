create index if not exists live_streams_created_by_idx
  on public.live_streams (created_by);

drop policy if exists live_streams_public_read on public.live_streams;
drop policy if exists live_streams_admin_all on public.live_streams;

create policy live_streams_public_read
on public.live_streams
for select
to anon
using (status in ('scheduled', 'live', 'ended'));

create policy live_streams_authenticated_read
on public.live_streams
for select
to authenticated
using (
  status in ('scheduled', 'live', 'ended')
  or public.is_admin((select auth.uid()))
);

create policy live_streams_admin_insert
on public.live_streams
for insert
to authenticated
with check (public.is_admin((select auth.uid())));

create policy live_streams_admin_update
on public.live_streams
for update
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));

create policy live_streams_admin_delete
on public.live_streams
for delete
to authenticated
using (public.is_admin((select auth.uid())));
