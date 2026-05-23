-- Expand role_type options on job and shift posts
alter table public.job_posts
  drop constraint job_posts_role_type_check;

alter table public.job_posts
  add constraint job_posts_role_type_check
  check (
    role_type in (
      'hygienist',
      'assistant',
      'admin',
      'office_manager',
      'treatment_coordinator',
      'dentist',
      'other'
    )
  );

alter table public.shift_posts
  drop constraint shift_posts_role_type_check;

alter table public.shift_posts
  add constraint shift_posts_role_type_check
  check (
    role_type in (
      'hygienist',
      'assistant',
      'admin',
      'office_manager',
      'treatment_coordinator',
      'dentist',
      'other'
    )
  );
