-- Burnout question bank (6 dimensions × 10 questions, 5-point scale)
-- Source: burnout_question_bank.sql

create table if not exists public.burnout_dimensions (
  id serial primary key,
  name text not null unique,
  description text,
  color_light text,
  color_dark text,
  created_at timestamptz default now()
);

insert into public.burnout_dimensions (name, description, color_light, color_dark) values
  ('Exhaustion', 'Physical and emotional depletion, energy deficits, and poor recovery.', '#F5C4B3', '#D85A30'),
  ('Cynicism', 'Detachment, emotional distancing, and loss of meaning in work.', '#F4C0D1', '#D4537E'),
  ('Efficacy', 'Reduced sense of accomplishment, self-doubt, and declining confidence.', '#CECBF6', '#7F77DD'),
  ('Autonomy', 'Lack of control over workload, decisions, resources, and time.', '#9FE1CB', '#1D9E75'),
  ('Recognition', 'Perceived unfairness in reward, appreciation, and career advancement.', '#FAC775', '#BA7517'),
  ('Community', 'Isolation, conflict, lack of psychological safety, and weak workplace support networks.', '#B5D4F4', '#378ADD')
on conflict (name) do nothing;

create table if not exists public.burnout_questions (
  id serial primary key,
  dimension_id int not null references public.burnout_dimensions(id) on delete cascade,
  question_number int not null unique,
  question_text text not null,
  created_at timestamptz default now()
);

insert into public.burnout_questions (dimension_id, question_number, question_text) values
  (1, 1, 'I feel emotionally drained at the end of most workdays.'),
  (1, 2, 'I wake up tired even after a full night of sleep.'),
  (1, 3, 'I feel like I have nothing left to give by midday.'),
  (1, 4, 'Small tasks feel overwhelming because I have no energy.'),
  (1, 5, 'I experience physical symptoms of fatigue (headaches, muscle tension) that I link to work stress.'),
  (1, 6, 'I find it hard to concentrate for extended periods.'),
  (1, 7, 'I feel exhausted even before I start working.'),
  (1, 8, 'Rest and weekends no longer feel restorative.'),
  (1, 9, 'I have been getting sick more often than usual lately.'),
  (1, 10, 'By the time I finish work, I have no energy for personal relationships.'),
  (2, 11, 'I feel detached or emotionally distant from my work.'),
  (2, 12, 'I have become more cynical about whether my work actually matters.'),
  (2, 13, 'I doubt the sincerity or motives of the people I work with.'),
  (2, 14, 'I find myself going through the motions without real engagement.'),
  (2, 15, 'I have lost the enthusiasm I once had for my career.'),
  (2, 16, 'I feel irritable or resentful toward colleagues or clients.'),
  (2, 17, 'I find it hard to care about the quality of my output.'),
  (2, 18, 'I have started treating people at work as problems rather than people.'),
  (2, 19, 'I make sarcastic or negative comments about work more often than before.'),
  (2, 20, 'I have mentally checked out of meetings, conversations, or projects.'),
  (3, 21, 'I no longer feel proud of the work I produce.'),
  (3, 22, 'I doubt whether I am actually good at my job.'),
  (3, 23, 'I feel like I am not achieving anything meaningful at work.'),
  (3, 24, 'I find it harder to make decisions than I used to.'),
  (3, 25, 'I feel ineffective even when I am working hard.'),
  (3, 26, 'My productivity has noticeably declined over the past few months.'),
  (3, 27, 'I feel like I am falling behind despite putting in the hours.'),
  (3, 28, 'I have lost confidence in skills I was once sure about.'),
  (3, 29, 'I avoid challenging tasks because I fear I will fail.'),
  (3, 30, 'Praise or positive feedback no longer feels real or motivating.'),
  (4, 31, 'I feel like I have no control over my workload or schedule.'),
  (4, 32, 'I am rarely consulted on decisions that directly affect my work.'),
  (4, 33, 'I feel micromanaged or distrusted by leadership.'),
  (4, 34, 'My priorities are constantly overridden by others.'),
  (4, 35, 'I feel trapped in my role with no clear exit or growth path.'),
  (4, 36, 'I do not have the resources I need to do my job well.'),
  (4, 37, 'Bureaucracy or red tape prevents me from doing meaningful work.'),
  (4, 38, 'I feel like my time is not my own at work.'),
  (4, 39, 'I am rarely able to complete a task without interruption.'),
  (4, 40, 'Deadlines are set for me without my input and feel unrealistic.'),
  (5, 41, 'My contributions at work go unnoticed or unappreciated.'),
  (5, 42, 'I am not compensated fairly for the effort I put in.'),
  (5, 43, 'I feel invisible compared to colleagues who receive more credit.'),
  (5, 44, 'Positive feedback from my manager is rare or feels performative.'),
  (5, 45, 'I feel undervalued even when I go above and beyond.'),
  (5, 46, 'My professional growth is not supported or invested in.'),
  (5, 47, 'I have not received meaningful career advancement in a long time.'),
  (5, 48, 'I feel like my hard work simply results in more work.'),
  (5, 49, 'I compare my recognition to peers and feel it is unfair.'),
  (5, 50, 'I have stopped volunteering for opportunities because I expect no reward.'),
  (6, 51, 'I feel isolated or lonely at work even when surrounded by colleagues.'),
  (6, 52, 'There is significant interpersonal conflict in my workplace.'),
  (6, 53, 'I do not trust my colleagues or feel trusted by them.'),
  (6, 54, 'I feel excluded from important conversations or social groups at work.'),
  (6, 55, 'I lack a mentor or sponsor who genuinely supports my career.'),
  (6, 56, 'I feel uncomfortable raising concerns with my manager.'),
  (6, 57, 'The culture at work feels toxic, political, or unsafe.'),
  (6, 58, 'I feel pressure to hide how I am really doing at work.'),
  (6, 59, 'I have no close allies or friends at my workplace.'),
  (6, 60, 'My workplace relationships drain me rather than energise me.')
on conflict (question_number) do nothing;

create table if not exists public.burnout_options (
  id serial primary key,
  value int not null unique,
  label text not null,
  created_at timestamptz default now()
);

insert into public.burnout_options (value, label) values
  (0, 'Never'),
  (1, 'Rarely'),
  (2, 'Sometimes'),
  (3, 'Often'),
  (4, 'Always')
on conflict (value) do nothing;

create or replace view public.burnout_questions_full as
  select
    q.id,
    q.question_number,
    q.question_text,
    d.id as dimension_id,
    d.name as dimension,
    d.description as dimension_description,
    d.color_light,
    d.color_dark
  from public.burnout_questions q
  join public.burnout_dimensions d on d.id = q.dimension_id
  order by q.question_number;

alter table public.burnout_dimensions enable row level security;
alter table public.burnout_questions enable row level security;
alter table public.burnout_options enable row level security;
