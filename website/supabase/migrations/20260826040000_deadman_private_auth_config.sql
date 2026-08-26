-- Private fallback configuration for deployments where environment-variable
-- management is unavailable. Only salted hashes are stored; plaintext codes
-- are delivered once to their intended recipients and never persisted here.

create table if not exists public.deadman_auth_config (
  id text primary key check (id = 'primary'),
  secret_salt text not null check (char_length(secret_salt) >= 16),
  activators jsonb not null check (
    jsonb_typeof(activators) = 'array' and jsonb_array_length(activators) > 0
  ),
  reversal_hash text not null check (reversal_hash ~ '^[a-f0-9]{64}$'),
  updated_at timestamptz not null default now()
);

alter table public.deadman_auth_config enable row level security;

revoke all on table public.deadman_auth_config from public;
revoke all on table public.deadman_auth_config from anon;
revoke all on table public.deadman_auth_config from authenticated;
grant all on table public.deadman_auth_config to service_role;

comment on table public.deadman_auth_config is
  'Service-role-only salted activation hashes and owner stand-down hash. Never stores plaintext codes.';
