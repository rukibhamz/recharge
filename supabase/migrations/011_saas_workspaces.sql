-- White-label SaaS workspaces (extends existing teams table)

alter table public.teams
  add column if not exists brand_name text,
  add column if not exists custom_domain text,
  add column if not exists primary_color text default '#003441',
  add column if not exists content jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'draft',
  add column if not exists contact_email text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'teams_status_check'
      and conrelid = 'public.teams'::regclass
  ) then
    alter table public.teams
      add constraint teams_status_check
      check (status in ('draft', 'active', 'suspended'));
  end if;
end $$;

create unique index if not exists teams_custom_domain_uidx
  on public.teams (lower(custom_domain))
  where custom_domain is not null and custom_domain <> '';

comment on column public.teams.custom_domain is 'Business custom hostname (e.g. wellbeing.acme.com). Must also be attached on the web host (Vercel).';
comment on column public.teams.content is 'Editable landing copy: badge, headlines, supporting text, CTA, footer.';
comment on column public.teams.status is 'draft = not served on custom domain; active = public white-label; suspended = blocked';

update public.teams
set brand_name = name
where brand_name is null or brand_name = '';
