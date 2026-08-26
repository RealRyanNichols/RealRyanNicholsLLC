create index if not exists deadman_social_dispatches_incident_idx
  on public.deadman_social_dispatches (incident_id);

create index if not exists deadman_social_dispatches_post_idx
  on public.deadman_social_dispatches (post_id);
