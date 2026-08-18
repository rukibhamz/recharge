-- Big Five (OCEAN) personality question bank — IPIP-style short form (20 items)

create table if not exists public.ocean_questions (
  id serial primary key,
  question_number int not null unique,
  question_text text not null,
  scored_trait char(1) not null check (scored_trait in ('O', 'C', 'E', 'A', 'N')),
  reverse_scored boolean not null default false,
  created_at timestamptz default now()
);

insert into public.ocean_questions (question_number, question_text, scored_trait, reverse_scored) values
  (1,  'I have a vivid imagination.', 'O', false),
  (2,  'I am not interested in abstract ideas.', 'O', true),
  (3,  'I am full of ideas.', 'O', false),
  (4,  'I have difficulty understanding abstract concepts.', 'O', true),
  (5,  'I am always prepared.', 'C', false),
  (6,  'I leave my belongings around.', 'C', true),
  (7,  'I pay attention to details.', 'C', false),
  (8,  'I make a mess of things.', 'C', true),
  (9,  'I am the life of the party.', 'E', false),
  (10, 'I do not talk a lot.', 'E', true),
  (11, 'I feel comfortable around people.', 'E', false),
  (12, 'I keep in the background.', 'E', true),
  (13, 'I sympathize with others feelings.', 'A', false),
  (14, 'I am not really interested in other peoples problems.', 'A', true),
  (15, 'I feel others emotions.', 'A', false),
  (16, 'I am not interested in other people.', 'A', true),
  (17, 'I get stressed out easily.', 'N', false),
  (18, 'I am relaxed most of the time.', 'N', true),
  (19, 'I worry about things.', 'N', false),
  (20, 'I seldom feel blue.', 'N', true)
on conflict (question_number) do nothing;

alter table public.ocean_questions enable row level security;

create policy "ocean_questions read anon"
  on public.ocean_questions for select
  to anon, authenticated
  using (true);
