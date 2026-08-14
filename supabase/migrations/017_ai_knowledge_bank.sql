-- Anonymized RAG databank: patterns learned from assessments and coach chats.
-- Service role only. No names, emails, or raw identifying answers.

create table if not exists public.ai_knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  kind text not null
    check (kind in ('question_pattern', 'advice_pattern', 'coach_pattern', 'quality_rule')),
  content text not null,
  type_code text not null default '',
  burnout_cls text not null default '',
  dimension text not null default '',
  work_context text not null default '',
  quality_score real not null default 0.5
    check (quality_score >= 0 and quality_score <= 1),
  use_count int not null default 0,
  success_count int not null default 0,
  source text not null default 'assessment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_knowledge_kind_cls_idx
  on public.ai_knowledge_entries (kind, burnout_cls, type_code);

create index if not exists ai_knowledge_quality_idx
  on public.ai_knowledge_entries (quality_score desc, success_count desc);

alter table public.ai_knowledge_entries enable row level security;

comment on table public.ai_knowledge_entries is
  'Anonymized learned patterns for RAG prompts. Service role writes; never expose to clients.';

insert into public.ai_knowledge_entries
  (fingerprint, kind, content, type_code, burnout_cls, dimension, quality_score, source)
values
  (
    'seed-q-exh-01',
    'question_pattern',
    'Effective exhaustion check-in item (agreement): I feel like tasks cost me more energy than I get back, even on ordinary days.',
    '',
    'moderate',
    'exhaustion',
    0.7,
    'seed'
  ),
  (
    'seed-q-comm-01',
    'question_pattern',
    'Effective support check-in item (agreement): I feel like I am carrying too much of this on my own, without enough people to check in with.',
    '',
    'moderate',
    'community',
    0.7,
    'seed'
  ),
  (
    'seed-adv-infj-01',
    'advice_pattern',
    'For moderate burnout and INFJ: Shrink the list. Reduce what is on your plate where you actually can: say no, delegate, or postpone non-essential things. Then put rest on the calendar so it is not leftover time.',
    'INFJ',
    'moderate',
    '',
    0.75,
    'seed'
  ),
  (
    'seed-adv-quiet-01',
    'advice_pattern',
    'For introverted profiles: Quiet rest first. Schedule a low-stimulation block (walk, closed door, no chat apps) instead of a social event billed as recovery.',
    '',
    'moderate',
    '',
    0.72,
    'seed'
  ),
  (
    'seed-coach-01',
    'coach_pattern',
    'Coach reply that landed: Stay with what they named. Mirror the load in one sentence, then offer one tiny next step for the next hour, not a weekly overhaul.',
    '',
    '',
    '',
    0.74,
    'seed'
  ),
  (
    'seed-quality-01',
    'quality_rule',
    'Clear burnout explanation: Name the score and level, say it is a warning not an emergency when moderate, name the two hardest areas in plain words, then give two concrete moves for this week. No em dashes. No KPI language.',
    '',
    'moderate',
    '',
    0.8,
    'seed'
  )
on conflict (fingerprint) do nothing;
