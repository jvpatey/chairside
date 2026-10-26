-- Public (anon) read of live job/shift listings for SMS / share links.
-- Returns only safe preview fields — never admin_notes or private clinic data.

create or replace function public.get_public_listing(
  p_kind text,
  p_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_kind text := lower(trim(coalesce(p_kind, '')));
  v_row record;
  v_clinic_name text;
  v_city text;
  v_province text;
begin
  if p_id is null or v_kind not in ('shift', 'job') then
    return null;
  end if;

  if v_kind = 'shift' then
    select
      s.id,
      s.status,
      s.is_sourced,
      s.role_type,
      s.shift_date,
      s.start_time,
      s.end_time,
      s.compensation,
      s.urgency,
      s.description,
      s.display_clinic_name,
      s.display_city,
      s.display_province,
      s.contact_phone,
      s.contact_email,
      s.external_url,
      s.clinic_id,
      c.clinic_name as clinic_profile_name,
      c.city as clinic_profile_city,
      c.province as clinic_profile_province
    into v_row
    from public.shift_posts s
    left join public.clinic_profiles c on c.id = s.clinic_id
    where s.id = p_id
      and s.status = 'live';

    if not found then
      return null;
    end if;

    if v_row.is_sourced then
      v_clinic_name := nullif(trim(v_row.display_clinic_name), '');
      v_city := nullif(trim(v_row.display_city), '');
      v_province := nullif(trim(v_row.display_province), '');
    else
      v_clinic_name := nullif(trim(v_row.clinic_profile_name), '');
      v_city := nullif(trim(v_row.clinic_profile_city), '');
      v_province := nullif(trim(v_row.clinic_profile_province), '');
    end if;

    return jsonb_build_object(
      'kind', 'shift',
      'id', v_row.id,
      'status', v_row.status,
      'is_sourced', v_row.is_sourced,
      'role_type', v_row.role_type,
      'clinic_name', coalesce(v_clinic_name, 'Clinic'),
      'city', v_city,
      'province', v_province,
      'shift_date', v_row.shift_date,
      'start_time', v_row.start_time,
      'end_time', v_row.end_time,
      'compensation', v_row.compensation,
      'urgency', v_row.urgency,
      'description', v_row.description,
      'contact_phone', case when v_row.is_sourced then v_row.contact_phone else null end,
      'contact_email', case when v_row.is_sourced then v_row.contact_email else null end,
      'external_url', case when v_row.is_sourced then v_row.external_url else null end
    );
  end if;

  -- job
  select
    j.id,
    j.status,
    j.is_sourced,
    j.role_type,
    j.title,
    j.employment_type,
    j.wage_range,
    j.schedule,
    j.description,
    j.specialty,
    j.start_date,
    j.benefits,
    j.display_clinic_name,
    j.display_city,
    j.display_province,
    j.contact_phone,
    j.contact_email,
    j.external_url,
    j.clinic_id,
    c.clinic_name as clinic_profile_name,
    c.city as clinic_profile_city,
    c.province as clinic_profile_province
  into v_row
  from public.job_posts j
  left join public.clinic_profiles c on c.id = j.clinic_id
  where j.id = p_id
    and j.status = 'live';

  if not found then
    return null;
  end if;

  if v_row.is_sourced then
    v_clinic_name := nullif(trim(v_row.display_clinic_name), '');
    v_city := nullif(trim(v_row.display_city), '');
    v_province := nullif(trim(v_row.display_province), '');
  else
    v_clinic_name := nullif(trim(v_row.clinic_profile_name), '');
    v_city := nullif(trim(v_row.clinic_profile_city), '');
    v_province := nullif(trim(v_row.clinic_profile_province), '');
  end if;

  return jsonb_build_object(
    'kind', 'job',
    'id', v_row.id,
    'status', v_row.status,
    'is_sourced', v_row.is_sourced,
    'role_type', v_row.role_type,
    'clinic_name', coalesce(v_clinic_name, 'Clinic'),
    'city', v_city,
    'province', v_province,
    'title', v_row.title,
    'employment_type', v_row.employment_type,
    'wage_range', v_row.wage_range,
    'schedule', v_row.schedule,
    'description', v_row.description,
    'specialty', v_row.specialty,
    'start_date', v_row.start_date,
    'benefits', v_row.benefits,
    'contact_phone', case when v_row.is_sourced then v_row.contact_phone else null end,
    'contact_email', case when v_row.is_sourced then v_row.contact_email else null end,
    'external_url', case when v_row.is_sourced then v_row.external_url else null end
  );
end;
$$;

revoke all on function public.get_public_listing(text, uuid) from public;
grant execute on function public.get_public_listing(text, uuid) to anon, authenticated;
