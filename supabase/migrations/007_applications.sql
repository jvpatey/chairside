create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid references public.job_posts(id) on delete cascade,
  shift_post_id uuid references public.shift_posts(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'applied'
    check (status in ('applied', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  match_score numeric,
  cover_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint applications_post_check check (
    (job_post_id is not null and shift_post_id is null)
    or (job_post_id is null and shift_post_id is not null)
  )
);

alter table public.applications enable row level security;

create policy "Workers read own applications"
  on public.applications for select using (auth.uid() = worker_id);

create policy "Workers insert own applications"
  on public.applications for insert with check (auth.uid() = worker_id);

create policy "Clinics read applications for own job posts"
  on public.applications for select using (
    job_post_id is not null
    and exists (
      select 1 from public.job_posts
      where job_posts.id = applications.job_post_id
        and job_posts.clinic_id = auth.uid()
    )
  );

create policy "Clinics read applications for own shift posts"
  on public.applications for select using (
    shift_post_id is not null
    and exists (
      select 1 from public.shift_posts
      where shift_posts.id = applications.shift_post_id
        and shift_posts.clinic_id = auth.uid()
    )
  );

create policy "Clinics update applications for own job posts"
  on public.applications for update using (
    job_post_id is not null
    and exists (
      select 1 from public.job_posts
      where job_posts.id = applications.job_post_id
        and job_posts.clinic_id = auth.uid()
    )
  );

create policy "Clinics update applications for own shift posts"
  on public.applications for update using (
    shift_post_id is not null
    and exists (
      select 1 from public.shift_posts
      where shift_posts.id = applications.shift_post_id
        and shift_posts.clinic_id = auth.uid()
    )
  );
