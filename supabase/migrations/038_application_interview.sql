-- Interview scheduling stage for role applications.

alter table public.applications
  add column if not exists interview_at timestamptz,
  add column if not exists interview_duration_minutes integer,
  add column if not exists interview_details text;

alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  add constraint applications_status_check
  check (status in (
    'applied',
    'reviewed',
    'in_progress',
    'interview_scheduled',
    'selected',
    'rejected',
    'hired'
  ));

alter table public.applications
  add constraint applications_interview_duration_check
  check (interview_duration_minutes is null or interview_duration_minutes > 0);
