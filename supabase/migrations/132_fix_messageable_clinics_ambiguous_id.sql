-- Fix "column reference id is ambiguous" in list_messageable_clinics_for_worker:
-- the RETURNS TABLE column `id` shadowed profiles.id in the worker role check,
-- so the worker "Message a clinic" list always errored and rendered empty.

create or replace function public.list_messageable_clinics_for_worker()
returns table (
  id uuid,
  clinic_name text,
  city text,
  province text,
  specialty text,
  description text,
  logo_storage_path text,
  existing_conversation_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_worker_id uuid;
  v_worker_province text;
begin
  v_worker_id := auth.uid();
  if v_worker_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_worker_id and p.role = 'worker'
  ) then
    raise exception 'Only workers can browse clinics';
  end if;

  if not public.is_worker_profile_complete(v_worker_id) then
    return;
  end if;

  select wp.province into v_worker_province
  from public.worker_profiles wp
  where wp.id = v_worker_id;

  if v_worker_province is null then
    return;
  end if;

  return query
  select
    cp.id,
    cp.clinic_name,
    cp.city,
    cp.province,
    cp.specialty,
    cp.description,
    cp.logo_storage_path,
    (
      select c.id
      from public.conversations c
      where c.worker_id = v_worker_id
        and c.clinic_id = cp.id
        and c.conversation_type = 'general'
      limit 1
    ) as existing_conversation_id
  from public.clinic_profiles cp
  where cp.accepts_general_candidate_messages = true
    and cp.setup_completed_at is not null
    and cp.province = v_worker_province
    and public.clinic_can_use_feature(cp.id, 'general_candidate_messaging')
  order by cp.clinic_name;
end;
$$;

revoke all on function public.list_messageable_clinics_for_worker() from public;
grant execute on function public.list_messageable_clinics_for_worker() to authenticated;
