-- Allow free-text answers on custom screening questions.

alter table public.screening_question_catalog
  drop constraint if exists screening_question_catalog_question_type_check;

alter table public.screening_question_catalog
  add constraint screening_question_catalog_question_type_check
  check (question_type in ('yes_no', 'rating_1_5', 'number', 'text'));

alter table public.job_post_screening_questions
  drop constraint if exists job_post_screening_questions_question_type_check;

alter table public.job_post_screening_questions
  add constraint job_post_screening_questions_question_type_check
  check (question_type in ('yes_no', 'rating_1_5', 'number', 'text'));
