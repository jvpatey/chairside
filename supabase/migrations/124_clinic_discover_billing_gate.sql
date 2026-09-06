-- Harden Clinic Discover: worker-only live listing RLS, org-aware feature
-- resolution, and paid-plan Discover RPCs.

-- ---------------------------------------------------------------------------
-- 1. Resolve billing org for owners and invited managers
-- ---------------------------------------------------------------------------

create or replace function public.resolve_clinic_billing_org_id(p_user_id uuid default auth.uid())
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.get_clinic_organization_id_for_user(p_user_id),
    case
      when exists (
        select 1 from public.profiles p
        where p.id = p_user_id and p.role = 'clinic'
      ) then p_user_id
      else null
    end
  );
$$;

create or replace function public.clinic_can_use_feature(p_clinic_id uuid, p_feature text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_billing_id uuid := coalesce(
    public.get_clinic_organization_id_for_user(p_clinic_id),
    p_clinic_id
  );
  v_plan text := public.get_clinic_plan(v_billing_id);
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
-- 2. Workers-only public live listing (clinics use Discover RPCs)
-- ---------------------------------------------------------------------------

drop policy if exists "Workers read live job posts" on public.job_posts;
create policy "Workers read live job posts"
  on public.job_posts for select
  using (
    status = 'live'
    and clinic_account_deleted_at is null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'worker'
    )
  );

drop policy if exists "Workers read live shift posts" on public.shift_posts;
create policy "Workers read live shift posts"
  on public.shift_posts for select
  using (
    status = 'live'
    and clinic_account_deleted_at is null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'worker'
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Discover RPCs (assert clinic_discover on the caller's org)
-- ---------------------------------------------------------------------------

create or replace function public.list_clinic_discover_job_posts(p_province text)
returns setof public.job_posts
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.resolve_clinic_billing_org_id();
begin
  if v_org_id is null then
    raise exception 'Only clinics can use Discover.';
  end if;

  perform public.assert_clinic_can_use_feature(v_org_id, 'clinic_discover');

  return query
  select jp.*
  from public.job_posts jp
  join public.clinic_profiles cp on cp.id = jp.clinic_id
  where jp.status = 'live'
    and jp.clinic_account_deleted_at is null
    and cp.province = p_province
    and cp.setup_completed_at is not null
    and coalesce(jp.organization_id, jp.clinic_id) is distinct from v_org_id
    and jp.clinic_id is distinct from v_org_id
  order by jp.created_at desc;
end;
$$;

create or replace function public.list_clinic_discover_shift_posts(p_province text)
returns setof public.shift_posts
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.resolve_clinic_billing_org_id();
begin
  if v_org_id is null then
    raise exception 'Only clinics can use Discover.';
  end if;

  perform public.assert_clinic_can_use_feature(v_org_id, 'clinic_discover');

  return query
  select sp.*
  from public.shift_posts sp
  join public.clinic_profiles cp on cp.id = sp.clinic_id
  where sp.status = 'live'
    and sp.clinic_account_deleted_at is null
    and sp.shift_date >= current_date
    and cp.province = p_province
    and cp.setup_completed_at is not null
    and coalesce(sp.organization_id, sp.clinic_id) is distinct from v_org_id
    and sp.clinic_id is distinct from v_org_id
  order by sp.shift_date, sp.created_at;
end;
$$;

create or replace function public.get_clinic_discover_job_post(p_job_id uuid)
returns setof public.job_posts
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.resolve_clinic_billing_org_id();
begin
  if v_org_id is null then
    raise exception 'Only clinics can use Discover.';
  end if;

  perform public.assert_clinic_can_use_feature(v_org_id, 'clinic_discover');

  return query
  select jp.*
  from public.job_posts jp
  where jp.id = p_job_id
    and jp.status = 'live'
    and jp.clinic_account_deleted_at is null
    and coalesce(jp.organization_id, jp.clinic_id) is distinct from v_org_id
    and jp.clinic_id is distinct from v_org_id;
end;
$$;

create or replace function public.get_clinic_discover_shift_post(p_shift_id uuid)
returns setof public.shift_posts
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.resolve_clinic_billing_org_id();
begin
  if v_org_id is null then
    raise exception 'Only clinics can use Discover.';
  end if;

  perform public.assert_clinic_can_use_feature(v_org_id, 'clinic_discover');

  return query
  select sp.*
  from public.shift_posts sp
  where sp.id = p_shift_id
    and sp.status = 'live'
    and sp.clinic_account_deleted_at is null
    and sp.shift_date >= current_date
    and coalesce(sp.organization_id, sp.clinic_id) is distinct from v_org_id
    and sp.clinic_id is distinct from v_org_id;
end;
$$;

revoke all on function public.resolve_clinic_billing_org_id(uuid) from public;
grant execute on function public.resolve_clinic_billing_org_id(uuid) to authenticated;

revoke all on function public.list_clinic_discover_job_posts(text) from public;
grant execute on function public.list_clinic_discover_job_posts(text) to authenticated;

revoke all on function public.list_clinic_discover_shift_posts(text) from public;
grant execute on function public.list_clinic_discover_shift_posts(text) to authenticated;

revoke all on function public.get_clinic_discover_job_post(uuid) from public;
grant execute on function public.get_clinic_discover_job_post(uuid) to authenticated;

revoke all on function public.get_clinic_discover_shift_post(uuid) from public;
grant execute on function public.get_clinic_discover_shift_post(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Group Pro insights: query real location columns; require org membership
-- ---------------------------------------------------------------------------

create or replace function public.get_clinic_hiring_insights(
  p_clinic_id uuid default auth.uid(),
  p_location_ids uuid[] default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_billing_id uuid := coalesce(
    public.get_clinic_organization_id_for_user(p_clinic_id),
    p_clinic_id
  );
  v_plan text;
  v_result jsonb;
  v_by_location jsonb := '[]'::jsonb;
begin
  if p_clinic_id is null then
    raise exception 'Not authenticated';
  end if;

  if auth.uid() is distinct from v_billing_id
     and not public.is_clinic_org_member(v_billing_id) then
    raise exception 'Not authorized';
  end if;

  if not public.clinic_can_use_feature(v_billing_id, 'hiring_insights') then
    raise exception 'Hiring insights require a Pro plan.';
  end if;

  v_plan := public.get_clinic_plan(v_billing_id);
  v_result := public.compute_clinic_hiring_insights_snapshot(v_billing_id, p_location_ids);

  if v_plan = 'group_pro' then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'location_id', cl.id,
          'location_name', cl.name,
          'metrics', public.compute_clinic_hiring_insights_snapshot(v_billing_id, array[cl.id])
        )
        order by cl.name
      ),
      '[]'::jsonb
    )
    into v_by_location
    from public.clinic_locations cl
    where cl.organization_id = v_billing_id
      and cl.is_active = true
      and (
        p_location_ids is null
        or coalesce(array_length(p_location_ids, 1), 0) = 0
        or cl.id = any(p_location_ids)
      );
  end if;

  return v_result || jsonb_build_object('by_location', v_by_location);
end;
$$;
