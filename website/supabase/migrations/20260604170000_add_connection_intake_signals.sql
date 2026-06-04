alter table public.intake_verifications
  drop constraint if exists intake_verifications_action_check;

alter table public.intake_verifications
  add constraint intake_verifications_action_check
  check (action in ('verify', 'connection', 'dispute', 'context'));

drop policy if exists intake_verifications_public_insert on public.intake_verifications;
create policy intake_verifications_public_insert
on public.intake_verifications
for insert
to anon, authenticated
with check (
  action in ('verify', 'connection', 'dispute', 'context')
  and (note is null or char_length(note) <= 2000)
  and (display_name is null or char_length(display_name) <= 120)
  and (email is null or char_length(email) <= 254)
);
