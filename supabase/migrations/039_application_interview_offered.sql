-- Interview offers require worker acceptance before interview_scheduled.

alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  add constraint applications_status_check
  check (status in (
    'applied',
    'reviewed',
    'in_progress',
    'interview_offered',
    'interview_scheduled',
    'selected',
    'rejected',
    'hired'
  ));

create policy "Workers respond to interview offers"
  on public.applications for update
  using (
    auth.uid() = worker_id
    and status = 'interview_offered'
  )
  with check (
    auth.uid() = worker_id
    and status in ('interview_scheduled', 'in_progress')
  );
