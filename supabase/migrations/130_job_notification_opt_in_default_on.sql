-- New job post alerts (push/in-app) are on by default for candidates.
alter table public.worker_profiles
  alter column job_notification_opt_in set default true;

-- Workers still in setup have never seen this setting, so turn it on for them.
-- Finished workers keep whatever they chose.
update public.worker_profiles
set job_notification_opt_in = true
where setup_completed_at is null
  and job_notification_opt_in = false;

comment on column public.worker_profiles.job_notification_opt_in is
  'Opt-in for new job posts matching worker role types (default on)';
