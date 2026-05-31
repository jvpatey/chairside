-- Shared push notification preferences by category (candidates and clinics).

create table if not exists public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (
    category in ('messages', 'applications_interviews', 'job_alerts', 'fill_in_alerts')
  ),
  push_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

comment on table public.notification_preferences is
  'Per-user push notification category preferences. Missing rows default to push enabled.';
comment on column public.notification_preferences.category is
  'messages | applications_interviews | job_alerts | fill_in_alerts';
comment on column public.notification_preferences.push_enabled is
  'When false, in-app notifications still send but mobile push is suppressed.';

alter table public.notification_preferences enable row level security;

create policy "Users read own notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users insert own notification preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users update own notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own notification preferences"
  on public.notification_preferences for delete
  using (auth.uid() = user_id);

create index if not exists notification_preferences_user_id_idx
  on public.notification_preferences (user_id);
