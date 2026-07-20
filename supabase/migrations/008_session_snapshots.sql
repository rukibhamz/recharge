-- Rich snapshots for share links and saved history (personalised copy, not generic type bank only)

alter table public.sessions
  add column if not exists burnout_summary text,
  add column if not exists personality_snapshot jsonb;

comment on column public.sessions.burnout_summary is 'Personalised burnout narrative from assessment';
comment on column public.sessions.personality_snapshot is 'Full personality result JSON (type, traits, summary)';
