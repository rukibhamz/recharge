-- Admin-managed AI / LLM connectors for assessment generation

create table if not exists public.llm_connectors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null
    check (provider in ('gemini', 'ollama', 'openai', 'anthropic', 'openrouter')),
  model text not null,
  base_url text,
  api_key text,
  enabled boolean not null default true,
  priority int not null default 100,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists llm_connectors_enabled_priority_idx
  on public.llm_connectors (enabled, priority asc, created_at asc);

alter table public.llm_connectors enable row level security;

comment on table public.llm_connectors is
  'Platform AI connectors. Accessed only via API service role; never expose api_key to clients.';
comment on column public.llm_connectors.priority is
  'Lower number = tried first when generating assessment content.';
comment on column public.llm_connectors.base_url is
  'Optional override (Ollama host, OpenAI-compatible base, OpenRouter).';
