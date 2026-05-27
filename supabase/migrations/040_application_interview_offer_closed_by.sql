-- Track who closed a pending interview offer (for notifications).

alter table public.applications
  add column if not exists interview_offer_closed_by text;

alter table public.applications
  drop constraint if exists applications_interview_offer_closed_by_check;

alter table public.applications
  add constraint applications_interview_offer_closed_by_check
  check (
    interview_offer_closed_by is null
    or interview_offer_closed_by in ('clinic', 'worker')
  );
