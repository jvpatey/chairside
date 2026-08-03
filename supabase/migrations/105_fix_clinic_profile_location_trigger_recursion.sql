-- Break infinite trigger recursion between clinic_profiles and clinic_locations.
--
-- Loop was:
--   profile update → ensure_clinic_organization_for_profile → update primary location
--   → sync_clinic_profile_from_primary_location → update profile → … stack overflow
--
-- Fix: skip nested re-entrancy via pg_trigger_depth(), and only sync profile when
-- address fields actually change.

create or replace function public.ensure_clinic_organization_for_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_membership_id uuid;
begin
  v_org_id := coalesce(new.organization_id, new.id);
  new.organization_id := v_org_id;

  if tg_op = 'UPDATE' then
    new.account_type := coalesce(new.account_type, old.account_type, 'individual');
  else
    new.account_type := coalesce(new.account_type, 'individual');
  end if;

  insert into public.clinic_organizations (id, account_type, name, updated_at)
  values (
    v_org_id,
    new.account_type,
    coalesce(nullif(trim(new.clinic_name), ''), 'Clinic'),
    now()
  )
  on conflict (id) do update
  set
    account_type = case
      when clinic_organizations.account_type = 'group' then 'group'
      else excluded.account_type
    end,
    name = case
      when nullif(trim(excluded.name), '') is null then clinic_organizations.name
      else excluded.name
    end,
    updated_at = now();

  insert into public.clinic_memberships (
    organization_id, user_id, role, display_name, title, status, updated_at
  )
  values (
    v_org_id,
    new.id,
    'owner',
    coalesce(nullif(trim(new.contact_name), ''), nullif(trim(new.clinic_name), ''), 'Owner'),
    'Owner',
    'active',
    now()
  )
  on conflict (organization_id, user_id) do update
  set
    role = 'owner',
    status = 'active',
    display_name = coalesce(
      nullif(trim(excluded.display_name), ''),
      clinic_memberships.display_name
    ),
    updated_at = now()
  returning id into v_membership_id;

  -- Nested call from sync_clinic_profile_from_primary_location: keep org/membership
  -- in sync but do not write locations again (that re-fires the location trigger).
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.account_type = 'individual'
    and not exists (
      select 1 from public.clinic_locations l where l.organization_id = v_org_id
    )
  then
    insert into public.clinic_locations (
      organization_id,
      name,
      address_line1,
      address_line2,
      city,
      province,
      postal_code,
      latitude,
      longitude,
      phone,
      contact_name,
      specialty,
      software_used,
      operatories_count,
      team_size_range,
      is_primary,
      is_active
    )
    values (
      v_org_id,
      coalesce(nullif(trim(new.clinic_name), ''), 'Primary location'),
      new.address_line1,
      new.address_line2,
      new.city,
      coalesce(new.province, 'NS'),
      new.postal_code,
      new.latitude,
      new.longitude,
      new.phone,
      new.contact_name,
      coalesce(new.specialty, 'general'),
      coalesce(new.software_used, '{}'),
      new.operatories_count,
      new.team_size_range,
      true,
      true
    );
  elsif new.account_type = 'individual' then
    update public.clinic_locations
    set
      name = coalesce(nullif(trim(new.clinic_name), ''), name),
      address_line1 = coalesce(new.address_line1, address_line1),
      address_line2 = coalesce(new.address_line2, address_line2),
      city = coalesce(new.city, city),
      province = coalesce(new.province, province),
      postal_code = coalesce(new.postal_code, postal_code),
      latitude = coalesce(new.latitude, latitude),
      longitude = coalesce(new.longitude, longitude),
      phone = coalesce(new.phone, phone),
      contact_name = coalesce(new.contact_name, contact_name),
      specialty = coalesce(new.specialty, specialty),
      software_used = coalesce(new.software_used, software_used),
      operatories_count = coalesce(new.operatories_count, operatories_count),
      team_size_range = coalesce(new.team_size_range, team_size_range),
      updated_at = now()
    where organization_id = v_org_id
      and is_primary
      and (
        name is distinct from coalesce(nullif(trim(new.clinic_name), ''), name)
        or address_line1 is distinct from coalesce(new.address_line1, address_line1)
        or address_line2 is distinct from coalesce(new.address_line2, address_line2)
        or city is distinct from coalesce(new.city, city)
        or province is distinct from coalesce(new.province, province)
        or postal_code is distinct from coalesce(new.postal_code, postal_code)
        or latitude is distinct from coalesce(new.latitude, latitude)
        or longitude is distinct from coalesce(new.longitude, longitude)
        or phone is distinct from coalesce(new.phone, phone)
        or contact_name is distinct from coalesce(new.contact_name, contact_name)
        or specialty is distinct from coalesce(new.specialty, specialty)
        or software_used is distinct from coalesce(new.software_used, software_used)
        or operatories_count is distinct from coalesce(new.operatories_count, operatories_count)
        or team_size_range is distinct from coalesce(new.team_size_range, team_size_range)
      );
  end if;

  return new;
end;
$$;

create or replace function public.sync_clinic_profile_from_primary_location()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Nested call from ensure_clinic_organization_for_profile writing locations:
  -- do not write back to clinic_profiles (that re-enters ensure and overflows).
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.is_primary and new.is_active then
    update public.clinic_profiles
    set
      address_line1 = new.address_line1,
      address_line2 = new.address_line2,
      city = new.city,
      province = new.province,
      postal_code = new.postal_code,
      latitude = new.latitude,
      longitude = new.longitude,
      updated_at = now()
    where (organization_id = new.organization_id or id = new.organization_id)
      and (
        address_line1 is distinct from new.address_line1
        or address_line2 is distinct from new.address_line2
        or city is distinct from new.city
        or province is distinct from new.province
        or postal_code is distinct from new.postal_code
        or latitude is distinct from new.latitude
        or longitude is distinct from new.longitude
      );
  end if;

  return new;
end;
$$;
