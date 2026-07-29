-- Oma coach chat: conversations + messages for logged-in users

create table if not exists public.coach_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_conversations_user_updated_idx
  on public.coach_conversations (user_id, updated_at desc);

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.coach_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists coach_messages_conversation_created_idx
  on public.coach_messages (conversation_id, created_at asc);

alter table public.coach_conversations enable row level security;
alter table public.coach_messages enable row level security;

drop policy if exists "Users read own coach conversations" on public.coach_conversations;
create policy "Users read own coach conversations"
  on public.coach_conversations for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own coach conversations" on public.coach_conversations;
create policy "Users insert own coach conversations"
  on public.coach_conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own coach conversations" on public.coach_conversations;
create policy "Users update own coach conversations"
  on public.coach_conversations for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own coach conversations" on public.coach_conversations;
create policy "Users delete own coach conversations"
  on public.coach_conversations for delete
  using (auth.uid() = user_id);

drop policy if exists "Users read own coach messages" on public.coach_messages;
create policy "Users read own coach messages"
  on public.coach_messages for select
  using (
    exists (
      select 1 from public.coach_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert own coach messages" on public.coach_messages;
create policy "Users insert own coach messages"
  on public.coach_messages for insert
  with check (
    exists (
      select 1 from public.coach_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Allow coach calls in LLM usage monitoring
alter table public.llm_usage_logs
  drop constraint if exists llm_usage_logs_source_check;

alter table public.llm_usage_logs
  add constraint llm_usage_logs_source_check
  check (source in ('assessment', 'probe', 'test', 'coach'));

comment on table public.coach_conversations is
  'Oma wellbeing coach threads. Linked to a saved assessment session when available.';
comment on table public.coach_messages is
  'Messages within an Oma coach conversation. Service role used by API.';
