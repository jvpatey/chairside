-- Harden saved-post RPCs: explicit auth checks and idempotent inserts under concurrency.

create or replace function public.save_job_post_for_worker(p_job_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.worker_saved_posts (worker_id, job_post_id, saved_at)
  values (auth.uid(), p_job_post_id, now())
  on conflict (worker_id, job_post_id) where job_post_id is not null
  do nothing;
end;
$$;

create or replace function public.unsave_job_post_for_worker(p_job_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

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
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.worker_saved_posts (worker_id, shift_post_id, saved_at)
  values (auth.uid(), p_shift_post_id, now())
  on conflict (worker_id, shift_post_id) where shift_post_id is not null
  do nothing;
end;
$$;

create or replace function public.unsave_shift_post_for_worker(p_shift_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.worker_saved_posts
  where worker_id = auth.uid()
    and shift_post_id = p_shift_post_id;
end;
$$;
