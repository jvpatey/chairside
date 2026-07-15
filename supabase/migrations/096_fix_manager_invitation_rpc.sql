-- Fix manager invitation RPC: token generation + owner check during setup.

create or replace function public.create_clinic_manager_invitation(
  p_organization_id uuid,
  p_email text,
  p_display_name text default null,
  p_title text default null,
  p_location_ids uuid[] default '{}',
  p_expires_in_hours int default 168
)
returns public.clinic_invitations
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_invite public.clinic_invitations;
  v_email text := lower(trim(p_email));
begin
  -- Org id equals owner user id; also allow membership-based owner during setup.
  if auth.uid() is distinct from p_organization_id
     and not public.is_clinic_org_owner(p_organization_id) then
    raise exception 'Only the organization owner can invite managers';
  end if;

  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'A valid email is required';
  end if;

  -- Expire any existing pending invite for this email
  update public.clinic_invitations
  set status = 'revoked', updated_at = now()
  where organization_id = p_organization_id
    and lower(email) = v_email
    and status = 'pending';

  insert into public.clinic_invitations (
    organization_id,
    email,
    display_name,
    title,
    role,
    token,
    location_ids,
    status,
    invited_by_user_id,
    expires_at
  )
  values (
    p_organization_id,
    v_email,
    nullif(trim(p_display_name), ''),
    nullif(trim(p_title), ''),
    'manager',
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    coalesce(p_location_ids, '{}'),
    'pending',
    auth.uid(),
    now() + make_interval(hours => greatest(p_expires_in_hours, 1))
  )
  returning * into v_invite;

  return v_invite;
end;
$$;

grant execute on function public.create_clinic_manager_invitation(uuid, text, text, text, uuid[], int)
  to authenticated;
