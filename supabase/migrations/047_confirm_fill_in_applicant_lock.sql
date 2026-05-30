-- No-op on fresh installs: locking is in 044_confirm_fill_in_applicant.sql.
-- Kept for databases that applied 044 before the lock was added (replaces the function once).

create or replace function public.confirm_fill_in_applicant(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_shift_id uuid;
  v_shift_status text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select a.shift_post_id, sp.status
  into v_shift_id, v_shift_status
  from public.applications a
  join public.shift_posts sp on sp.id = a.shift_post_id
  where a.id = application_id
    and a.shift_post_id is not null
    and sp.clinic_id = auth.uid()
  for update of sp;

  if not found then
    raise exception 'Fill-in application not found';
  end if;

  if v_shift_status = 'filled' then
    raise exception 'Shift is already filled';
  end if;

  if exists (
    select 1
    from public.applications
    where shift_post_id = v_shift_id
      and status = 'hired'
  ) then
    raise exception 'Shift already has a confirmed applicant';
  end if;

  select a.*
  into v_row
  from public.applications a
  where a.id = application_id;

  if not public.is_fill_in_pending_status(v_row.status) then
    raise exception 'Application is not pending';
  end if;

  update public.applications
  set status = 'hired', updated_at = now()
  where id = application_id
  returning * into v_row;

  update public.applications
  set status = 'rejected', updated_at = now()
  where shift_post_id = v_shift_id
    and id <> application_id
    and public.is_fill_in_pending_status(status);

  update public.shift_posts
  set status = 'filled', updated_at = now()
  where id = v_shift_id;

  return v_row;
end;
$$;
