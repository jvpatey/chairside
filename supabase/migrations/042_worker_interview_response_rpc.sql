-- Workers respond to interview offers via RPC (only status / interview fields), not row-wide UPDATE.

drop policy if exists "Workers respond to interview offers" on public.applications;

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

revoke all on function public.accept_application_interview(uuid) from public;
revoke all on function public.decline_application_interview(uuid) from public;
grant execute on function public.accept_application_interview(uuid) to authenticated;
grant execute on function public.decline_application_interview(uuid) to authenticated;
