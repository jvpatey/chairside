create table public.clinic_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  clinic_name text not null default '',
  contact_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  province text not null default 'NS',
  postal_code text,
  latitude double precision,
  longitude double precision,
  specialty text not null default 'general'
    check (specialty in ('general', 'ortho', 'pediatric', 'periodontics', 'endodontics', 'oral_surgery', 'other')),
  software_used text[] not null default '{}',
  operatories_count int,
  team_size int,
  website text,
  description text,
  setup_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clinic_profiles enable row level security;

create policy "Clinic owners read own clinic profile"
  on public.clinic_profiles for select
  using (auth.uid() = id);

create policy "Clinic owners insert own clinic profile"
  on public.clinic_profiles for insert
  with check (
    auth.uid() = id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'clinic'
    )
  );

create policy "Clinic owners update own clinic profile"
  on public.clinic_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.ensure_clinic_role_on_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.id and role = 'clinic'
  ) then
    raise exception 'Clinic profile requires clinic role';
  end if;
  return new;
end;
$$;

create trigger clinic_profiles_require_clinic_role
  before insert on public.clinic_profiles
  for each row execute function public.ensure_clinic_role_on_profile();
