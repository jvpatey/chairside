-- Allow workers to resubmit a declined or cancelled cover request for an open fill-in.

create or replace function public.re_request_shift_cover(
  application_id uuid,
  p_cover_message text default null
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_worker public.worker_profiles%rowtype;
  v_display_name text;
  v_role_types text[];
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select a.*
  into v_row
  from public.applications a
  join public.shift_posts sp on sp.id = a.shift_post_id
  where a.id = application_id
    and a.worker_id = auth.uid()
    and a.shift_post_id is not null
    and a.status = 'rejected'
    and sp.status = 'live'
  for update of a, sp;

  if not found then
    raise exception 'Cover request cannot be resubmitted';
  end if;

  select * into v_worker from public.worker_profiles where id = auth.uid();
  if found then
    select display_name into v_display_name
    from public.profiles
    where id = auth.uid();

    v_role_types := public.worker_role_types_resolved(v_worker.role_type, v_worker.role_types);
  end if;

  update public.applications
  set
    status = 'applied',
    status_note = null,
    status_closed_by = null,
    cover_message = nullif(trim(coalesce(p_cover_message, '')), ''),
    worker_hidden_at = null,
    years_of_experience = case when v_worker.id is not null then v_worker.years_of_experience else years_of_experience end,
    education = case when v_worker.id is not null then public.format_worker_education(v_worker) else education end,
    role_type = case when v_worker.id is not null then v_role_types[1] else role_type end,
    role_types = case when v_worker.id is not null then v_role_types else role_types end,
    resume_storage_path = case when v_worker.id is not null then v_worker.resume_storage_path else resume_storage_path end,
    software_used = case when v_worker.id is not null then coalesce(v_worker.software_used, '{}') else software_used end,
    practice_types = case when v_worker.id is not null then coalesce(v_worker.practice_types, '{}') else practice_types end,
    preferred_employment_types = case
      when v_worker.id is not null then coalesce(v_worker.preferred_employment_types, '{}')
      else preferred_employment_types
    end,
    worker_display_name = case
      when v_display_name is not null then nullif(trim(v_display_name), '')
      else worker_display_name
    end,
    worker_address = case
      when v_worker.id is not null then public.format_worker_address(v_worker)
      else worker_address
    end,
    worker_photo_storage_path = case
      when v_worker.id is not null then v_worker.photo_storage_path
      else worker_photo_storage_path
    end,
    clinic_attention_at = now(),
    updated_at = now()
  where id = application_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.re_request_shift_cover(uuid, text) from public;
grant execute on function public.re_request_shift_cover(uuid, text) to authenticated;
