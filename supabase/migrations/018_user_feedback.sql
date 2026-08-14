-- User product feedback for admin review. Service role writes via API.

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  email text,
  category text not null
    check (category in ('questions', 'advice', 'coach', 'results', 'idea', 'other')),
  rating int check (rating is null or (rating >= 1 and rating <= 5)),
  message text not null,
  page text not null default '',
  status text not null default 'new'
    check (status in ('new', 'read', 'archived')),
  admin_note text not null default ''
);

create index if not exists user_feedback_status_created_idx
  on public.user_feedback (status, created_at desc);

alter table public.user_feedback enable row level security;

comment on table public.user_feedback is
  'Product improvement suggestions submitted by users. Admin APIs via service role only.';
