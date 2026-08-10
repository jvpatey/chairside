-- Atomic job hire: mark applicant selected and fill the role posting.

create or replace function public.mark_job_applicant_hired(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_job_id uuid;
  v_job_status text;
  v_org_id uuid;
  v_clinic_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select a.job_post_id, jp.status, jp.clinic_id, coalesce(jp.organization_id, jp.clinic_id)
  into v_job_id, v_job_status, v_clinic_id, v_org_id
  from public.applications a
  join public.job_posts jp on jp.id = a.job_post_id
  where a.id = application_id
    and a.job_post_id is not null
  for update of jp;

  if not found then
    raise exception 'Job application not found';
  end if;

  if not (
    auth.uid() = v_clinic_id
    or public.is_clinic_org_member(v_org_id)
  ) then
    raise exception 'Not authorized';
  end if;

  select a.*
  into v_row
  from public.applications a
  where a.id = application_id
  for update;

  if v_row.status = 'rejected' then
    raise exception 'Application was declined';
  end if;

  if v_row.status is distinct from 'selected' then
    update public.applications
    set status = 'selected', updated_at = now()
    where id = application_id
    returning * into v_row;
  end if;

  if v_job_status in ('live', 'paused') then
    update public.job_posts
    set status = 'filled', updated_at = now()
    where id = v_job_id;
  end if;

  return v_row;
end;
$$;

revoke all on function public.mark_job_applicant_hired(uuid) from public;
grant execute on function public.mark_job_applicant_hired(uuid) to authenticated;
