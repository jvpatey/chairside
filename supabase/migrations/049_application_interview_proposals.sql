-- Interview reschedule proposals (confirmed time stays until accepted) and cancel confirmed interviews.

alter table public.applications
  add column if not exists interview_proposed_at timestamptz,
  add column if not exists interview_proposed_duration_minutes integer,
  add column if not exists interview_proposed_details text,
  add column if not exists interview_proposed_by text check (interview_proposed_by in ('clinic', 'worker'));

create or replace function public.accept_application_interview_update(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_proposed_by text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select interview_proposed_by into v_proposed_by
  from public.applications
  where id = application_id
    and status = 'interview_scheduled'
    and interview_proposed_at is not null;

  if v_proposed_by is null then
    raise exception 'No pending interview change';
  end if;

  if v_proposed_by = 'clinic' and not exists (
    select 1 from public.applications a
    where a.id = application_id and a.worker_id = auth.uid()
  ) then
    raise exception 'Not authorized to accept this change';
  end if;

  if v_proposed_by = 'worker' and not exists (
    select 1 from public.applications a
    join public.job_posts j on j.id = a.job_post_id and j.clinic_id = auth.uid()
    where a.id = application_id
    union all
    select 1 from public.applications a
    join public.shift_posts s on s.id = a.shift_post_id and s.clinic_id = auth.uid()
    where a.id = application_id
  ) then
    raise exception 'Not authorized to accept this change';
  end if;

  update public.applications
  set
    interview_at = interview_proposed_at,
    interview_duration_minutes = interview_proposed_duration_minutes,
    interview_details = interview_proposed_details,
    interview_proposed_at = null,
    interview_proposed_duration_minutes = null,
    interview_proposed_details = null,
    interview_proposed_by = null,
    updated_at = now()
  where id = application_id
    and status = 'interview_scheduled'
    and interview_proposed_at is not null
  returning * into v_row;

  if not found then
    raise exception 'No pending interview change';
  end if;

  return v_row;
end;
$$;

create or replace function public.decline_application_interview_update(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_proposed_by text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select interview_proposed_by into v_proposed_by
  from public.applications
  where id = application_id
    and status = 'interview_scheduled'
    and interview_proposed_at is not null;

  if v_proposed_by is null then
    raise exception 'No pending interview change';
  end if;

  if v_proposed_by = 'clinic' and not exists (
    select 1 from public.applications a
    where a.id = application_id and a.worker_id = auth.uid()
  ) then
    raise exception 'Not authorized to decline this change';
  end if;

  if v_proposed_by = 'worker' and not exists (
    select 1 from public.applications a
    join public.job_posts j on j.id = a.job_post_id and j.clinic_id = auth.uid()
    where a.id = application_id
    union all
    select 1 from public.applications a
    join public.shift_posts s on s.id = a.shift_post_id and s.clinic_id = auth.uid()
    where a.id = application_id
  ) then
    raise exception 'Not authorized to decline this change';
  end if;

  update public.applications
  set
    interview_proposed_at = null,
    interview_proposed_duration_minutes = null,
    interview_proposed_details = null,
    interview_proposed_by = null,
    updated_at = now()
  where id = application_id
    and status = 'interview_scheduled'
    and interview_proposed_at is not null
  returning * into v_row;

  if not found then
    raise exception 'No pending interview change';
  end if;

  return v_row;
end;
$$;

create or replace function public.propose_application_interview_update(
  application_id uuid,
  proposed_at timestamptz,
  proposed_duration_minutes integer,
  proposed_details text default null
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.applications
  set
    interview_proposed_at = proposed_at,
    interview_proposed_duration_minutes = proposed_duration_minutes,
    interview_proposed_details = proposed_details,
    interview_proposed_by = 'worker',
    updated_at = now()
  where id = application_id
    and worker_id = auth.uid()
    and status = 'interview_scheduled'
  returning * into v_row;

  if not found then
    raise exception 'Interview not found or cannot be updated';
  end if;

  return v_row;
end;
$$;

create or replace function public.cancel_scheduled_application_interview(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.applications
  set
    status = 'in_progress',
    interview_at = null,
    interview_duration_minutes = null,
    interview_details = null,
    interview_proposed_at = null,
    interview_proposed_duration_minutes = null,
    interview_proposed_details = null,
    interview_proposed_by = null,
    interview_offer_closed_by = 'worker',
    updated_at = now()
  where id = application_id
    and worker_id = auth.uid()
    and status = 'interview_scheduled'
  returning * into v_row;

  if not found then
    raise exception 'Interview not found or cannot be cancelled';
  end if;

  return v_row;
end;
$$;

revoke all on function public.accept_application_interview_update(uuid) from public;
revoke all on function public.decline_application_interview_update(uuid) from public;
revoke all on function public.propose_application_interview_update(uuid, timestamptz, integer, text) from public;
revoke all on function public.cancel_scheduled_application_interview(uuid) from public;

grant execute on function public.accept_application_interview_update(uuid) to authenticated;
grant execute on function public.decline_application_interview_update(uuid) to authenticated;
grant execute on function public.propose_application_interview_update(uuid, timestamptz, integer, text) to authenticated;
grant execute on function public.cancel_scheduled_application_interview(uuid) to authenticated;
