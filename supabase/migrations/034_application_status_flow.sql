-- Expand application status flow: in_progress + selected for roles; hired retained for fill-in confirmed.

update public.applications
set status = 'in_progress'
where status = 'shortlisted';

update public.applications
set status = 'selected'
where status = 'hired'
  and job_post_id is not null;

alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  add constraint applications_status_check
  check (status in ('applied', 'reviewed', 'in_progress', 'selected', 'rejected', 'hired'));
