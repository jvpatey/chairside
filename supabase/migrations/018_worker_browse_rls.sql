-- Workers may read limited clinic profile fields for live listing display.
create policy "Workers read clinic profiles for listings"
  on public.clinic_profiles for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'worker'
    )
  );

-- Application snapshot columns copied from worker profile at apply time.
alter table public.applications
  add column years_of_experience int,
  add column education text,
  add column role_type text,
  add column license_type text;

-- Prevent duplicate applications per worker per post.
create unique index applications_worker_job_post_unique
  on public.applications (worker_id, job_post_id)
  where job_post_id is not null;

create unique index applications_worker_shift_post_unique
  on public.applications (worker_id, shift_post_id)
  where shift_post_id is not null;

-- Haversine distance in km between two lat/lng points.
create or replace function public.haversine_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
) returns double precision
language sql immutable as $$
  select case
    when lat1 is null or lon1 is null or lat2 is null or lon2 is null then null
    else (
      6371 * acos(
        least(
          1.0,
          greatest(
            -1.0,
            cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1))
            + sin(radians(lat1)) * sin(radians(lat2))
          )
        )
      )
    )
  end;
$$;

create or replace function public.match_level_score(level text)
returns numeric language sql immutable as $$
  select case level
    when 'strong' then 100
    when 'partial' then 60
    else 20
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
begin
  select * into v_worker from public.worker_profiles where id = p_worker_id;
  if not found then
    return 60;
  end if;

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

  if v_distance is null or v_worker.travel_radius_km is null then
    v_location_fit := 'partial';
  elsif v_distance <= v_worker.travel_radius_km then
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
    new.education := v_worker.education;
    new.role_type := v_worker.role_type;
    new.license_type := v_worker.license_type;
  end if;

  new.match_score := public.compute_application_match_score(
    new.worker_id,
    new.job_post_id,
    new.shift_post_id
  );

  return new;
end;
$$;

create trigger applications_snapshot_before_insert
  before insert on public.applications
  for each row execute function public.snapshot_application_on_insert();

-- Tighten INSERT policy: workers may not set server-managed snapshot fields.
drop policy if exists "Workers insert own applications" on public.applications;

create policy "Workers insert own applications"
  on public.applications for insert
  with check (
    auth.uid() = worker_id
    and status = 'applied'
    and match_score is null
    and years_of_experience is null
    and education is null
    and role_type is null
    and license_type is null
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
