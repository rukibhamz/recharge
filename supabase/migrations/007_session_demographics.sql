-- Optional demographic profile per session (used for LLM personalization; not on public share links)

alter table public.sessions
  add column if not exists demographics jsonb;
