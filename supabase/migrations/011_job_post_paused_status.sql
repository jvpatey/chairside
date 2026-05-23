update public.job_posts
set status = 'live'
where status = 'draft';

alter table public.job_posts
  drop constraint job_posts_status_check;

alter table public.job_posts
  alter column status set default 'live';

alter table public.job_posts
  add constraint job_posts_status_check
  check (status in ('live', 'paused', 'filled', 'closed'));

create policy "Clinics delete own job posts"
  on public.job_posts for delete using (auth.uid() = clinic_id);
