-- Storage cleanup must use the Storage API (edge function), not SQL deletes
-- on storage.objects. Re-apply deactivate_clinic_account without storage.objects DML.

create or replace function public.deactivate_clinic_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_org_id uuid;
  v_membership_id uuid;
  v_membership_role text;
  v_is_owner boolean := false;
begin
  select m.id, m.organization_id, m.role
  into v_membership_id, v_org_id, v_membership_role
  from public.clinic_memberships m
  where m.user_id = p_user_id
    and m.status = 'active'
  order by case when m.role = 'owner' then 0 else 1 end, m.created_at
  limit 1;

  if v_org_id is null then
    select o.id
    into v_org_id
    from public.clinic_organizations o
    where o.id = p_user_id;
  end if;

  v_is_owner :=
    coalesce(v_membership_role, '') = 'owner'
    or (
      v_membership_id is null
      and (
        exists (
          select 1 from public.clinic_organizations o where o.id = p_user_id
        )
        or exists (
          select 1 from public.clinic_profiles cp where cp.id = p_user_id
        )
      )
    );

  if v_is_owner then
    v_org_id := coalesce(v_org_id, p_user_id);

    update public.applications a
    set
      clinic_name = coalesce(a.clinic_name, cp.clinic_name),
      clinic_city = coalesce(a.clinic_city, cp.city),
      clinic_province = coalesce(a.clinic_province, cp.province),
      clinic_logo_storage_path = null,
      updated_at = v_now
    from public.clinic_profiles cp
    where cp.id = v_org_id
      and (
        (a.job_post_id is not null and exists (
          select 1 from public.job_posts jp
          where jp.id = a.job_post_id
            and (jp.clinic_id = v_org_id or jp.organization_id = v_org_id)
        ))
        or (a.shift_post_id is not null and exists (
          select 1 from public.shift_posts sp
          where sp.id = a.shift_post_id
            and (sp.clinic_id = v_org_id or sp.organization_id = v_org_id)
        ))
      );

    update public.clinic_profiles
    set
      practice_doctors = '[]'::jsonb,
      organization_id = null,
      updated_at = v_now
    where id = v_org_id
       or organization_id = v_org_id;

    update public.job_posts
    set
      status = 'closed',
      clinic_account_deleted_at = v_now,
      description = null,
      benefits = null,
      schedule = null,
      organization_id = null,
      location_id = null,
      posted_by_membership_id = null,
      updated_at = v_now
    where (clinic_id = v_org_id or organization_id = v_org_id)
      and clinic_account_deleted_at is null;

    update public.job_posts
    set
      organization_id = null,
      location_id = null,
      posted_by_membership_id = null,
      updated_at = v_now
    where clinic_id = v_org_id
       or organization_id = v_org_id;

    update public.shift_posts
    set
      status = 'closed',
      clinic_account_deleted_at = v_now,
      description = null,
      organization_id = null,
      location_id = null,
      posted_by_membership_id = null,
      updated_at = v_now
    where (clinic_id = v_org_id or organization_id = v_org_id)
      and clinic_account_deleted_at is null;

    update public.shift_posts
    set
      organization_id = null,
      location_id = null,
      posted_by_membership_id = null,
      updated_at = v_now
    where clinic_id = v_org_id
       or organization_id = v_org_id;

    update public.applications a
    set
      status = 'rejected',
      clinic_account_deleted_at = v_now,
      updated_at = v_now
    where a.clinic_account_deleted_at is null
      and a.status in (
        'applied',
        'reviewed',
        'in_progress',
        'interview_offered',
        'interview_scheduled'
      )
      and (
        (a.job_post_id is not null and exists (
          select 1 from public.job_posts jp
          where jp.id = a.job_post_id
            and jp.clinic_id = v_org_id
        ))
        or (a.shift_post_id is not null and exists (
          select 1 from public.shift_posts sp
          where sp.id = a.shift_post_id
            and sp.clinic_id = v_org_id
        ))
      );

    update public.applications a
    set
      clinic_account_deleted_at = coalesce(a.clinic_account_deleted_at, v_now),
      clinic_logo_storage_path = null,
      updated_at = v_now
    where a.clinic_account_deleted_at is null
      and (
        (a.job_post_id is not null and exists (
          select 1 from public.job_posts jp
          where jp.id = a.job_post_id
            and jp.clinic_id = v_org_id
        ))
        or (a.shift_post_id is not null and exists (
          select 1 from public.shift_posts sp
          where sp.id = a.shift_post_id
            and sp.clinic_id = v_org_id
        ))
      );

    update public.conversations
    set
      clinic_account_deleted_at = v_now,
      messaging_closed_at = coalesce(messaging_closed_at, v_now),
      last_message_preview = case
        when last_sender_id = p_user_id then '[Message removed]'
        else last_message_preview
      end,
      updated_at = v_now
    where clinic_id = v_org_id
      and clinic_account_deleted_at is null;

    delete from public.clinic_invitations
    where organization_id = v_org_id;

    delete from public.clinic_member_location_assignments
    where membership_id in (
      select m.id from public.clinic_memberships m where m.organization_id = v_org_id
    );

    delete from public.clinic_memberships
    where organization_id = v_org_id;

    delete from public.clinic_locations
    where organization_id = v_org_id;

    delete from public.clinic_organizations
    where id = v_org_id;
  elsif v_membership_id is not null then
    update public.job_posts
    set
      posted_by_membership_id = null,
      updated_at = v_now
    where posted_by_membership_id = v_membership_id;

    update public.shift_posts
    set
      posted_by_membership_id = null,
      updated_at = v_now
    where posted_by_membership_id = v_membership_id;

    delete from public.clinic_member_location_assignments
    where membership_id = v_membership_id;

    delete from public.clinic_memberships
    where id = v_membership_id;
  else
    update public.job_posts
    set
      status = 'closed',
      clinic_account_deleted_at = coalesce(clinic_account_deleted_at, v_now),
      organization_id = null,
      location_id = null,
      posted_by_membership_id = null,
      description = null,
      benefits = null,
      schedule = null,
      updated_at = v_now
    where clinic_id = p_user_id;

    update public.shift_posts
    set
      status = 'closed',
      clinic_account_deleted_at = coalesce(clinic_account_deleted_at, v_now),
      organization_id = null,
      location_id = null,
      posted_by_membership_id = null,
      description = null,
      updated_at = v_now
    where clinic_id = p_user_id;

    update public.clinic_profiles
    set
      organization_id = null,
      practice_doctors = '[]'::jsonb,
      updated_at = v_now
    where id = p_user_id;
  end if;

  update public.messages
  set body = '[Message removed]'
  where sender_id = p_user_id;
end;
$$;

revoke all on function public.deactivate_clinic_account(uuid) from public;
grant execute on function public.deactivate_clinic_account(uuid) to service_role;
