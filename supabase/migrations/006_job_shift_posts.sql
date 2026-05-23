create table public.job_posts (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references auth.users(id) on delete cascade,
  role_type text not null check (role_type in ('hygienist', 'assistant', 'admin')),
  employment_type text not null check (employment_type in ('permanent', 'part-time', 'temp', 'fill-in')),
  title text not null,
  wage_range text,
  schedule text,
  description text,
  required_qualifications text[] not null default '{}',
  preferred_qualifications text[] not null default '{}',
  specialty text not null default 'general',
  software_used text[] not null default '{}',
  start_date date,
  benefits text,
  status text not null default 'draft' check (status in ('draft', 'live', 'filled', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.shift_posts (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references auth.users(id) on delete cascade,
  role_type text not null check (role_type in ('hygienist', 'assistant', 'admin')),
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  compensation text,
  urgency text not null default 'normal' check (urgency in ('normal', 'urgent', 'same_day')),
  description text,
  status text not null default 'draft' check (status in ('draft', 'live', 'filled', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.job_posts enable row level security;
alter table public.shift_posts enable row level security;

create policy "Clinics read own job posts"
  on public.job_posts for select using (auth.uid() = clinic_id);

create policy "Clinics insert own job posts"
  on public.job_posts for insert with check (auth.uid() = clinic_id);

create policy "Clinics update own job posts"
  on public.job_posts for update using (auth.uid() = clinic_id);

create policy "Workers read live job posts"
  on public.job_posts for select using (status = 'live');

create policy "Clinics read own shift posts"
  on public.shift_posts for select using (auth.uid() = clinic_id);

create policy "Clinics insert own shift posts"
  on public.shift_posts for insert with check (auth.uid() = clinic_id);

create policy "Clinics update own shift posts"
  on public.shift_posts for update using (auth.uid() = clinic_id);

create policy "Workers read live shift posts"
  on public.shift_posts for select using (status = 'live');
