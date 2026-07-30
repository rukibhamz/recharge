-- Admin-managed coach settings (name + optional connector override)

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

insert into public.app_settings (key, value)
values ('coach', '{"name":"Oma","connectorId":null}'::jsonb)
on conflict (key) do nothing;

comment on table public.app_settings is
  'Key-value app configuration managed by admin APIs via service role only.';
