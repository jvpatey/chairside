-- Open-role match tiers (role, software, location, employment type). No scoring for fill-ins.

alter table public.applications
  add column if not exists match_tier text
    check (match_tier is null or match_tier in ('strong', 'good', 'partial', 'none')),
  add column if not exists match_breakdown jsonb,
  add column if not exists preferred_employment_types text[] not null default '{}';

create or replace function public.score_employment_match(
  p_job_employment_type text,
  p_worker_preferred text[]
) returns text
language sql immutable set search_path = public as $$
  select case
    when coalesce(array_length(p_worker_preferred, 1), 0) = 0 then 'partial'
    when p_job_employment_type = any (p_worker_preferred) then 'strong'
    else 'missing'
  end;
$$;

create or replace function public.derive_job_match_tier(
  p_role_fit text,
  p_software_fit text,
  p_location_fit text,
  p_employment_fit text,
  p_post_has_matchable_software boolean
) returns text
language sql immutable set search_path = public as $$
  select case
    when p_role_fit = 'missing' or p_location_fit = 'missing' then 'none'
    when p_role_fit = 'strong'
      and p_location_fit = 'strong'
      and p_employment_fit = 'strong'
      and (
        p_software_fit = 'strong'
        or (p_software_fit = 'partial' and not p_post_has_matchable_software)
      ) then 'strong'
    when p_role_fit = 'strong'
      and p_location_fit in ('strong', 'partial')
      and (
        (case when p_software_fit = 'missing' then 1 else 0 end)
        + (case when p_employment_fit = 'missing' then 1 else 0 end)
      ) <= 1 then 'good'
    else 'partial'
  end;
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

  if v_worker.role_type is not null and v_worker.role_type = v_job.role_type then
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
        'workerRoleType', v_worker.role_type,
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

create or replace function public.snapshot_application_on_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_worker public.worker_profiles%rowtype;
  v_display_name text;
  v_job_match jsonb;
begin
  select * into v_worker from public.worker_profiles where id = new.worker_id;

  if found then
    select display_name into v_display_name
    from public.profiles
    where id = new.worker_id;

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
