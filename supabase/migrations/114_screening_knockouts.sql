-- Knockout / must-pass rules on job screening questions + stored screening outcomes.

alter table public.job_post_screening_questions
  add column if not exists knockout_enabled boolean not null default false,
  add column if not exists knockout_expected_bool boolean,
  add column if not exists knockout_min double precision,
  add column if not exists knockout_max double precision;

alter table public.application_screening_answers
  add column if not exists outcome text,
  add column if not exists failed_question_ids text[] not null default '{}';

alter table public.application_screening_answers
  drop constraint if exists application_screening_answers_outcome_check;

alter table public.application_screening_answers
  add constraint application_screening_answers_outcome_check
  check (outcome is null or outcome in ('pass', 'flagged', 'incomplete'));
