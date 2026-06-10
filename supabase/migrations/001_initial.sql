-- Recharge MVP schema (run in Supabase SQL editor or via CLI)

create extension if not exists "pgcrypto";

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  share_token text unique not null,
  display_name text,
  burnout_pct int not null check (burnout_pct between 0 and 100),
  burnout_level text not null,
  burnout_cls text not null check (burnout_cls in ('healthy', 'mild', 'moderate', 'severe')),
  personality_type text not null,
  personality_name text not null,
  traits jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb
);

create index if not exists sessions_share_token_idx on public.sessions (share_token);
create index if not exists sessions_created_at_idx on public.sessions (created_at desc);

alter table public.sessions enable row level security;

-- API uses service role; no public read/write policies on sessions for MVP

-- v1.1 tables (created early, unused until Phase 2)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_sessions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  admin_user_id uuid references public.profiles (id) on delete set null,
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.team_sessions (
  team_id uuid not null references public.teams (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, session_id)
);

alter table public.profiles enable row level security;
alter table public.user_sessions enable row level security;
alter table public.teams enable row level security;
alter table public.team_sessions enable row level security;
