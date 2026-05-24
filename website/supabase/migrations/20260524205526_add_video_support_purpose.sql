alter table public.support_intents
drop constraint if exists support_intents_purpose_check;

alter table public.support_intents
add constraint support_intents_purpose_check
check (purpose in ('site', 'video', 'children', 'officials', 'community', 'needed'));

drop policy if exists "Visitors can create support intents" on public.support_intents;

create policy "Visitors can create support intents"
on public.support_intents
for insert
to anon, authenticated
with check (
  status = 'started'
  and purpose in ('site', 'video', 'children', 'officials', 'community', 'needed')
  and display_as in ('name', 'anonymous')
  and (intended_amount is null or char_length(intended_amount) <= 20)
  and (display_name is null or char_length(display_name) <= 120)
  and (message is null or char_length(message) <= 2000)
  and ip_hash is not null
  and char_length(ip_hash) = 64
);
