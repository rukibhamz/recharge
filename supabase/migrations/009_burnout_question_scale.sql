-- Per-question response scale for burnout bank (agreement vs frequency)
-- Note: append response_scale at end of view — CREATE OR REPLACE cannot rename/reorder columns.

alter table public.burnout_questions
  add column if not exists response_scale text not null default 'agreement'
    check (response_scale in ('agreement', 'frequency'));

comment on column public.burnout_questions.response_scale is
  'agreement = I-statement Likert (strongly disagree…strongly agree); frequency = how-often (never…always)';

-- Existing bank copy is statement-style ("I …")
update public.burnout_questions
set response_scale = 'agreement'
where response_scale is null or response_scale = 'agreement';

create or replace view public.burnout_questions_full as
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
