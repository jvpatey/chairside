-- Staged screening flow: screening-only submission, clinic requests kit, worker submits full application.

alter table public.applications
  add column if not exists application_kit_requested_at timestamptz,
  add column if not exists application_kit_submitted_at timestamptz;

alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  add constraint applications_status_check
  check (
    status in (
      'screening_submitted',
      'applied',
      'reviewed',
      'in_progress',
      'interview_offered',
      'interview_scheduled',
      'selected',
      'rejected',
      'hired'
    )
  );

create or replace function public.apply_worker_application_kit_snapshot(
  p_application public.applications,
  p_worker public.worker_profiles,
  p_display_name text,
  p_cover_message text default null
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
begin
  update public.applications
  set
    cover_message = nullif(trim(coalesce(p_cover_message, p_application.cover_message)), ''),
    years_of_experience = p_worker.years_of_experience,
    education = public.format_worker_education(p_worker),
    role_type = p_worker.role_type,
    license_type = null,
    resume_storage_path = p_worker.resume_storage_path,
    software_used = coalesce(p_worker.software_used, '{}'),
    practice_types = coalesce(p_worker.practice_types, '{}'),
    preferred_employment_types = coalesce(p_worker.preferred_employment_types, '{}'),
    worker_display_name = nullif(trim(coalesce(p_display_name, '')), ''),
    worker_address = public.format_worker_address(p_worker),
    worker_photo_storage_path = p_worker.photo_storage_path,
    application_kit_submitted_at = now(),
    status = 'applied',
    updated_at = now()
  where id = p_application.id
  returning * into v_row;

  return v_row;
end;
$$;

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
begin
  select * into v_worker from public.worker_profiles where id = new.worker_id;

  if found then
    select display_name into v_display_name
    from public.profiles
    where id = new.worker_id;

    if new.status = 'screening_submitted' then
      new.worker_display_name := nullif(trim(v_display_name), '');
    else
      new.years_of_experience := v_worker.years_of_experience;
      new.education := public.format_worker_education(v_worker);
      new.role_type := v_worker.role_type;
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

  return new;
end;
$$;

drop policy if exists "Workers insert own applications" on public.applications;

create policy "Workers insert own applications"
  on public.applications for insert
  with check (
    auth.uid() = worker_id
    and status in ('applied', 'screening_submitted')
    and (
      (
        job_post_id is not null
        and shift_post_id is null
        and exists (
          select 1 from public.job_posts
          where job_posts.id = job_post_id and job_posts.status = 'live'
        )
      )
      or (
        shift_post_id is not null
        and job_post_id is null
        and exists (
          select 1 from public.shift_posts
          where shift_posts.id = shift_post_id and shift_posts.status = 'live'
        )
      )
    )
  );

create or replace function public.application_messaging_open(p_status text)
returns boolean
language sql
immutable
as $$
  select p_status in (
    'screening_submitted',
    'applied',
    'reviewed',
    'in_progress',
    'interview_offered',
    'interview_scheduled',
    'selected'
  );
$$;

create or replace function public.request_application_kit(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_clinic_id uuid;
begin
  select * into v_row
  from public.applications
  where id = application_id;

  if not found then
    raise exception 'Application not found';
  end if;

  v_clinic_id := public.application_clinic_id(v_row);
  if v_clinic_id is null or v_clinic_id <> auth.uid() then
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

create or replace function public.submit_requested_application_kit(
  application_id uuid,
  cover_message text default null
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
begin
  select * into v_row
  from public.applications
  where id = application_id
    and worker_id = auth.uid()
    and status = 'screening_submitted'
    and application_kit_requested_at is not null
    and application_kit_submitted_at is null;

  if not found then
    raise exception 'Application kit request not found';
  end if;

  select * into v_worker
  from public.worker_profiles
  where id = auth.uid();

  if not found then
    raise exception 'Worker profile not found';
  end if;

  select display_name into v_display_name
  from public.profiles
  where id = auth.uid();

  v_row := public.apply_worker_application_kit_snapshot(
    v_row,
    v_worker,
    v_display_name,
    cover_message
  );

  return v_row;
end;
$$;

revoke all on function public.request_application_kit(uuid) from public;
revoke all on function public.submit_requested_application_kit(uuid, text) from public;
revoke all on function public.apply_worker_application_kit_snapshot(public.applications, public.worker_profiles, text, text) from public;

grant execute on function public.request_application_kit(uuid) to authenticated;
grant execute on function public.submit_requested_application_kit(uuid, text) to authenticated;

-- Support numeric screening answers before seeding catalog questions.
alter table public.screening_question_catalog
  drop constraint if exists screening_question_catalog_question_type_check;

alter table public.screening_question_catalog
  add constraint screening_question_catalog_question_type_check
  check (question_type in ('yes_no', 'rating_1_5', 'number'));

alter table public.job_post_screening_questions
  drop constraint if exists job_post_screening_questions_question_type_check;

alter table public.job_post_screening_questions
  add constraint job_post_screening_questions_question_type_check
  check (question_type in ('yes_no', 'rating_1_5', 'number'));

-- Expand screening catalog with practical role-screening questions.
insert into public.screening_question_catalog (slug, question_type, prompt, category, sort_order, reverse_scored)
values
  (
    'years_experience_in_role',
    'number',
    'How many years of experience do you have in this role?',
    'qualifications',
    130,
    false
  ),
  (
    'provincial_certification_training',
    'yes_no',
    'Do you have the proper certification or training required for this role in {{province}}?',
    'qualifications',
    140,
    false
  ),
  (
    'currently_employed_dental',
    'yes_no',
    'Are you currently working in a dental practice?',
    'qualifications',
    150,
    false
  ),
  (
    'weeks_notice_to_start',
    'number',
    'If hired, how many weeks of notice do you need before you can start?',
    'qualifications',
    160,
    false
  ),
  (
    'reliable_schedule',
    'yes_no',
    'Can you reliably maintain the schedule required for this role?',
    'qualifications',
    170,
    false
  )
on conflict (slug) do nothing;
