-- Phase A: Clinic + Group plan family plumbing.
-- Extends plans with group_starter / group_pro, feature flags, location/manager caps,
-- and Starter posting limits (5/5). UI gating for new features lands in Phase B.

-- ---------------------------------------------------------------------------
-- 1. Allow new plan values on clinic_subscriptions
-- ---------------------------------------------------------------------------

alter table public.clinic_subscriptions
  drop constraint if exists clinic_subscriptions_plan_check;

alter table public.clinic_subscriptions
  add constraint clinic_subscriptions_plan_check
  check (plan in ('free', 'starter', 'pro', 'group_starter', 'group_pro'));

-- ---------------------------------------------------------------------------
-- 2. Plan rank helper (higher wins)
-- ---------------------------------------------------------------------------

create or replace function public.clinic_plan_rank(p_plan text)
returns int
language sql
immutable
as $$
  select case p_plan
    when 'group_pro' then 5
    when 'group_starter' then 4
    when 'pro' then 3
    when 'starter' then 2
    else 1
  end;
$$;

-- ---------------------------------------------------------------------------
-- 3. get_clinic_plan — prefer highest ranked active subscription
-- ---------------------------------------------------------------------------

create or replace function public.get_clinic_plan(p_clinic_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select s.plan
      from public.clinic_subscriptions s
      where s.clinic_id = p_clinic_id
        and s.status in ('active', 'trialing', 'grace_period', 'cancelled')
        and (s.current_period_end is null or s.current_period_end > now())
      order by public.clinic_plan_rank(s.plan) desc
      limit 1
    ),
    'free'
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. Posting limits — Starter / Group Starter = 5; Pro tiers unlimited
-- ---------------------------------------------------------------------------

create or replace function public.clinic_active_role_limit(p_plan text)
returns int
language sql
immutable
as $$
  select case p_plan
    when 'pro' then 2147483647
    when 'group_pro' then 2147483647
    when 'starter' then 5
    when 'group_starter' then 5
    else 1
  end;
$$;

create or replace function public.clinic_active_fill_in_limit(p_plan text)
returns int
language sql
immutable
as $$
  select case p_plan
    when 'pro' then 2147483647
    when 'group_pro' then 2147483647
    when 'starter' then 5
    when 'group_starter' then 5
    else 1
  end;
$$;

create or replace function public.clinic_active_opportunity_limit(p_plan text)
returns int
language sql
immutable
as $$
  select public.clinic_active_role_limit(p_plan);
$$;

-- ---------------------------------------------------------------------------
-- 5. Location / manager caps
-- ---------------------------------------------------------------------------

create or replace function public.clinic_account_type(p_clinic_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select o.account_type
      from public.clinic_organizations o
      where o.id = p_clinic_id
    ),
    (
      select cp.account_type
      from public.clinic_profiles cp
      where cp.id = p_clinic_id
    ),
    'individual'
  );
$$;

create or replace function public.clinic_max_locations(p_plan text, p_account_type text default 'individual')
returns int
language sql
immutable
as $$
  select case
    when p_plan = 'group_pro' then 2147483647
    when p_plan = 'group_starter' then 5
    when p_plan = 'free' and p_account_type = 'group' then 2
    when p_plan in ('starter', 'pro') then 1
    else 1
  end;
$$;

create or replace function public.clinic_max_managers(p_plan text, p_account_type text default 'individual')
returns int
language sql
immutable
as $$
  select case
    when p_plan = 'group_pro' then 2147483647
    when p_plan = 'group_starter' then 3
    when p_plan = 'free' and p_account_type = 'group' then 1
    when p_account_type = 'individual' then 0
    else 0
  end;
$$;

create or replace function public.get_clinic_location_count(p_clinic_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.clinic_locations l
  where l.organization_id = p_clinic_id;
$$;

create or replace function public.get_clinic_manager_count(p_clinic_id uuid)
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

create or replace function public.clinic_custom_screening_limit(p_plan text)
returns int
language sql
immutable
as $$
  select case p_plan
    when 'pro' then 2147483647
    when 'group_pro' then 2147483647
    when 'starter' then 5
    when 'group_starter' then 5
    else 0
  end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Feature matrix (Phase A plumbing; UI gates in Phase B)
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
         'clinic_discover',
         'general_candidate_messaging' then
      return v_plan in ('starter', 'pro', 'group_starter', 'group_pro');
    when 'priority_listing',
         'bulk_outreach',
         'hiring_insights' then
      return v_plan in ('pro', 'group_pro');
    else
      return false;
  end case;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Billing state JSON — includes new flags + org caps
-- ---------------------------------------------------------------------------

create or replace function public.get_clinic_billing_state(p_clinic_id uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid := p_clinic_id;
  v_plan text;
  v_status text := 'active';
  v_count int;
  v_period_end timestamptz;
  v_role_count int;
  v_fill_in_count int;
  v_role_limit int;
  v_fill_in_limit int;
  v_can_publish_role boolean;
  v_can_publish_fill_in boolean;
  v_account_type text;
  v_location_count int;
  v_manager_count int;
  v_max_locations int;
  v_max_managers int;
  v_screening_limit int;
  v_plan_family text;
begin
  if v_clinic_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles where id = v_clinic_id and role = 'clinic'
  ) then
    raise exception 'Only clinics can read billing state';
  end if;

  select s.plan, s.status, s.current_period_end
  into v_plan, v_status, v_period_end
  from public.clinic_subscriptions s
  where s.clinic_id = v_clinic_id
    and s.status in ('active', 'trialing', 'grace_period', 'cancelled')
    and (s.current_period_end is null or s.current_period_end > now())
  order by public.clinic_plan_rank(s.plan) desc
  limit 1;

  if not found then
    v_plan := 'free';
    v_status := 'active';
    v_period_end := null;
  end if;

  v_account_type := public.clinic_account_type(v_clinic_id);
  v_plan_family := case
    when v_plan in ('group_starter', 'group_pro') then 'group'
    when v_account_type = 'group' then 'group'
    else 'clinic'
  end;

  v_role_count := public.get_clinic_active_role_count(v_clinic_id);
  v_fill_in_count := public.get_clinic_active_fill_in_count(v_clinic_id);
  v_count := v_role_count + v_fill_in_count;
  v_role_limit := public.clinic_active_role_limit(v_plan);
  v_fill_in_limit := public.clinic_active_fill_in_limit(v_plan);

  if v_role_limit >= 2147483647 then
    v_can_publish_role := true;
    v_can_publish_fill_in := true;
  else
    v_can_publish_role := v_role_count < v_role_limit;
    v_can_publish_fill_in := v_fill_in_count < v_fill_in_limit;
  end if;

  v_location_count := public.get_clinic_location_count(v_clinic_id);
  v_manager_count := public.get_clinic_manager_count(v_clinic_id);
  v_max_locations := public.clinic_max_locations(v_plan, v_account_type);
  v_max_managers := public.clinic_max_managers(v_plan, v_account_type);
  v_screening_limit := public.clinic_custom_screening_limit(v_plan);

  return jsonb_build_object(
    'plan', v_plan,
    'plan_family', v_plan_family,
    'account_type', v_account_type,
    'status', v_status,
    'active_role_count', v_role_count,
    'active_role_limit', case when v_role_limit >= 2147483647 then null else v_role_limit end,
    'active_fill_in_count', v_fill_in_count,
    'active_fill_in_limit', case when v_fill_in_limit >= 2147483647 then null else v_fill_in_limit end,
    'can_publish_role', v_can_publish_role,
    'can_publish_fill_in', v_can_publish_fill_in,
    'active_opportunity_count', v_count,
    'active_opportunity_limit', null,
    'can_publish_opportunity', v_can_publish_role or v_can_publish_fill_in,
    'can_use_fill_in_outreach', public.clinic_can_use_feature(v_clinic_id, 'fill_in_outreach'),
    'can_use_fill_in_sms', public.clinic_can_use_feature(v_clinic_id, 'fill_in_sms'),
    'has_priority_listing', public.clinic_can_use_feature(v_clinic_id, 'priority_listing'),
    'can_use_screening_questions', public.clinic_can_use_feature(v_clinic_id, 'screening_questions'),
    'can_use_crm_followups', public.clinic_can_use_feature(v_clinic_id, 'crm_followups'),
    'can_use_application_pdf_export', public.clinic_can_use_feature(v_clinic_id, 'application_pdf_export'),
    'can_use_clinic_discover', public.clinic_can_use_feature(v_clinic_id, 'clinic_discover'),
    'can_use_general_candidate_messaging', public.clinic_can_use_feature(v_clinic_id, 'general_candidate_messaging'),
    'can_use_bulk_outreach', public.clinic_can_use_feature(v_clinic_id, 'bulk_outreach'),
    'can_use_hiring_insights', public.clinic_can_use_feature(v_clinic_id, 'hiring_insights'),
    'custom_screening_limit', case when v_screening_limit >= 2147483647 then null else v_screening_limit end,
    'location_count', v_location_count,
    'max_locations', case when v_max_locations >= 2147483647 then null else v_max_locations end,
    'can_add_location', v_max_locations >= 2147483647 or v_location_count < v_max_locations,
    'manager_count', v_manager_count,
    'max_managers', case when v_max_managers >= 2147483647 then null else v_max_managers end,
    'can_add_manager', v_max_managers >= 2147483647 or v_manager_count < v_max_managers,
    'current_period_end', v_period_end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Plan map + upsert accept group plans
-- ---------------------------------------------------------------------------

create or replace function public.get_clinic_plan_map(p_clinic_ids uuid[])
returns table (clinic_id uuid, plan text)
language sql
stable
security definer
set search_path = public
as $$
  with ids as (
    select distinct unnest(p_clinic_ids) as clinic_id
  )
  select
    i.clinic_id,
    coalesce(
      (
        select s.plan
        from public.clinic_subscriptions s
        where s.clinic_id = i.clinic_id
          and s.status in ('active', 'trialing', 'grace_period', 'cancelled')
          and (s.current_period_end is null or s.current_period_end > now())
        order by public.clinic_plan_rank(s.plan) desc
        limit 1
      ),
      'free'
    ) as plan
  from ids i;
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

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function public.clinic_plan_rank(text) from public;
grant execute on function public.clinic_plan_rank(text) to authenticated;

revoke all on function public.clinic_account_type(uuid) from public;
grant execute on function public.clinic_account_type(uuid) to authenticated;

revoke all on function public.clinic_max_locations(text, text) from public;
grant execute on function public.clinic_max_locations(text, text) to authenticated;

revoke all on function public.clinic_max_managers(text, text) from public;
grant execute on function public.clinic_max_managers(text, text) to authenticated;

revoke all on function public.get_clinic_location_count(uuid) from public;
grant execute on function public.get_clinic_location_count(uuid) to authenticated;

revoke all on function public.get_clinic_manager_count(uuid) from public;
grant execute on function public.get_clinic_manager_count(uuid) to authenticated;

revoke all on function public.clinic_custom_screening_limit(text) from public;
grant execute on function public.clinic_custom_screening_limit(text) to authenticated;
