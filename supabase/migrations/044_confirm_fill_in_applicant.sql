-- Atomic fill-in accept: confirm one worker, decline pending siblings, mark shift filled.

create or replace function public.is_fill_in_pending_status(p_status text)
returns boolean
language sql
immutable
as $$
  select p_status in (
    'applied',
    'reviewed',
    'in_progress',
    'interview_offered',
    'interview_scheduled'
  );
$$;

create or replace function public.confirm_fill_in_applicant(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_shift_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select a.*
  into v_row
  from public.applications a
  join public.shift_posts sp on sp.id = a.shift_post_id
  where a.id = application_id
    and a.shift_post_id is not null
    and sp.clinic_id = auth.uid();

  if not found then
    raise exception 'Fill-in application not found';
  end if;

  v_shift_id := v_row.shift_post_id;

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

revoke all on function public.confirm_fill_in_applicant(uuid) from public;
grant execute on function public.confirm_fill_in_applicant(uuid) to authenticated;
