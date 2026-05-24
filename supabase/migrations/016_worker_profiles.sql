create table public.worker_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role_type text check (
    role_type is null or role_type in (
      'hygienist',
      'assistant',
      'admin',
      'office_manager',
      'treatment_coordinator',
      'dentist',
      'other'
    )
  ),
  license_type text,
  years_of_experience int,
  education text,
  software_used text[] not null default '{}',
  practice_types text[] not null default '{}',
  preferred_employment_types text[] not null default '{}',
  address_line1 text,
  address_line2 text,
  city text,
  province text not null default 'NS',
  postal_code text,
  latitude double precision,
  longitude double precision,
  travel_radius_km int,
  bio text,
  short_notice_available boolean not null default false,
  fill_in_notification_mode text not null default 'off'
    check (fill_in_notification_mode in ('off', 'all', 'available_days_only')),
  expo_push_token text,
  setup_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.worker_profiles enable row level security;

create policy "Workers read own worker profile"
  on public.worker_profiles for select
  using (auth.uid() = id);

create policy "Workers insert own worker profile"
  on public.worker_profiles for insert
  with check (
    auth.uid() = id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'worker'
    )
  );

create policy "Workers update own worker profile"
  on public.worker_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Clinics read worker profiles for applicants"
  on public.worker_profiles for select
  using (
    exists (
      select 1 from public.applications a
      where a.worker_id = worker_profiles.id
        and (
          (
            a.job_post_id is not null
            and exists (
              select 1 from public.job_posts jp
              where jp.id = a.job_post_id and jp.clinic_id = auth.uid()
            )
          )
          or (
            a.shift_post_id is not null
            and exists (
              select 1 from public.shift_posts sp
              where sp.id = a.shift_post_id and sp.clinic_id = auth.uid()
            )
          )
        )
    )
  );

create or replace function public.ensure_worker_role_on_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.id and role = 'worker'
  ) then
    raise exception 'Worker profile requires worker role';
  end if;
  return new;
end;
$$;

create trigger worker_profiles_require_worker_role
  before insert on public.worker_profiles
  for each row execute function public.ensure_worker_role_on_profile();
