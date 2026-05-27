-- Clear server-managed match fields before computing job match on insert.
-- Prevents client-supplied match_tier/match_breakdown from persisting when
-- compute_job_match returns null (e.g. missing worker profile or job post).

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
