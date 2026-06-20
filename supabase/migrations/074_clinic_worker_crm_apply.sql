create table if not exists public.clinic_worker_crm (
  clinic_id uuid not null references public.clinic_profiles(id) on delete cascade,
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  note text,
  tags text[] not null default '{}',
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (clinic_id, worker_id)
);

create index if not exists clinic_worker_crm_worker_id_idx
  on public.clinic_worker_crm(worker_id);

create index if not exists clinic_worker_crm_follow_up_at_idx
  on public.clinic_worker_crm(follow_up_at)
  where follow_up_at is not null;

alter table public.clinic_worker_crm enable row level security;

drop policy if exists "Clinics read own worker CRM records" on public.clinic_worker_crm;
create policy "Clinics read own worker CRM records"
  on public.clinic_worker_crm for select
  using (auth.uid() = clinic_id);

drop policy if exists "Clinics insert own worker CRM records" on public.clinic_worker_crm;
create policy "Clinics insert own worker CRM records"
  on public.clinic_worker_crm for insert
  with check (
    auth.uid() = clinic_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'clinic'
    )
  );

drop policy if exists "Clinics update own worker CRM records" on public.clinic_worker_crm;
create policy "Clinics update own worker CRM records"
  on public.clinic_worker_crm for update
  using (auth.uid() = clinic_id)
  with check (auth.uid() = clinic_id);

drop policy if exists "Clinics delete own worker CRM records" on public.clinic_worker_crm;
create policy "Clinics delete own worker CRM records"
  on public.clinic_worker_crm for delete
  using (auth.uid() = clinic_id);
