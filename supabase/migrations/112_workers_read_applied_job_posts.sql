-- Workers must read job posts they applied to even after the role is filled/closed.
-- Mirrors 045_workers_read_applied_shift_posts.sql (security definer to avoid RLS recursion).

drop policy if exists "Workers read job posts they applied to" on public.job_posts;

create or replace function public.worker_applied_to_job_post(p_job_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    where a.job_post_id = p_job_post_id
      and a.worker_id = auth.uid()
  );
$$;

revoke all on function public.worker_applied_to_job_post(uuid) from public;
grant execute on function public.worker_applied_to_job_post(uuid) to authenticated;

create policy "Workers read job posts they applied to"
  on public.job_posts for select
  using (public.worker_applied_to_job_post(id));
