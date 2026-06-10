-- Question bank: fallback when Gemini is unavailable (API reads via service role)

create table if not exists public.question_bank (
  id text primary key,
  phase text not null check (phase in ('personality', 'burnout')),
  text text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  trait text,
  type_selector boolean not null default false,
  scale text not null default 'agreement' check (scale in ('agreement', 'frequency', 'choice')),
  options jsonb,
  dimension text,
  reverse_scored boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists question_bank_phase_active_idx
  on public.question_bank (phase, active, sort_order);

alter table public.question_bank enable row level security;

-- Personality (12)
insert into public.question_bank (id, phase, text, sort_order, trait, type_selector, scale, options) values
  ('p01', 'personality', 'I prefer to plan my week in advance rather than decide day by day.', 1, 'planful_spontaneous', false, 'agreement', null),
  ('p02', 'personality', 'After a long day with others, I need quiet time alone to recharge.', 2, 'introversion_extraversion', false, 'agreement', null),
  ('p03', 'personality', 'I feel most alive when I''m trying something completely new.', 3, null, false, 'agreement', null),
  ('p04', 'personality', 'I make important decisions quickly, trusting my instincts.', 4, 'planful_spontaneous', false, 'agreement', null),
  ('p05', 'personality', 'I bounce back quickly when things don''t go as planned.', 5, 'resilience', false, 'agreement', null),
  ('p06', 'personality', 'I prefer collaborating with others over working independently.', 6, null, false, 'agreement', null),
  ('p07', 'personality', 'I feel uneasy when my routine is disrupted unexpectedly.', 7, null, false, 'agreement', null),
  ('p08', 'personality', 'Under pressure, I tend to withdraw rather than reach out.', 8, 'stress_response', false, 'agreement', null),
  ('p09', 'personality', 'I gain energy from being around people and social settings.', 9, 'introversion_extraversion', false, 'agreement', null),
  ('p10', 'personality', 'When stressed, I become irritable or short with people close to me.', 10, 'stress_response', false, 'agreement', null),
  ('p11', 'personality', 'What motivates me most right now is…', 11, null, true, 'choice', '[
    {"value":0,"label":"Hitting goals and seeing measurable results"},
    {"value":1,"label":"Creating something original or expressive"},
    {"value":2,"label":"Deep connection with people I care about"},
    {"value":3,"label":"Stability, reliability, and clear structure"}
  ]'::jsonb),
  ('p12', 'personality', 'I stay calm and focused even when multiple demands compete for my attention.', 12, 'resilience', false, 'agreement', null)
on conflict (id) do nothing;

-- Burnout questions: see migration 004_burnout_question_bank.sql
