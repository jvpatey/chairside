-- Worker notification preferences: phone, SMS opt-in, job alerts opt-in, dispatch idempotency

alter table public.worker_profiles
  add column if not exists phone text,
  add column if not exists fill_in_sms_opt_in boolean not null default false,
  add column if not exists job_notification_opt_in boolean not null default false;

comment on column public.worker_profiles.phone is 'E.164 or NANP digits for optional fill-in SMS alerts';
comment on column public.worker_profiles.fill_in_sms_opt_in is 'Explicit opt-in for SMS fill-in alerts (CASL)';
comment on column public.worker_profiles.job_notification_opt_in is 'Opt-in for new job posts matching worker role_type';

create table if not exists public.notification_dispatch_log (
  idempotency_key text primary key,
  created_at timestamptz not null default now()
);

alter table public.notification_dispatch_log enable row level security;

-- Only service role / edge functions use this table (no client policies)

create index if not exists notification_dispatch_log_created_at_idx
  on public.notification_dispatch_log (created_at);
