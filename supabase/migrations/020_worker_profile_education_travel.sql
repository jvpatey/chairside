-- Structured education, travel radius ranges, remove license from application snapshot.

alter table public.worker_profiles
  add column if not exists education_graduation_year int,
  add column if not exists education_degree_type text,
  add column if not exists education_field text,
  add column if not exists education_institution text,
  add column if not exists travel_radius_range text
    check (
      travel_radius_range is null or travel_radius_range in (
        'under_10',
        '10_25',
        '25_50',
        '50_75',
        '75_100',
        'over_100'
      )
    );

update public.worker_profiles
set travel_radius_range = case
  when travel_radius_km is null then travel_radius_range
  when travel_radius_km <= 10 then 'under_10'
  when travel_radius_km <= 25 then '10_25'
  when travel_radius_km <= 50 then '25_50'
  when travel_radius_km <= 75 then '50_75'
  when travel_radius_km <= 100 then '75_100'
  else 'over_100'
end
where travel_radius_range is null and travel_radius_km is not null;

create or replace function public.travel_radius_range_max_km(p_range text)
returns int
language sql immutable as $$
  select case p_range
    when 'under_10' then 10
    when '10_25' then 25
    when '25_50' then 50
    when '50_75' then 75
    when '75_100' then 100
    when 'over_100' then 200
    else null
  end;
$$;

create or replace function public.format_worker_education(p_worker public.worker_profiles)
returns text
language sql immutable as $$
  select coalesce(
    nullif(
      trim(both from concat_ws(
        ' · ',
        nullif(trim(p_worker.education_degree_type), ''),
        nullif(trim(p_worker.education_field), ''),
        nullif(trim(p_worker.education_institution), ''),
        case
          when p_worker.education_graduation_year is not null
            then p_worker.education_graduation_year::text
          else null
        end
      )),
      ''
    ),
    nullif(trim(p_worker.education), '')
  );
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
    select sp.role_type, '{}'::text[], sp.clinic_id
    into v_post_role, v_post_software, v_clinic_id
    from public.shift_posts sp
    where sp.id = p_shift_post_id;
  end if;

  select * into v_clinic from public.clinic_profiles where id = v_clinic_id;

  v_distance := public.haversine_km(
    v_worker.latitude,
    v_worker.longitude,
    v_clinic.latitude,
    v_clinic.longitude
  );

  if v_worker.role_type is not null and v_worker.role_type = v_post_role then
    v_role_fit := 'strong';
  elsif v_worker.role_type is not null then
    v_role_fit := 'partial';
  else
    v_role_fit := 'missing';
  end if;

  v_post_software_count := coalesce(array_length(v_post_software, 1), 0);
  if v_post_software_count = 0 then
    v_software_fit := 'partial';
  else
    select count(*) into v_software_overlap
    from unnest(v_post_software) as ps(item)
    where ps.item = any(v_worker.software_used);

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

  return round(
    (
      public.match_level_score(v_role_fit)
      + public.match_level_score('partial')
      + public.match_level_score('partial')
      + public.match_level_score(v_location_fit)
      + public.match_level_score(v_software_fit)
    ) / 5.0
  );
end;
$$;

create or replace function public.snapshot_application_on_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_worker public.worker_profiles%rowtype;
begin
  select * into v_worker from public.worker_profiles where id = new.worker_id;

  if found then
    new.years_of_experience := v_worker.years_of_experience;
    new.education := public.format_worker_education(v_worker);
    new.role_type := v_worker.role_type;
    new.license_type := null;
  end if;

  new.match_score := public.compute_application_match_score(
    new.worker_id,
    new.job_post_id,
    new.shift_post_id
  );

  return new;
end;
$$;
