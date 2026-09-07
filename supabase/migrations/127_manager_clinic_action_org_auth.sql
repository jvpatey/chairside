-- Allow group managers to take clinic actions that previously required
-- auth.uid() = clinic_id (owner-only). Use org membership checks instead.

-- ---------------------------------------------------------------------------
-- Applications UPDATE (SELECT already allowed managers in 102)
-- ---------------------------------------------------------------------------
drop policy if exists "Clinics update applications for own job posts" on public.applications;

create policy "Clinics update applications for own job posts"
  on public.applications for update
  using (
    job_post_id is not null
    and exists (
      select 1 from public.job_posts jp
      where jp.id = applications.job_post_id
        and (
          jp.clinic_id = auth.uid()
          or public.is_clinic_org_member(coalesce(jp.organization_id, jp.clinic_id))
        )
    )
  )
  with check (
    job_post_id is not null
    and exists (
      select 1 from public.job_posts jp
      where jp.id = applications.job_post_id
        and (
          jp.clinic_id = auth.uid()
          or public.is_clinic_org_member(coalesce(jp.organization_id, jp.clinic_id))
        )
    )
  );

drop policy if exists "Clinics update applications for own shift posts" on public.applications;

create policy "Clinics update applications for own shift posts"
  on public.applications for update
  using (
    shift_post_id is not null
    and exists (
      select 1 from public.shift_posts sp
      where sp.id = applications.shift_post_id
        and (
          sp.clinic_id = auth.uid()
          or public.is_clinic_org_member(coalesce(sp.organization_id, sp.clinic_id))
        )
    )
  )
  with check (
    shift_post_id is not null
    and exists (
      select 1 from public.shift_posts sp
      where sp.id = applications.shift_post_id
        and (
          sp.clinic_id = auth.uid()
          or public.is_clinic_org_member(coalesce(sp.organization_id, sp.clinic_id))
        )
    )
  );

-- ---------------------------------------------------------------------------
-- CRM notes / follow-ups
-- ---------------------------------------------------------------------------
drop policy if exists "Clinics read own worker CRM records" on public.clinic_worker_crm;
create policy "Clinics read own worker CRM records"
  on public.clinic_worker_crm for select
  using (
    auth.uid() = clinic_id
    or public.is_clinic_org_member(clinic_id)
  );

drop policy if exists "Clinics insert own worker CRM records" on public.clinic_worker_crm;
create policy "Clinics insert own worker CRM records"
  on public.clinic_worker_crm for insert
  with check (
    (
      auth.uid() = clinic_id
      or public.is_clinic_org_member(clinic_id)
    )
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'clinic'
    )
  );

drop policy if exists "Clinics update own worker CRM records" on public.clinic_worker_crm;
create policy "Clinics update own worker CRM records"
  on public.clinic_worker_crm for update
  using (
    auth.uid() = clinic_id
    or public.is_clinic_org_member(clinic_id)
  )
  with check (
    auth.uid() = clinic_id
    or public.is_clinic_org_member(clinic_id)
  );

drop policy if exists "Clinics delete own worker CRM records" on public.clinic_worker_crm;
create policy "Clinics delete own worker CRM records"
  on public.clinic_worker_crm for delete
  using (
    auth.uid() = clinic_id
    or public.is_clinic_org_member(clinic_id)
  );

-- ---------------------------------------------------------------------------
-- Fill-in confirm / cancel / delete
-- ---------------------------------------------------------------------------
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
    and (
      sp.clinic_id = auth.uid()
      or public.is_clinic_org_member(coalesce(sp.organization_id, sp.clinic_id))
    )
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
  v_org_id uuid;
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
    and (
      a.worker_id = auth.uid()
      or sp.clinic_id = auth.uid()
      or public.is_clinic_org_member(coalesce(sp.organization_id, sp.clinic_id))
    )
  for update of a;

  if not found then
    raise exception 'Confirmed fill-in not found';
  end if;

  select sp.clinic_id, coalesce(sp.organization_id, sp.clinic_id)
  into v_clinic_id, v_org_id
  from public.shift_posts sp
  where sp.id = v_row.shift_post_id;

  v_is_clinic := (
    v_clinic_id = auth.uid()
    or public.is_clinic_org_member(v_org_id)
  );
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

create or replace function public.delete_confirmed_fill_in(
  application_id uuid,
  message text
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
    and (
      sp.clinic_id = auth.uid()
      or public.is_clinic_org_member(coalesce(sp.organization_id, sp.clinic_id))
    )
  for update of a;

  if not found then
    raise exception 'Confirmed fill-in not found';
  end if;

  v_message := nullif(trim(coalesce(message, '')), '');
  if v_message is null then
    raise exception 'Deletion message is required';
  end if;

  v_shift_id := v_row.shift_post_id;

  select sp.clinic_id
  into v_clinic_id
  from public.shift_posts sp
  where sp.id = v_shift_id;

  update public.applications a
  set
    status = 'rejected',
    status_note = v_message,
    status_closed_by = 'clinic_deleted',
    shift_date = sp.shift_date,
    shift_start_time = sp.start_time,
    shift_end_time = sp.end_time,
    shift_role_type = sp.role_type,
    clinic_name = coalesce(a.clinic_name, cp.clinic_name),
    clinic_city = coalesce(a.clinic_city, cp.city),
    clinic_province = coalesce(a.clinic_province, cp.province),
    clinic_logo_storage_path = coalesce(a.clinic_logo_storage_path, cp.logo_storage_path),
    updated_at = now()
  from public.shift_posts sp
  join public.clinic_profiles cp on cp.id = sp.clinic_id
  where a.id = application_id
    and sp.id = v_shift_id
  returning a.* into v_row;

  delete from public.shift_posts
  where id = v_shift_id
    and clinic_id = v_clinic_id;

  return v_row;
end;
$$;

revoke all on function public.delete_confirmed_fill_in(uuid, text) from public;
grant execute on function public.delete_confirmed_fill_in(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Application kit / seen / hide
-- ---------------------------------------------------------------------------
create or replace function public.request_application_kit(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_clinic_id uuid;
  v_org_id uuid;
begin
  select a.*
  into v_row
  from public.applications a
  where a.id = application_id;

  if not found then
    raise exception 'Application not found';
  end if;

  v_clinic_id := public.application_clinic_id(v_row);

  select coalesce(
    (
      select coalesce(jp.organization_id, jp.clinic_id)
      from public.job_posts jp
      where jp.id = v_row.job_post_id
    ),
    (
      select coalesce(sp.organization_id, sp.clinic_id)
      from public.shift_posts sp
      where sp.id = v_row.shift_post_id
    ),
    v_clinic_id
  )
  into v_org_id;

  if v_clinic_id is null
     or not (
       v_clinic_id = auth.uid()
       or public.is_clinic_org_member(v_org_id)
     )
  then
    raise exception 'Application not found';
  end if;

  if v_row.status <> 'screening_submitted' then
    raise exception 'Application is not awaiting screening review';
  end if;

  if v_row.application_kit_requested_at is not null then
    raise exception 'Application kit already requested';
  end if;

  update public.applications
  set
    application_kit_requested_at = now(),
    updated_at = now()
  where id = application_id
    and status = 'screening_submitted'
    and application_kit_requested_at is null
  returning * into v_row;

  if not found then
    raise exception 'Application kit could not be requested';
  end if;

  return v_row;
end;
$$;

revoke all on function public.request_application_kit(uuid) from public;
grant execute on function public.request_application_kit(uuid) to authenticated;

create or replace function public.mark_application_seen_by_clinic(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications%rowtype;
begin
  update public.applications a
  set clinic_last_seen_at = greatest(now(), a.clinic_attention_at)
  where a.id = application_id
    and (
      exists (
        select 1
        from public.job_posts jp
        where jp.id = a.job_post_id
          and (
            jp.clinic_id = auth.uid()
            or public.is_clinic_org_member(coalesce(jp.organization_id, jp.clinic_id))
          )
      )
      or exists (
        select 1
        from public.shift_posts sp
        where sp.id = a.shift_post_id
          and (
            sp.clinic_id = auth.uid()
            or public.is_clinic_org_member(coalesce(sp.organization_id, sp.clinic_id))
          )
      )
    )
  returning * into v_row;

  if not found then
    raise exception 'Application not found';
  end if;

  return v_row;
end;
$$;

revoke all on function public.mark_application_seen_by_clinic(uuid) from public;
grant execute on function public.mark_application_seen_by_clinic(uuid) to authenticated;

create or replace function public.hide_clinic_application(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
begin
  select a.* into v_row
  from public.applications a
  where a.id = application_id
    and (
      (
        a.job_post_id is not null
        and exists (
          select 1
          from public.job_posts jp
          where jp.id = a.job_post_id
            and (
              jp.clinic_id = auth.uid()
              or public.is_clinic_org_member(coalesce(jp.organization_id, jp.clinic_id))
            )
        )
      )
      or (
        a.shift_post_id is not null
        and exists (
          select 1
          from public.shift_posts sp
          where sp.id = a.shift_post_id
            and (
              sp.clinic_id = auth.uid()
              or public.is_clinic_org_member(coalesce(sp.organization_id, sp.clinic_id))
            )
        )
      )
    );

  if not found then
    raise exception 'Application not found';
  end if;

  if v_row.clinic_hidden_at is not null then
    return v_row;
  end if;

  if v_row.status not in ('rejected', 'selected', 'hired') then
    raise exception 'Only decided applications can be removed from the list';
  end if;

  update public.applications
  set clinic_hidden_at = now(),
      updated_at = now()
  where id = application_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.hide_clinic_application(uuid) from public;
grant execute on function public.hide_clinic_application(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Outreach browse helper (RLS for worker photos/profiles)
-- ---------------------------------------------------------------------------
create or replace function public.clinic_can_browse_outreach_worker(p_worker_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.worker_profiles wp
    join public.clinic_profiles cp on cp.id = coalesce(
      public.get_clinic_organization_id_for_user(auth.uid()),
      auth.uid()
    )
    where wp.id = p_worker_id
      and wp.accepts_clinic_fill_in_outreach = true
      and wp.short_notice_available = true
      and wp.setup_completed_at is not null
      and cp.setup_completed_at is not null
      and cp.province = wp.province
  );
$$;

revoke all on function public.clinic_can_browse_outreach_worker(uuid) from public;
grant execute on function public.clinic_can_browse_outreach_worker(uuid) to authenticated;
