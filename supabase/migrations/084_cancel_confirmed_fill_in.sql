-- Cancel a confirmed fill-in: reject the hired application and reopen the shift.

create or replace function public.cancel_confirmed_fill_in(application_id uuid)
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
    and a.status = 'hired'
    and sp.status = 'filled'
    and (a.worker_id = auth.uid() or sp.clinic_id = auth.uid())
  for update of a, sp;

  if not found then
    raise exception 'Confirmed fill-in not found';
  end if;

  v_shift_id := v_row.shift_post_id;

  update public.applications
  set status = 'rejected', updated_at = now()
  where id = application_id
  returning * into v_row;

  update public.shift_posts
  set status = 'live', updated_at = now()
  where id = v_shift_id;

  return v_row;
end;
$$;

revoke all on function public.cancel_confirmed_fill_in(uuid) from public;
grant execute on function public.cancel_confirmed_fill_in(uuid) to authenticated;
