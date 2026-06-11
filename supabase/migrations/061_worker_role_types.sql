-- Multi-role candidate profiles: store qualified professional roles as text[].

alter table public.worker_profiles
  add column if not exists role_types text[] not null default '{}';

alter table public.applications
  add column if not exists role_types text[] not null default '{}';

alter table public.worker_profiles
  drop constraint if exists worker_profiles_role_types_check;

alter table public.worker_profiles
  add constraint worker_profiles_role_types_check
  check (
    role_types <@ array[
      'hygienist',
      'assistant',
      'admin',
      'office_manager',
      'treatment_coordinator',
      'dentist',
      'other'
    ]::text[]
  );

alter table public.applications
  drop constraint if exists applications_role_types_check;

alter table public.applications
  add constraint applications_role_types_check
  check (
    role_types <@ array[
      'hygienist',
      'assistant',
      'admin',
      'office_manager',
      'treatment_coordinator',
      'dentist',
      'other'
    ]::text[]
  );

update public.worker_profiles
set role_types = array[role_type]
where role_type is not null
  and role_types = '{}'::text[];

update public.applications
set role_types = array[role_type]
where role_type is not null
  and role_types = '{}'::text[];

create or replace function public.worker_role_types_resolved(
  p_role_type text,
  p_role_types text[]
) returns text[]
language sql immutable set search_path = public as $$
  select case
    when coalesce(array_length(p_role_types, 1), 0) > 0 then p_role_types
    when p_role_type is not null then array[p_role_type]
    else '{}'::text[]
  end;
$$;

create or replace function public.worker_role_matches_post(
  p_role_type text,
  p_role_types text[],
  p_post_role text
) returns boolean
language sql immutable set search_path = public as $$
  select p_post_role = any(public.worker_role_types_resolved(p_role_type, p_role_types));
$$;

create or replace function public.compute_job_match(
  p_worker_id uuid,
  p_job_post_id uuid
) returns jsonb
language plpgsql stable set search_path = public as $$
declare
  v_worker public.worker_profiles%rowtype;
  v_job public.job_posts%rowtype;
  v_clinic public.clinic_profiles%rowtype;
  v_distance double precision;
  v_travel_max int;
  v_role_fit text;
  v_software_fit text;
  v_location_fit text;
  v_employment_fit text;
  v_software_overlap int;
  v_post_software_count int;
  v_post_has_matchable_software boolean;
  v_tier text;
  v_worker_role_types text[];
begin
  select * into v_worker from public.worker_profiles where id = p_worker_id;
  if not found then
    return null;
  end if;

  select * into v_job from public.job_posts where id = p_job_post_id;
  if not found then
    return null;
  end if;

  select * into v_clinic from public.clinic_profiles where id = v_job.clinic_id;

  v_travel_max := coalesce(
    public.travel_radius_range_max_km(v_worker.travel_radius_range),
    v_worker.travel_radius_km
  );

  v_distance := public.haversine_km(
    v_worker.latitude,
    v_worker.longitude,
    v_clinic.latitude,
    v_clinic.longitude
  );

  v_worker_role_types := public.worker_role_types_resolved(v_worker.role_type, v_worker.role_types);

  if public.worker_role_matches_post(v_worker.role_type, v_worker.role_types, v_job.role_type) then
    v_role_fit := 'strong';
  else
    v_role_fit := 'missing';
  end if;

  v_post_software_count := public.software_matchable_count(v_job.software_used);
  v_post_has_matchable_software := v_post_software_count > 0;

  if v_post_software_count = 0 then
    v_software_fit := 'partial';
  else
    v_software_overlap := public.software_overlap_count(v_job.software_used, v_worker.software_used);

    if v_software_overlap = v_post_software_count then
      v_software_fit := 'strong';
    elsif v_software_overlap > 0 then
      v_software_fit := 'partial';
    else
      v_software_fit := 'missing';
    end if;
  end if;

  if v_distance is null or v_travel_max is null then
    v_location_fit := 'partial';
  elsif v_distance <= v_travel_max then
    v_location_fit := 'strong';
  else
    v_location_fit := 'missing';
  end if;

  v_employment_fit := public.score_employment_match(
    v_job.employment_type,
    coalesce(v_worker.preferred_employment_types, '{}'::text[])
  );

  v_tier := public.derive_job_match_tier(
    v_role_fit,
    v_software_fit,
    v_location_fit,
    v_employment_fit,
    v_post_has_matchable_software
  );

  return jsonb_build_object(
    'tier', v_tier,
    'breakdown', jsonb_build_object(
      'roleFit', v_role_fit,
      'software', v_software_fit,
      'location', v_location_fit,
      'employmentType', v_employment_fit,
      'postHasMatchableSoftware', v_post_has_matchable_software,
      'context', jsonb_build_object(
        'postRoleType', v_job.role_type,
        'workerRoleType', v_worker_role_types[1],
        'workerRoleTypes', v_worker_role_types,
        'postEmploymentType', v_job.employment_type,
        'workerPreferredEmploymentTypes', coalesce(v_worker.preferred_employment_types, '{}'::text[]),
        'postSoftware', coalesce(v_job.software_used, '{}'::text[]),
        'workerSoftware', coalesce(v_worker.software_used, '{}'::text[]),
        'distanceKm', v_distance,
        'workerTravelRadiusKm', v_travel_max
      )
    )
  );
end;
$$;

create or replace function public.compute_application_match_score(
  p_worker_id uuid,
  p_job_post_id uuid,
  p_shift_post_id uuid
) returns numeric
language plpgsql stable set search_path = public as $$
declare
  v_worker public.worker_profiles%rowtype;
  v_clinic public.clinic_profiles%rowtype;
  v_post_role text;
  v_post_software text[];
  v_clinic_id uuid;
  v_distance double precision;
  v_role_fit text;
  v_software_fit text;
  v_location_fit text;
  v_software_overlap int;
  v_post_software_count int;
  v_travel_max int;
begin
  select * into v_worker from public.worker_profiles where id = p_worker_id;
  if not found then
    return 60;
  end if;

  v_travel_max := coalesce(
    public.travel_radius_range_max_km(v_worker.travel_radius_range),
    v_worker.travel_radius_km
  );

  if p_job_post_id is not null then
    select jp.role_type, jp.software_used, jp.clinic_id
    into v_post_role, v_post_software, v_clinic_id
    from public.job_posts jp
    where jp.id = p_job_post_id;
  else
    select sp.role_type, sp.clinic_id
    into v_post_role, v_clinic_id
    from public.shift_posts sp
    where sp.id = p_shift_post_id;
  end if;

  select * into v_clinic from public.clinic_profiles where id = v_clinic_id;

  if p_shift_post_id is not null then
    v_post_software := coalesce(v_clinic.software_used, '{}'::text[]);
  end if;

  v_distance := public.haversine_km(
    v_worker.latitude,
    v_worker.longitude,
    v_clinic.latitude,
    v_clinic.longitude
  );

  if public.worker_role_matches_post(v_worker.role_type, v_worker.role_types, v_post_role) then
    v_role_fit := 'strong';
  else
    v_role_fit := 'missing';
  end if;

  v_post_software_count := public.software_matchable_count(v_post_software);
  if v_post_software_count = 0 then
    v_software_fit := 'partial';
  else
    v_software_overlap := public.software_overlap_count(v_post_software, v_worker.software_used);

    if v_software_overlap = v_post_software_count then
      v_software_fit := 'strong';
    elsif v_software_overlap > 0 then
      v_software_fit := 'partial';
    else
      v_software_fit := 'missing';
    end if;
  end if;

  if v_distance is null or v_travel_max is null then
    v_location_fit := 'partial';
  elsif v_distance <= v_travel_max then
    v_location_fit := 'strong';
  else
    v_location_fit := 'missing';
  end if;

  return case
    when v_role_fit = 'strong' and v_software_fit = 'strong' and v_location_fit = 'strong' then 100
    when v_role_fit = 'missing' or v_location_fit = 'missing' then 40
    when v_role_fit = 'strong' then 85
    else 60
  end;
end;
$$;

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
  v_role_types text[];
begin
  v_role_types := public.worker_role_types_resolved(p_worker.role_type, p_worker.role_types);

  update public.applications
  set
    cover_message = nullif(trim(coalesce(p_cover_message, p_application.cover_message)), ''),
    years_of_experience = p_worker.years_of_experience,
    education = public.format_worker_education(p_worker),
    role_type = v_role_types[1],
    role_types = v_role_types,
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

  return new;
end;
$$;

comment on column public.worker_profiles.role_types is
  'Professional roles the worker is qualified for (multi-select).';

comment on column public.applications.role_types is
  'Snapshot of worker role_types at application time.';
