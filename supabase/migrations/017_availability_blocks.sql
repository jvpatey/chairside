create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references auth.users(id) on delete cascade,
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint availability_blocks_time_check check (start_time < end_time)
);

create index availability_blocks_worker_id_idx on public.availability_blocks (worker_id);

alter table public.availability_blocks enable row level security;

create policy "Workers read own availability blocks"
  on public.availability_blocks for select
  using (auth.uid() = worker_id);

create policy "Workers insert own availability blocks"
  on public.availability_blocks for insert
  with check (auth.uid() = worker_id);

create policy "Workers update own availability blocks"
  on public.availability_blocks for update
  using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

create policy "Workers delete own availability blocks"
  on public.availability_blocks for delete
  using (auth.uid() = worker_id);

create policy "Clinics read availability for applicants"
  on public.availability_blocks for select
  using (
    exists (
      select 1 from public.applications a
      where a.worker_id = availability_blocks.worker_id
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
