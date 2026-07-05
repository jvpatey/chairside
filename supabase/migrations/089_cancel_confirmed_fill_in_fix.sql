-- Fix cancel_confirmed_fill_in: sp was out of scope when checking clinic vs worker.

drop function if exists public.cancel_confirmed_fill_in(uuid);
drop function if exists public.cancel_confirmed_fill_in(uuid, text);

create or replace function public.cancel_confirmed_fill_in(
  application_id uuid,
  message text default null
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_shift_id uuid;
  v_clinic_id uuid;
  v_is_clinic boolean;
  v_is_worker boolean;
  v_message text;
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
    and (a.worker_id = auth.uid() or sp.clinic_id = auth.uid())
  for update of a;

  if not found then
    raise exception 'Confirmed fill-in not found';
  end if;

  select clinic_id into v_clinic_id
  from public.shift_posts
  where id = v_row.shift_post_id;

  v_is_clinic := v_clinic_id = auth.uid();
  v_is_worker := v_row.worker_id = auth.uid();

  v_message := nullif(trim(coalesce(message, '')), '');

  if v_is_clinic and v_message is null then
    raise exception 'Cancellation message is required';
  end if;

  v_shift_id := v_row.shift_post_id;

  update public.applications
  set
    status = 'rejected',
    status_note = v_message,
    status_closed_by = case when v_is_clinic then 'clinic' else 'worker' end,
    updated_at = now()
  where id = application_id
  returning * into v_row;

  update public.shift_posts
  set status = 'live', updated_at = now()
  where id = v_shift_id;

  return v_row;
end;
$$;

revoke all on function public.cancel_confirmed_fill_in(uuid, text) from public;
grant execute on function public.cancel_confirmed_fill_in(uuid, text) to authenticated;
