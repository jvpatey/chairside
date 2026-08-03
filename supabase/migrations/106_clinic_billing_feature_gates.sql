-- Phase B: SQL hard guards for Free feature gates + Free group trial caps.
-- Error strings must stay aligned with packages/api/src/billing.ts isClinicBillingLimitError.

-- ---------------------------------------------------------------------------
-- 1. Count helpers (active locations; manager seats = active + pending invites)
-- ---------------------------------------------------------------------------

create or replace function public.get_clinic_location_count(p_clinic_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.clinic_locations l
  where l.organization_id = p_clinic_id
    and l.is_active = true;
$$;

create or replace function public.get_clinic_manager_count(p_clinic_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select (
    select count(*)::int
    from public.clinic_memberships m
    where m.organization_id = p_clinic_id
      and m.role = 'manager'
      and m.status = 'active'
  ) + (
    select count(*)::int
    from public.clinic_invitations i
    where i.organization_id = p_clinic_id
      and i.role = 'manager'
      and i.status = 'pending'
  );
$$;

-- Active managers only (used when accepting an invitation).
create or replace function public.get_clinic_active_manager_count(p_clinic_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.clinic_memberships m
  where m.organization_id = p_clinic_id
    and m.role = 'manager'
    and m.status = 'active';
$$;

-- ---------------------------------------------------------------------------
-- 2. Assert helpers
-- ---------------------------------------------------------------------------

create or replace function public.assert_clinic_can_add_location(p_clinic_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text := public.get_clinic_plan(p_clinic_id);
  v_account_type text := public.clinic_account_type(p_clinic_id);
  v_max int := public.clinic_max_locations(v_plan, v_account_type);
  v_count int := public.get_clinic_location_count(p_clinic_id);
begin
  if v_max >= 2147483647 then
    return;
  end if;

  if v_count >= v_max then
    raise exception 'Location limit reached. Upgrade your plan to add more locations.';
  end if;
end;
$$;

create or replace function public.assert_clinic_can_add_manager(p_clinic_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text := public.get_clinic_plan(p_clinic_id);
  v_account_type text := public.clinic_account_type(p_clinic_id);
  v_max int := public.clinic_max_managers(v_plan, v_account_type);
  v_count int := public.get_clinic_manager_count(p_clinic_id);
begin
  if v_max >= 2147483647 then
    return;
  end if;

  if v_count >= v_max then
    raise exception 'Manager limit reached. Upgrade your plan to invite more managers.';
  end if;
end;
$$;

create or replace function public.assert_clinic_can_accept_manager(p_clinic_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text := public.get_clinic_plan(p_clinic_id);
  v_account_type text := public.clinic_account_type(p_clinic_id);
  v_max int := public.clinic_max_managers(v_plan, v_account_type);
  v_count int := public.get_clinic_active_manager_count(p_clinic_id);
begin
  if v_max >= 2147483647 then
    return;
  end if;

  if v_count >= v_max then
    raise exception 'Manager limit reached. Upgrade your plan to invite more managers.';
  end if;
end;
$$;

create or replace function public.assert_clinic_can_use_feature(p_clinic_id uuid, p_feature text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.clinic_can_use_feature(p_clinic_id, p_feature) then
    return;
  end if;

  case p_feature
    when 'screening_questions' then
      raise exception 'Screening questions require a paid clinic plan.';
    when 'crm_followups' then
      raise exception 'CRM notes and follow-ups require a paid clinic plan.';
    when 'application_pdf_export' then
      raise exception 'Application PDF export requires a paid clinic plan.';
    when 'clinic_discover' then
      raise exception 'Clinic discover requires a paid clinic plan.';
    when 'general_candidate_messaging' then
      raise exception 'General candidate messaging requires a paid clinic plan.';
    else
      raise exception 'This feature requires a paid clinic plan.';
  end case;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Location insert / reactivate guard
-- ---------------------------------------------------------------------------

create or replace function public.enforce_clinic_location_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active is distinct from true then
    return new;
  end if;

  if tg_op = 'UPDATE' and coalesce(old.is_active, false) = true then
    return new;
  end if;

  perform public.assert_clinic_can_add_location(new.organization_id);
  return new;
end;
$$;

drop trigger if exists clinic_locations_enforce_billing_limit on public.clinic_locations;
create trigger clinic_locations_enforce_billing_limit
  before insert or update of is_active on public.clinic_locations
  for each row
  execute function public.enforce_clinic_location_limit();

-- ---------------------------------------------------------------------------
-- 4. Manager invite + accept guards
-- ---------------------------------------------------------------------------

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
  if auth.uid() is distinct from p_organization_id
     and not public.is_clinic_org_owner(p_organization_id) then
    raise exception 'Only the organization owner can invite managers';
  end if;

  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'A valid email is required';
  end if;

  -- Free the seat for re-invites to the same email before checking the cap.
  update public.clinic_invitations
  set status = 'revoked', updated_at = now()
  where organization_id = p_organization_id
    and lower(email) = v_email
    and status = 'pending';

  perform public.assert_clinic_can_add_manager(p_organization_id);

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

create or replace function public.accept_clinic_manager_invitation(p_token text)
returns public.clinic_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.clinic_invitations;
  v_membership public.clinic_memberships;
  v_location_id uuid;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to accept an invitation';
  end if;

  select * into v_invite
  from public.clinic_invitations
  where token = p_token
  for update;

  if v_invite.id is null then
    raise exception 'Invitation not found';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invitation is no longer pending';
  end if;

  if v_invite.expires_at < now() then
    update public.clinic_invitations
    set status = 'expired', updated_at = now()
    where id = v_invite.id;
    raise exception 'Invitation has expired';
  end if;

  if v_email = '' or lower(v_invite.email) <> v_email then
    raise exception 'Signed-in email does not match this invitation';
  end if;

  perform public.assert_clinic_can_accept_manager(v_invite.organization_id);

  insert into public.profiles (id, role, display_name, onboarding_completed_at, updated_at)
  values (
    auth.uid(),
    'clinic',
    coalesce(v_invite.display_name, split_part(v_invite.email, '@', 1)),
    now(),
    now()
  )
  on conflict (id) do update
  set
    role = 'clinic',
    display_name = coalesce(
      nullif(trim(excluded.display_name), ''),
      profiles.display_name
    ),
    onboarding_completed_at = coalesce(profiles.onboarding_completed_at, now()),
    updated_at = now();

  insert into public.clinic_memberships (
    organization_id, user_id, role, display_name, title, status, updated_at
  )
  values (
    v_invite.organization_id,
    auth.uid(),
    'manager',
    coalesce(v_invite.display_name, split_part(v_invite.email, '@', 1)),
    coalesce(v_invite.title, 'Manager'),
    'active',
    now()
  )
  on conflict (organization_id, user_id) do update
  set
    role = 'manager',
    status = 'active',
    display_name = coalesce(excluded.display_name, clinic_memberships.display_name),
    title = coalesce(excluded.title, clinic_memberships.title),
    updated_at = now()
  returning * into v_membership;

  delete from public.clinic_member_location_assignments
  where membership_id = v_membership.id;

  foreach v_location_id in array coalesce(v_invite.location_ids, '{}')
  loop
    if exists (
      select 1 from public.clinic_locations l
      where l.id = v_location_id
        and l.organization_id = v_invite.organization_id
    ) then
      insert into public.clinic_member_location_assignments (membership_id, location_id)
      values (v_membership.id, v_location_id)
      on conflict do nothing;
    end if;
  end loop;

  update public.clinic_invitations
  set
    status = 'accepted',
    accepted_by_user_id = auth.uid(),
    accepted_at = now(),
    updated_at = now()
  where id = v_invite.id;

  return v_membership;
end;
$$;

grant execute on function public.accept_clinic_manager_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Feature write-path guards
-- ---------------------------------------------------------------------------

create or replace function public.enforce_job_post_screening_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.screening_enabled is distinct from true then
    return new;
  end if;

  if tg_op = 'UPDATE' and coalesce(old.screening_enabled, false) = true then
    return new;
  end if;

  perform public.assert_clinic_can_use_feature(new.clinic_id, 'screening_questions');
  return new;
end;
$$;

drop trigger if exists job_posts_enforce_screening_billing on public.job_posts;
create trigger job_posts_enforce_screening_billing
  before insert or update of screening_enabled on public.job_posts
  for each row
  execute function public.enforce_job_post_screening_billing();

create or replace function public.enforce_screening_questions_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
begin
  select jp.clinic_id into v_clinic_id
  from public.job_posts jp
  where jp.id = new.job_post_id;

  if v_clinic_id is null then
    raise exception 'Job post not found for screening questions';
  end if;

  perform public.assert_clinic_can_use_feature(v_clinic_id, 'screening_questions');
  return new;
end;
$$;

drop trigger if exists job_post_screening_questions_enforce_billing on public.job_post_screening_questions;
create trigger job_post_screening_questions_enforce_billing
  before insert on public.job_post_screening_questions
  for each row
  execute function public.enforce_screening_questions_billing();

create or replace function public.enforce_clinic_worker_crm_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_clinic_can_use_feature(new.clinic_id, 'crm_followups');
  return new;
end;
$$;

drop trigger if exists clinic_worker_crm_enforce_billing on public.clinic_worker_crm;
create trigger clinic_worker_crm_enforce_billing
  before insert or update on public.clinic_worker_crm
  for each row
  execute function public.enforce_clinic_worker_crm_billing();

create or replace function public.enforce_general_candidate_messaging_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.accepts_general_candidate_messages is distinct from true then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and coalesce(old.accepts_general_candidate_messages, false) = true then
    return new;
  end if;

  perform public.assert_clinic_can_use_feature(new.id, 'general_candidate_messaging');
  return new;
end;
$$;

drop trigger if exists clinic_profiles_enforce_general_messaging_billing on public.clinic_profiles;
create trigger clinic_profiles_enforce_general_messaging_billing
  before insert or update of accepts_general_candidate_messages on public.clinic_profiles
  for each row
  execute function public.enforce_general_candidate_messaging_billing();

-- ---------------------------------------------------------------------------
-- 6. Grants
-- ---------------------------------------------------------------------------

revoke all on function public.assert_clinic_can_add_location(uuid) from public;
grant execute on function public.assert_clinic_can_add_location(uuid) to authenticated;

revoke all on function public.assert_clinic_can_add_manager(uuid) from public;
grant execute on function public.assert_clinic_can_add_manager(uuid) to authenticated;

revoke all on function public.assert_clinic_can_accept_manager(uuid) from public;
grant execute on function public.assert_clinic_can_accept_manager(uuid) to authenticated;

revoke all on function public.assert_clinic_can_use_feature(uuid, text) from public;
grant execute on function public.assert_clinic_can_use_feature(uuid, text) to authenticated;

revoke all on function public.get_clinic_active_manager_count(uuid) from public;
grant execute on function public.get_clinic_active_manager_count(uuid) to authenticated;
