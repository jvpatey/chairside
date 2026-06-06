-- Update qualifications screening questions and support numeric answers for existing deployments.

alter table public.screening_question_catalog
  drop constraint if exists screening_question_catalog_question_type_check;

alter table public.screening_question_catalog
  add constraint screening_question_catalog_question_type_check
  check (question_type in ('yes_no', 'rating_1_5', 'number'));

alter table public.job_post_screening_questions
  drop constraint if exists job_post_screening_questions_question_type_check;

alter table public.job_post_screening_questions
  add constraint job_post_screening_questions_question_type_check
  check (question_type in ('yes_no', 'rating_1_5', 'number'));

update public.screening_question_catalog
set active = false
where slug in (
  'experience_1_plus',
  'experience_3_plus',
  'available_start_2_weeks'
);

delete from public.job_post_screening_questions
where catalog_slug = 'experience_3_plus';

update public.job_post_screening_questions
set
  catalog_slug = 'years_experience_in_role',
  question_type = 'number'
where catalog_slug = 'experience_1_plus';

update public.job_post_screening_questions
set
  catalog_slug = 'weeks_notice_to_start',
  question_type = 'number'
where catalog_slug = 'available_start_2_weeks';

insert into public.screening_question_catalog (slug, question_type, prompt, category, sort_order, reverse_scored)
values
  (
    'years_experience_in_role',
    'number',
    'How many years of experience do you have in this role?',
    'qualifications',
    130,
    false
  ),
  (
    'provincial_certification_training',
    'yes_no',
    'Do you have the proper certification or training required for this role in {{province}}?',
    'qualifications',
    140,
    false
  ),
  (
    'weeks_notice_to_start',
    'number',
    'If hired, how many weeks of notice do you need before you can start?',
    'qualifications',
    160,
    false
  )
on conflict (slug) do update
set
  question_type = excluded.question_type,
  prompt = excluded.prompt,
  category = excluded.category,
  sort_order = excluded.sort_order,
  reverse_scored = excluded.reverse_scored,
  active = true;
