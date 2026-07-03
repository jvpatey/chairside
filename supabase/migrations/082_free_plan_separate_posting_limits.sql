-- Free plan: 1 active role and 1 active fill-in (counted separately).
-- Starter: 3 active roles and 3 active fill-ins (counted separately). Pro: unlimited.

create or replace function public.get_clinic_active_role_count(
  p_clinic_id uuid,
  p_exclude_job_id uuid default null
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.job_posts jp
  where jp.clinic_id = p_clinic_id
    and jp.status = 'live'
    and (p_exclude_job_id is null or jp.id <> p_exclude_job_id);
$$;

create or replace function public.get_clinic_active_fill_in_count(
  p_clinic_id uuid,
  p_exclude_shift_id uuid default null
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.shift_posts sp
  where sp.clinic_id = p_clinic_id
    and sp.status = 'live'
    and sp.shift_date >= current_date
    and (p_exclude_shift_id is null or sp.id <> p_exclude_shift_id);
$$;

create or replace function public.get_clinic_active_opportunity_count(p_clinic_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select public.get_clinic_active_role_count(p_clinic_id)
       + public.get_clinic_active_fill_in_count(p_clinic_id);
$$;

create or replace function public.clinic_active_role_limit(p_plan text)
returns int
language sql
immutable
as $$
  select case p_plan
    when 'pro' then 2147483647
    when 'starter' then 3
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
    when 'starter' then 3
    else 1
  end;
$$;

create or replace function public.assert_clinic_can_publish_opportunity(
  p_clinic_id uuid,
  p_exclude_job_id uuid default null,
  p_exclude_shift_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_role_limit int;
  v_fill_in_limit int;
  v_role_count int;
  v_fill_in_count int;
begin
  v_plan := public.get_clinic_plan(p_clinic_id);
  v_role_limit := public.clinic_active_role_limit(v_plan);
  v_fill_in_limit := public.clinic_active_fill_in_limit(v_plan);

  if v_role_limit >= 2147483647 then
    return;
  end if;

  if p_exclude_shift_id is not null and p_exclude_job_id is null then
    v_fill_in_count := public.get_clinic_active_fill_in_count(p_clinic_id, p_exclude_shift_id);
    if v_fill_in_count >= v_fill_in_limit then
      raise exception 'Active fill-in limit reached. Upgrade your plan to publish more fill-ins.';
    end if;
    return;
  end if;

  v_role_count := public.get_clinic_active_role_count(p_clinic_id, p_exclude_job_id);
  if v_role_count >= v_role_limit then
    raise exception 'Active role limit reached. Upgrade your plan to publish more roles.';
  end if;
end;
$$;

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
  order by case s.plan when 'pro' then 3 when 'starter' then 2 else 1 end desc
  limit 1;

  if not found then
    v_plan := 'free';
    v_status := 'active';
    v_period_end := null;
  end if;

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

  return jsonb_build_object(
    'plan', v_plan,
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
    'current_period_end', v_period_end
  );
end;
$$;

revoke all on function public.get_clinic_active_role_count(uuid, uuid) from public;
grant execute on function public.get_clinic_active_role_count(uuid, uuid) to authenticated;

revoke all on function public.get_clinic_active_fill_in_count(uuid, uuid) from public;
grant execute on function public.get_clinic_active_fill_in_count(uuid, uuid) to authenticated;

revoke all on function public.clinic_active_role_limit(text) from public;
grant execute on function public.clinic_active_role_limit(text) to authenticated;

revoke all on function public.clinic_active_fill_in_limit(text) from public;
grant execute on function public.clinic_active_fill_in_limit(text) to authenticated;
