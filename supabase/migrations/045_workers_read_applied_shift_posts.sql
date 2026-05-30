-- Workers must read shift posts they applied to even after the shift is filled.
-- Use a security definer helper so this policy does not recurse with applications RLS
-- (clinic application policies also select from shift_posts).

drop policy if exists "Workers read shift posts they applied to" on public.shift_posts;

create or replace function public.worker_applied_to_shift_post(p_shift_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    where a.shift_post_id = p_shift_post_id
      and a.worker_id = auth.uid()
  );
$$;

revoke all on function public.worker_applied_to_shift_post(uuid) from public;
grant execute on function public.worker_applied_to_shift_post(uuid) to authenticated;

create policy "Workers read shift posts they applied to"
  on public.shift_posts for select
  using (public.worker_applied_to_shift_post(id));
