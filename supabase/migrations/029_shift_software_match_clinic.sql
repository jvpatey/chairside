-- Fill-in shifts do not store software on shift_posts; match against clinic profile software.

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

  if v_worker.role_type is not null and v_worker.role_type = v_post_role then
    v_role_fit := 'strong';
  elsif v_worker.role_type is not null then
    v_role_fit := 'partial';
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
