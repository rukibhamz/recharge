-- LLM usage + availability monitoring (per connector / model)

create table if not exists public.llm_usage_logs (
  id uuid primary key default gen_random_uuid(),
  connector_id text,
  connector_name text,
  provider text not null,
  model text not null,
  success boolean not null,
  latency_ms int,
  error text,
  source text not null default 'assessment'
    check (source in ('assessment', 'probe', 'test')),
  created_at timestamptz not null default now()
);

create index if not exists llm_usage_logs_created_at_idx
  on public.llm_usage_logs (created_at desc);

create index if not exists llm_usage_logs_connector_created_idx
  on public.llm_usage_logs (connector_id, created_at desc);

alter table public.llm_usage_logs enable row level security;

comment on table public.llm_usage_logs is
  'Per-call LLM outcomes for admin usage and uptime monitoring. Service role only.';
