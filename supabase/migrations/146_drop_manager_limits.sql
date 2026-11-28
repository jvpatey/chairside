-- Remove manager limits. Each clinic or group is one login with no manager seats,
-- so billing no longer reports or caps managers.
--
-- What this does:
--   1. Redefines get_clinic_billing_state without manager_count, max_managers and
--      can_add_manager. Everything else in the payload is unchanged from 104.
--   2. Drops the manager helpers that only billing and the retired invite guards used:
--      get_clinic_active_manager_count, get_clinic_manager_count, clinic_max_managers.
--
-- clinic_memberships rows and the 'manager' role check are kept (see 145).

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
  v_max_locations int;
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
  v_max_locations := public.clinic_max_locations(v_plan, v_account_type);
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
    'current_period_end', v_period_end
  );
end;
$$;

drop function if exists public.get_clinic_active_manager_count(uuid);
drop function if exists public.get_clinic_manager_count(uuid);
drop function if exists public.clinic_max_managers(text, text);
