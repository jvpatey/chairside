-- Safe invitation preview (no token leaked) + explicit resend RPC.

create or replace function public.preview_clinic_manager_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.clinic_invitations;
  v_org_name text;
  v_inviter_name text;
  v_location_names text[];
begin
  if nullif(trim(p_token), '') is null then
    raise exception 'Invitation token is required';
  end if;

  select * into v_invite
  from public.clinic_invitations
  where token = trim(p_token);

  if v_invite.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_invite.status = 'accepted' then
    return jsonb_build_object('status', 'accepted');
  end if;

  if v_invite.status = 'revoked' then
    return jsonb_build_object('status', 'revoked');
  end if;

  if v_invite.status = 'expired' or v_invite.expires_at < now() then
    if v_invite.status = 'pending' then
      update public.clinic_invitations
      set status = 'expired', updated_at = now()
      where id = v_invite.id;
    end if;
    return jsonb_build_object('status', 'expired');
  end if;

  select coalesce(nullif(trim(o.name), ''), 'Clinic group') into v_org_name
  from public.clinic_organizations o
  where o.id = v_invite.organization_id;

  select coalesce(
    nullif(trim(p.display_name), ''),
    nullif(trim(cp.contact_name), ''),
    nullif(trim(cp.clinic_name), ''),
    'Clinic owner'
  )
  into v_inviter_name
  from public.clinic_invitations i
  left join public.profiles p on p.id = i.invited_by_user_id
  left join public.clinic_profiles cp on cp.id = i.organization_id
  where i.id = v_invite.id;

  select coalesce(array_agg(l.name order by l.name), '{}')
  into v_location_names
  from public.clinic_locations l
  where l.organization_id = v_invite.organization_id
    and l.is_active
    and (
      cardinality(v_invite.location_ids) = 0
      or l.id = any (v_invite.location_ids)
    );

  return jsonb_build_object(
    'status', 'pending',
    'email', v_invite.email,
    'display_name', v_invite.display_name,
    'title', v_invite.title,
    'organization_name', coalesce(v_org_name, 'Clinic group'),
    'inviter_name', coalesce(v_inviter_name, 'Clinic owner'),
    'location_names', to_jsonb(coalesce(v_location_names, '{}')),
    'expires_at', v_invite.expires_at
  );
end;
$$;

create or replace function public.resend_clinic_manager_invitation(p_invitation_id uuid)
returns public.clinic_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.clinic_invitations;
  v_invite public.clinic_invitations;
begin
  select * into v_existing
  from public.clinic_invitations
  where id = p_invitation_id;

  if v_existing.id is null then
    raise exception 'Invitation not found';
  end if;

  if auth.uid() is distinct from v_existing.organization_id
     and not public.is_clinic_org_owner(v_existing.organization_id) then
    raise exception 'Only the organization owner can resend invitations';
  end if;

  if v_existing.status <> 'pending' then
    raise exception 'Only pending invitations can be resent';
  end if;

  if v_existing.expires_at < now() then
    update public.clinic_invitations
    set status = 'expired', updated_at = now()
    where id = v_existing.id;
    raise exception 'Invitation has expired. Create a new invitation instead.';
  end if;

  -- Revoke the previous pending invite, then insert a fresh one (triggers email webhook).
  update public.clinic_invitations
  set status = 'revoked', updated_at = now()
  where id = v_existing.id;

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
    v_existing.organization_id,
    v_existing.email,
    v_existing.display_name,
    v_existing.title,
    'manager',
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    v_existing.location_ids,
    'pending',
    auth.uid(),
    now() + interval '7 days'
  )
  returning * into v_invite;

  return v_invite;
end;
$$;

grant execute on function public.preview_clinic_manager_invitation(text) to anon, authenticated;
grant execute on function public.resend_clinic_manager_invitation(uuid) to authenticated;
