alter table public.case_tips
  add column if not exists route_kind text,
  add column if not exists route_urgency text,
  add column if not exists route_score integer,
  add column if not exists route_label text,
  add column if not exists route_reason text,
  add column if not exists outcome_status text not null default 'unworked',
  add column if not exists outcome_url text,
  add column if not exists outcome_at timestamptz,
  add column if not exists outcome_notes text;

alter table public.case_tips
  drop constraint if exists case_tips_route_kind_check;

alter table public.case_tips
  add constraint case_tips_route_kind_check
  check (
    route_kind is null
    or route_kind in ('case_map', 'verify', 'article', 'service', 'watch')
  );

alter table public.case_tips
  drop constraint if exists case_tips_route_urgency_check;

alter table public.case_tips
  add constraint case_tips_route_urgency_check
  check (
    route_urgency is null
    or route_urgency in ('hot', 'next', 'watch')
  );

alter table public.case_tips
  drop constraint if exists case_tips_route_score_check;

alter table public.case_tips
  add constraint case_tips_route_score_check
  check (
    route_score is null
    or (route_score >= 0 and route_score <= 100)
  );

alter table public.case_tips
  drop constraint if exists case_tips_outcome_status_check;

alter table public.case_tips
  add constraint case_tips_outcome_status_check
  check (
    outcome_status in (
      'unworked',
      'article_draft',
      'article_published',
      'solution_brief',
      'case_mapped',
      'evidence_verified',
      'private_reply',
      'service_lead',
      'invoice_sent',
      'watch_file',
      'closed'
    )
  );

create index if not exists case_tips_route_kind_idx
  on public.case_tips (route_kind, created_at desc);

create index if not exists case_tips_outcome_status_idx
  on public.case_tips (outcome_status, created_at desc);
