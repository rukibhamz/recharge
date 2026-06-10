-- Add display name for personalized sessions (v1.1)
alter table public.sessions add column if not exists display_name text;
