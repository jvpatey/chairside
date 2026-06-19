-- Worker bookmarks for live job and fill-in shift postings.

create table public.worker_saved_posts (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references auth.users(id) on delete cascade,
  job_post_id uuid references public.job_posts(id) on delete cascade,
  shift_post_id uuid references public.shift_posts(id) on delete cascade,
  saved_at timestamptz not null default now(),
  last_change_seen_at timestamptz,
  constraint worker_saved_posts_one_post check (
    (job_post_id is not null and shift_post_id is null)
    or (job_post_id is null and shift_post_id is not null)
  )
);

create unique index worker_saved_posts_worker_job_idx
  on public.worker_saved_posts (worker_id, job_post_id)
  where job_post_id is not null;

create unique index worker_saved_posts_worker_shift_idx
  on public.worker_saved_posts (worker_id, shift_post_id)
  where shift_post_id is not null;

create index worker_saved_posts_worker_id_idx
  on public.worker_saved_posts (worker_id);

create index worker_saved_posts_job_post_id_idx
  on public.worker_saved_posts (job_post_id)
  where job_post_id is not null;

create index worker_saved_posts_shift_post_id_idx
  on public.worker_saved_posts (shift_post_id)
  where shift_post_id is not null;

alter table public.worker_saved_posts enable row level security;

create policy "Workers read own saved posts"
  on public.worker_saved_posts for select
  using (auth.uid() = worker_id);

create policy "Workers insert own saved posts"
  on public.worker_saved_posts for insert
  with check (auth.uid() = worker_id);

create policy "Workers delete own saved posts"
  on public.worker_saved_posts for delete
  using (auth.uid() = worker_id);

create policy "Workers update own saved posts"
  on public.worker_saved_posts for update
  using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

create or replace function public.save_job_post_for_worker(p_job_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.worker_saved_posts (worker_id, job_post_id, saved_at)
  select auth.uid(), p_job_post_id, now()
  where not exists (
    select 1
    from public.worker_saved_posts
    where worker_id = auth.uid()
      and job_post_id = p_job_post_id
  );
end;
$$;

create or replace function public.unsave_job_post_for_worker(p_job_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.worker_saved_posts
  where worker_id = auth.uid()
    and job_post_id = p_job_post_id;
end;
$$;

create or replace function public.save_shift_post_for_worker(p_shift_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.worker_saved_posts (worker_id, shift_post_id, saved_at)
  select auth.uid(), p_shift_post_id, now()
  where not exists (
    select 1
    from public.worker_saved_posts
    where worker_id = auth.uid()
      and shift_post_id = p_shift_post_id
  );
end;
$$;

create or replace function public.unsave_shift_post_for_worker(p_shift_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.worker_saved_posts
  where worker_id = auth.uid()
    and shift_post_id = p_shift_post_id;
end;
$$;

revoke all on function public.save_job_post_for_worker(uuid) from public;
grant execute on function public.save_job_post_for_worker(uuid) to authenticated;

revoke all on function public.unsave_job_post_for_worker(uuid) from public;
grant execute on function public.unsave_job_post_for_worker(uuid) to authenticated;

revoke all on function public.save_shift_post_for_worker(uuid) from public;
grant execute on function public.save_shift_post_for_worker(uuid) to authenticated;

revoke all on function public.unsave_shift_post_for_worker(uuid) from public;
grant execute on function public.unsave_shift_post_for_worker(uuid) to authenticated;
