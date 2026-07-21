-- Fix Supabase Advisor: Security Definer View
-- Also ensure response_scale exists (009 may not have been applied fully).

alter table public.burnout_questions
  add column if not exists response_scale text not null default 'agreement';

-- Add check only if missing (IF NOT EXISTS for constraints needs a DO block)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'burnout_questions_response_scale_check'
      and conrelid = 'public.burnout_questions'::regclass
  ) then
    alter table public.burnout_questions
      add constraint burnout_questions_response_scale_check
      check (response_scale in ('agreement', 'frequency'));
  end if;
end $$;

update public.burnout_questions
set response_scale = 'agreement'
where response_scale is null or response_scale not in ('agreement', 'frequency');

create or replace view public.burnout_questions_full
with (security_invoker = true)
as
  select
    q.id,
    q.question_number,
    q.question_text,
    d.id as dimension_id,
    d.name as dimension,
    d.description as dimension_description,
    d.color_light,
    d.color_dark,
    q.response_scale
  from public.burnout_questions q
  join public.burnout_dimensions d on d.id = q.dimension_id
  order by q.question_number;

create or replace view public.personality_questions_full
with (security_invoker = true)
as
  select
    q.id,
    q.question_number,
    q.question_text,
    q.scored_pole,
    d.code as dichotomy,
    d.pole_a,
    d.pole_b,
    d.label_a,
    d.label_b
  from public.personality_questions q
  join public.personality_dichotomies d on d.id = q.dichotomy_id
  order by q.question_number;
