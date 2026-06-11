-- Server-backed application notification seen/attention timestamps (mirrors conversation read pattern).

alter table public.applications
  add column if not exists worker_attention_at timestamptz,
  add column if not exists worker_last_seen_at timestamptz,
  add column if not exists clinic_attention_at timestamptz,
  add column if not exists clinic_last_seen_at timestamptz;

-- Backfill existing rows to avoid a deploy-day badge explosion.
update public.applications
set
  worker_attention_at = coalesce(worker_attention_at, updated_at),
  clinic_attention_at = coalesce(clinic_attention_at, updated_at),
  worker_last_seen_at = coalesce(worker_last_seen_at, updated_at),
  clinic_last_seen_at = case
    when clinic_last_seen_at is not null then clinic_last_seen_at
    when status in ('applied', 'screening_submitted') then null
    else updated_at
  end
where worker_attention_at is null
   or clinic_attention_at is null
   or worker_last_seen_at is null
   or clinic_last_seen_at is null;

alter table public.applications
  alter column worker_attention_at set default now(),
  alter column clinic_attention_at set default now();

-- Initialize attention timestamps on insert.
create or replace function public.snapshot_application_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker public.worker_profiles%rowtype;
  v_clinic public.clinic_profiles%rowtype;
  v_clinic_id uuid;
  v_display_name text;
  v_job_match jsonb;
  v_role_types text[];
begin
  select * into v_worker from public.worker_profiles where id = new.worker_id;

  if found then
    select display_name into v_display_name
    from public.profiles
    where id = new.worker_id;

    v_role_types := public.worker_role_types_resolved(v_worker.role_type, v_worker.role_types);

    if new.status = 'screening_submitted' then
      new.worker_display_name := nullif(trim(v_display_name), '');
    else
      new.years_of_experience := v_worker.years_of_experience;
      new.education := public.format_worker_education(v_worker);
      new.role_type := v_role_types[1];
      new.role_types := v_role_types;
      new.license_type := null;
      new.resume_storage_path := v_worker.resume_storage_path;
      new.software_used := coalesce(v_worker.software_used, '{}');
      new.practice_types := coalesce(v_worker.practice_types, '{}');
      new.preferred_employment_types := coalesce(v_worker.preferred_employment_types, '{}');
      new.worker_display_name := nullif(trim(v_display_name), '');
      new.worker_address := public.format_worker_address(v_worker);
      new.worker_photo_storage_path := v_worker.photo_storage_path;
    end if;
  end if;

  v_clinic_id := coalesce(
    (select jp.clinic_id from public.job_posts jp where jp.id = new.job_post_id),
    (select sp.clinic_id from public.shift_posts sp where sp.id = new.shift_post_id)
  );

  if v_clinic_id is not null then
    select * into v_clinic from public.clinic_profiles where id = v_clinic_id;
    if found then
      new.clinic_name := v_clinic.clinic_name;
      new.clinic_city := v_clinic.city;
      new.clinic_province := v_clinic.province;
      new.clinic_logo_storage_path := v_clinic.logo_storage_path;
    end if;
  end if;

  if new.job_post_id is not null then
    new.match_tier := null;
    new.match_breakdown := null;
    new.match_score := null;

    v_job_match := public.compute_job_match(new.worker_id, new.job_post_id);
    if v_job_match is not null then
      new.match_tier := v_job_match->>'tier';
      new.match_breakdown := v_job_match->'breakdown';
    end if;
  else
    new.match_tier := null;
    new.match_breakdown := null;
    new.match_score := null;
  end if;

  new.clinic_attention_at := coalesce(new.clinic_attention_at, now());
  new.worker_attention_at := coalesce(new.worker_attention_at, coalesce(new.created_at, now()));

  return new;
end;
$$;

-- Bump attention timestamps when the opposite party makes meaningful changes.
create or replace function public.bump_application_attention_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    return new;
  end if;

  if v_actor = new.worker_id then
    if old.status is distinct from new.status
      or old.application_kit_submitted_at is distinct from new.application_kit_submitted_at
      or old.interview_proposed_at is distinct from new.interview_proposed_at
      or old.interview_proposed_duration_minutes is distinct from new.interview_proposed_duration_minutes
      or old.interview_proposed_details is distinct from new.interview_proposed_details
      or old.interview_proposed_by is distinct from new.interview_proposed_by
    then
      new.clinic_attention_at := now();
    end if;
  elsif v_actor is distinct from new.worker_id then
    if old.status is distinct from new.status
      or old.interview_at is distinct from new.interview_at
      or old.interview_duration_minutes is distinct from new.interview_duration_minutes
      or old.interview_details is distinct from new.interview_details
      or old.interview_proposed_at is distinct from new.interview_proposed_at
      or old.interview_proposed_duration_minutes is distinct from new.interview_proposed_duration_minutes
      or old.interview_proposed_details is distinct from new.interview_proposed_details
      or old.interview_proposed_by is distinct from new.interview_proposed_by
      or old.application_kit_requested_at is distinct from new.application_kit_requested_at
    then
      new.worker_attention_at := now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists applications_bump_attention_on_update on public.applications;

create trigger applications_bump_attention_on_update
  before update on public.applications
  for each row execute function public.bump_application_attention_on_update();

create or replace function public.mark_application_seen_by_worker(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications%rowtype;
begin
  update public.applications
  set worker_last_seen_at = greatest(now(), worker_attention_at)
  where id = application_id
    and worker_id = auth.uid()
  returning * into v_row;

  if not found then
    raise exception 'Application not found';
  end if;

  return v_row;
end;
$$;

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
          and jp.clinic_id = auth.uid()
      )
      or exists (
        select 1
        from public.shift_posts sp
        where sp.id = a.shift_post_id
          and sp.clinic_id = auth.uid()
      )
    )
  returning * into v_row;

  if not found then
    raise exception 'Application not found';
  end if;

  return v_row;
end;
$$;

create or replace function public.mark_applications_seen_by_worker(application_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if application_ids is null or cardinality(application_ids) = 0 then
    return;
  end if;

  update public.applications
  set worker_last_seen_at = greatest(now(), worker_attention_at)
  where id = any(application_ids)
    and worker_id = auth.uid();
end;
$$;

revoke all on function public.mark_application_seen_by_worker(uuid) from public;
grant execute on function public.mark_application_seen_by_worker(uuid) to authenticated;

revoke all on function public.mark_application_seen_by_clinic(uuid) from public;
grant execute on function public.mark_application_seen_by_clinic(uuid) to authenticated;

revoke all on function public.mark_applications_seen_by_worker(uuid[]) from public;
grant execute on function public.mark_applications_seen_by_worker(uuid[]) to authenticated;
