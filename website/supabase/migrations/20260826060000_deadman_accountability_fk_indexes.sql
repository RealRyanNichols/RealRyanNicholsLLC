-- Cover the nullable foreign keys added by accountability mode so incident
-- deletion, correction chains, and related joins do not require table scans.

create index if not exists deadman_research_leads_incident_idx
  on public.deadman_research_leads (incident_id)
  where incident_id is not null;

create index if not exists deadman_updates_supersedes_idx
  on public.deadman_updates (supersedes_update_id)
  where supersedes_update_id is not null;
