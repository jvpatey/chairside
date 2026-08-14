-- Open inquiries: worker opt-in, clinic directory, clinic-started general threads,
-- live plan checks on list/start, and clear inbound flag on paid → Free.

-- ---------------------------------------------------------------------------
-- 1. Worker opt-in
-- ---------------------------------------------------------------------------

alter table public.worker_profiles
  add column if not exists accepts_general_clinic_messages boolean not null default false;

comment on column public.worker_profiles.accepts_general_clinic_messages is
  'When true, Pro clinics in the same province can start an open inquiry without an application.';

-- ---------------------------------------------------------------------------
-- 2. Feature gate: Open inquiries is Pro / Group Pro only
-- ---------------------------------------------------------------------------

create or replace function public.clinic_can_use_feature(p_clinic_id uuid, p_feature text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plan text := public.get_clinic_plan(p_clinic_id);
begin
  case p_feature
    when 'fill_in_outreach',
         'fill_in_sms',
         'screening_questions',
         'crm_followups',
         'application_pdf_export',
         'clinic_discover' then
      return v_plan in ('starter', 'pro', 'group_starter', 'group_pro');
    when 'priority_listing',
         'bulk_outreach',
         'hiring_insights',
         'general_candidate_messaging' then
      return v_plan in ('pro', 'group_pro');
    else
      return false;
  end case;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Feature gate copy + downgrade clears clinic inbound flag
-- ---------------------------------------------------------------------------

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
      raise exception 'Open inquiries require a Pro plan.';
    else
      raise exception 'This feature requires a paid clinic plan.';
  end case;
end;
$$;

create or replace function public.upsert_clinic_subscription(
  p_clinic_id uuid,
  p_plan text,
  p_status text,
  p_current_period_end timestamptz default null,
  p_provider_customer_id text default null
)
returns public.clinic_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.clinic_subscriptions;
begin
  if p_plan not in ('free', 'starter', 'pro', 'group_starter', 'group_pro') then
    raise exception 'Invalid clinic plan';
  end if;

  if p_status not in ('active', 'trialing', 'grace_period', 'cancelled', 'expired') then
    raise exception 'Invalid subscription status';
  end if;

  insert into public.clinic_subscriptions (
    clinic_id,
    provider,
    provider_customer_id,
    plan,
    status,
    current_period_end,
    updated_at
  )
  values (
    p_clinic_id,
    'revenuecat',
    p_provider_customer_id,
    p_plan,
    p_status,
    p_current_period_end,
    now()
  )
  on conflict (clinic_id) do update
  set
    provider_customer_id = coalesce(excluded.provider_customer_id, clinic_subscriptions.provider_customer_id),
    plan = excluded.plan,
    status = excluded.status,
    current_period_end = excluded.current_period_end,
    updated_at = now()
  returning * into v_row;

  if not public.clinic_can_use_feature(p_clinic_id, 'general_candidate_messaging') then
    update public.clinic_profiles
    set
      accepts_general_candidate_messages = false,
      updated_at = now()
    where id = p_clinic_id
      and accepts_general_candidate_messages = true;
  end if;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Worker → clinic start: require live paid feature
-- ---------------------------------------------------------------------------

create or replace function public.get_or_create_general_conversation(p_clinic_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_worker_id uuid;
  v_worker_province text;
  v_clinic public.clinic_profiles%rowtype;
  v_conversation_id uuid;
begin
  v_worker_id := auth.uid();
  if v_worker_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_worker_id and role = 'worker'
  ) then
    raise exception 'Only workers can start open inquiries';
  end if;

  if not public.is_worker_profile_complete(v_worker_id) then
    raise exception 'Complete your profile before messaging clinics';
  end if;

  select province into v_worker_province
  from public.worker_profiles
  where id = v_worker_id;

  if v_worker_province is null then
    raise exception 'Worker province is required';
  end if;

  select * into v_clinic
  from public.clinic_profiles
  where id = p_clinic_id;

  if not found then
    raise exception 'Clinic not found';
  end if;

  if v_clinic.setup_completed_at is null then
    raise exception 'Clinic profile is not available';
  end if;

  if not v_clinic.accepts_general_candidate_messages
     or not public.clinic_can_use_feature(p_clinic_id, 'general_candidate_messaging') then
    raise exception 'This clinic is not accepting open inquiries';
  end if;

  if v_clinic.province is distinct from v_worker_province then
    raise exception 'Clinic is not in your province';
  end if;

  select id into v_conversation_id
  from public.conversations
  where worker_id = v_worker_id
    and clinic_id = p_clinic_id
    and conversation_type = 'general';

  if found then
    return v_conversation_id;
  end if;

  insert into public.conversations (
    worker_id,
    clinic_id,
    conversation_type,
    application_id
  )
  values (
    v_worker_id,
    p_clinic_id,
    'general',
    null
  )
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Worker list of messageable clinics: live plan, not DB flag alone
-- ---------------------------------------------------------------------------

create or replace function public.list_messageable_clinics_for_worker()
returns table (
  id uuid,
  clinic_name text,
  city text,
  province text,
  specialty text,
  description text,
  logo_storage_path text,
  existing_conversation_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_worker_id uuid;
  v_worker_province text;
begin
  v_worker_id := auth.uid();
  if v_worker_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_worker_id and role = 'worker'
  ) then
    raise exception 'Only workers can browse clinics';
  end if;

  if not public.is_worker_profile_complete(v_worker_id) then
    return;
  end if;

  select wp.province into v_worker_province
  from public.worker_profiles wp
  where wp.id = v_worker_id;

  if v_worker_province is null then
    return;
  end if;

  return query
  select
    cp.id,
    cp.clinic_name,
    cp.city,
    cp.province,
    cp.specialty,
    cp.description,
    cp.logo_storage_path,
    (
      select c.id
      from public.conversations c
      where c.worker_id = v_worker_id
        and c.clinic_id = cp.id
        and c.conversation_type = 'general'
      limit 1
    ) as existing_conversation_id
  from public.clinic_profiles cp
  where cp.accepts_general_candidate_messages = true
    and cp.setup_completed_at is not null
    and cp.province = v_worker_province
    and public.clinic_can_use_feature(cp.id, 'general_candidate_messaging')
  order by cp.clinic_name;
end;
$$;

revoke all on function public.list_messageable_clinics_for_worker() from public;
grant execute on function public.list_messageable_clinics_for_worker() to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Clinic directory + clinic-started open inquiry
-- ---------------------------------------------------------------------------

create or replace function public.list_open_inquiry_workers_for_clinic(
  p_role_type text default null
)
returns table (
  worker_id uuid,
  display_name text,
  role_types text[],
  city text,
  years_of_experience int,
  bio text,
  photo_storage_path text,
  existing_conversation_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_clinic_province text;
begin
  v_clinic_id := coalesce(
    public.get_clinic_organization_id_for_user(auth.uid()),
    case
      when exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'clinic'
      ) then auth.uid()
      else null
    end
  );

  if v_clinic_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.clinic_can_use_feature(v_clinic_id, 'general_candidate_messaging') then
    raise exception 'Open inquiries require a Pro plan.';
  end if;

  select cp.province into v_clinic_province
  from public.clinic_profiles cp
  where cp.id = v_clinic_id
    and cp.setup_completed_at is not null;

  if v_clinic_province is null then
    raise exception 'Complete your clinic profile before browsing candidates';
  end if;

  return query
  select
    wp.id as worker_id,
    coalesce(nullif(trim(p.display_name), ''), 'Candidate') as display_name,
    public.worker_role_types_resolved(wp.role_type, wp.role_types) as role_types,
    wp.city,
    wp.years_of_experience,
    wp.bio,
    wp.photo_storage_path,
    (
      select c.id
      from public.conversations c
      where c.conversation_type = 'general'
        and c.clinic_id = v_clinic_id
        and c.worker_id = wp.id
      limit 1
    ) as existing_conversation_id
  from public.worker_profiles wp
  join public.profiles p on p.id = wp.id and p.role = 'worker'
  where wp.setup_completed_at is not null
    and wp.accepts_general_clinic_messages = true
    and wp.province = v_clinic_province
    and wp.id <> v_clinic_id
    and (
      p_role_type is null
      or public.worker_role_matches_post(wp.role_type, wp.role_types, p_role_type)
    )
  order by wp.city nulls last, p.display_name nulls last;
end;
$$;

revoke all on function public.list_open_inquiry_workers_for_clinic(text) from public;
grant execute on function public.list_open_inquiry_workers_for_clinic(text) to authenticated;

create or replace function public.get_or_create_general_conversation_as_clinic(p_worker_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_clinic public.clinic_profiles%rowtype;
  v_worker public.worker_profiles%rowtype;
  v_conversation_id uuid;
begin
  v_clinic_id := coalesce(
    public.get_clinic_organization_id_for_user(auth.uid()),
    case
      when exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'clinic'
      ) then auth.uid()
      else null
    end
  );

  if v_clinic_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.clinic_can_use_feature(v_clinic_id, 'general_candidate_messaging') then
    raise exception 'Open inquiries require a Pro plan.';
  end if;

  select * into v_clinic
  from public.clinic_profiles
  where id = v_clinic_id;

  if not found or v_clinic.setup_completed_at is null then
    raise exception 'Complete your clinic profile before messaging candidates';
  end if;

  select * into v_worker
  from public.worker_profiles
  where id = p_worker_id;

  if not found then
    raise exception 'Candidate not found';
  end if;

  if v_worker.setup_completed_at is null then
    raise exception 'This candidate is not available';
  end if;

  if not v_worker.accepts_general_clinic_messages then
    raise exception 'This candidate is not accepting open inquiries';
  end if;

  if v_worker.province is distinct from v_clinic.province then
    raise exception 'Candidate is not in your province';
  end if;

  if not public.is_worker_profile_complete(p_worker_id) then
    raise exception 'This candidate is not available';
  end if;

  select id into v_conversation_id
  from public.conversations
  where worker_id = p_worker_id
    and clinic_id = v_clinic_id
    and conversation_type = 'general';

  if found then
    return v_conversation_id;
  end if;

  insert into public.conversations (
    worker_id,
    clinic_id,
    conversation_type,
    application_id
  )
  values (
    p_worker_id,
    v_clinic_id,
    'general',
    null
  )
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

revoke all on function public.get_or_create_general_conversation_as_clinic(uuid) from public;
grant execute on function public.get_or_create_general_conversation_as_clinic(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Send RLS: existing open inquiry stays open while clinic still has the perk
-- ---------------------------------------------------------------------------

create or replace function public.conversation_allows_message_send(p_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv public.conversations%rowtype;
  v_app_status text;
begin
  select * into v_conv
  from public.conversations
  where id = p_conversation_id;

  if not found then
    return false;
  end if;

  if auth.uid() is distinct from v_conv.worker_id
     and auth.uid() is distinct from v_conv.clinic_id
     and not public.is_clinic_org_member(v_conv.clinic_id) then
    return false;
  end if;

  if v_conv.messaging_closed_at is not null then
    return false;
  end if;

  if v_conv.worker_account_deleted_at is not null
     or v_conv.clinic_account_deleted_at is not null then
    return false;
  end if;

  if v_conv.conversation_type = 'application' then
    select a.status into v_app_status
    from public.applications a
    where a.id = v_conv.application_id
      and a.worker_account_deleted_at is null
      and a.clinic_account_deleted_at is null;

    if not found then
      return false;
    end if;

    return public.application_messaging_open(v_app_status);
  end if;

  if v_conv.conversation_type = 'general' then
    return public.clinic_can_use_feature(v_conv.clinic_id, 'general_candidate_messaging');
  end if;

  if v_conv.conversation_type = 'outreach' then
    return true;
  end if;

  return false;
end;
$$;
