-- Allow candidates to counter-propose a time while an interview invite is still pending
-- (status = interview_offered), reusing the existing proposal columns.

create or replace function public.accept_application_interview_update(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_proposed_by text;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select interview_proposed_by, status
  into v_proposed_by, v_status
  from public.applications
  where id = application_id
    and status in ('interview_offered', 'interview_scheduled')
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

  -- Pending invite + worker counter: confirm at the suggested time.
  if v_status = 'interview_offered' then
    if v_proposed_by <> 'worker' then
      raise exception 'No pending interview change';
    end if;

    update public.applications
    set
      status = 'interview_scheduled',
      interview_at = interview_proposed_at,
      interview_duration_minutes = interview_proposed_duration_minutes,
      interview_details = interview_proposed_details,
      interview_proposed_at = null,
      interview_proposed_duration_minutes = null,
      interview_proposed_details = null,
      interview_proposed_by = null,
      updated_at = now()
    where id = application_id
      and status = 'interview_offered'
      and interview_proposed_at is not null
      and interview_proposed_by = 'worker'
    returning * into v_row;
  else
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
  end if;

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
    and status in ('interview_offered', 'interview_scheduled')
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

  -- Clears the counter/reschedule proposal; original invite or confirmed time stays.
  update public.applications
  set
    interview_proposed_at = null,
    interview_proposed_duration_minutes = null,
    interview_proposed_details = null,
    interview_proposed_by = null,
    updated_at = now()
  where id = application_id
    and status in ('interview_offered', 'interview_scheduled')
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
    and status in ('interview_offered', 'interview_scheduled')
  returning * into v_row;

  if not found then
    raise exception 'Interview not found or cannot be updated';
  end if;

  return v_row;
end;
$$;

-- Keep proposal fields cleared when a pending invite is declined.
create or replace function public.decline_application_interview(application_id uuid)
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
    and status = 'interview_offered'
  returning * into v_row;

  if not found then
    raise exception 'Interview offer not found or already responded';
  end if;

  return v_row;
end;
$$;

-- Accepting the original invite also clears any leftover counter-proposal fields.
create or replace function public.accept_application_interview(application_id uuid)
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
    status = 'interview_scheduled',
    interview_proposed_at = null,
    interview_proposed_duration_minutes = null,
    interview_proposed_details = null,
    interview_proposed_by = null,
    updated_at = now()
  where id = application_id
    and worker_id = auth.uid()
    and status = 'interview_offered'
  returning * into v_row;

  if not found then
    raise exception 'Interview offer not found or already responded';
  end if;

  return v_row;
end;
$$;
