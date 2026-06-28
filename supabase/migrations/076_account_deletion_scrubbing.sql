-- Deepen PII scrubbing during account deletion while preserving marketplace history.

create or replace function public.deactivate_worker_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  -- Close active applications.
  update public.applications
  set
    status = 'rejected',
    worker_account_deleted_at = v_now,
    worker_display_name = null,
    cover_message = null,
    education = null,
    years_of_experience = null,
    license_type = null,
    worker_address = null,
    resume_storage_path = null,
    worker_photo_storage_path = null,
    software_used = '{}',
    practice_types = '{}',
    preferred_employment_types = '{}',
    interview_at = null,
    interview_duration_minutes = null,
    interview_details = null,
    interview_proposed_at = null,
    interview_proposed_duration_minutes = null,
    interview_proposed_details = null,
    interview_proposed_by = null,
    updated_at = v_now
  where worker_id = p_user_id
    and status in (
      'applied',
      'reviewed',
      'in_progress',
      'interview_offered',
      'interview_scheduled'
    );

  -- Mark retained applications and scrub contact PII.
  update public.applications
  set
    worker_account_deleted_at = coalesce(worker_account_deleted_at, v_now),
    worker_display_name = null,
    cover_message = null,
    education = null,
    years_of_experience = null,
    license_type = null,
    worker_address = null,
    resume_storage_path = null,
    worker_photo_storage_path = null,
    software_used = '{}',
    practice_types = '{}',
    preferred_employment_types = '{}',
    interview_details = null,
    interview_proposed_details = null,
    updated_at = v_now
  where worker_id = p_user_id
    and worker_account_deleted_at is null;

  delete from public.application_screening_answers asa
  using public.applications a
  where asa.application_id = a.id
    and a.worker_id = p_user_id;

  update public.messages
  set body = '[Message removed]'
  where sender_id = p_user_id;

  update public.conversations
  set
    worker_account_deleted_at = v_now,
    messaging_closed_at = coalesce(messaging_closed_at, v_now),
    last_message_preview = case
      when last_sender_id = p_user_id then '[Message removed]'
      else last_message_preview
    end,
    updated_at = v_now
  where worker_id = p_user_id
    and worker_account_deleted_at is null;
end;
$$;

create or replace function public.deactivate_clinic_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  -- Snapshot clinic on applications before profile removal.
  update public.applications a
  set
    clinic_name = coalesce(a.clinic_name, cp.clinic_name),
    clinic_city = coalesce(a.clinic_city, cp.city),
    clinic_province = coalesce(a.clinic_province, cp.province),
    clinic_logo_storage_path = null,
    updated_at = v_now
  from public.clinic_profiles cp
  where cp.id = p_user_id
    and (
      (a.job_post_id is not null and exists (
        select 1 from public.job_posts jp
        where jp.id = a.job_post_id and jp.clinic_id = p_user_id
      ))
      or (a.shift_post_id is not null and exists (
        select 1 from public.shift_posts sp
        where sp.id = a.shift_post_id and sp.clinic_id = p_user_id
      ))
    );

  -- Close live posts and remove free-text clinic content from retained posts.
  update public.job_posts
  set
    status = 'closed',
    clinic_account_deleted_at = v_now,
    description = null,
    benefits = null,
    schedule = null,
    updated_at = v_now
  where clinic_id = p_user_id
    and clinic_account_deleted_at is null;

  update public.shift_posts
  set
    status = 'closed',
    clinic_account_deleted_at = v_now,
    description = null,
    updated_at = v_now
  where clinic_id = p_user_id
    and clinic_account_deleted_at is null;

  -- Reject active applications to this clinic's posts.
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
        where jp.id = a.job_post_id and jp.clinic_id = p_user_id
      ))
      or (a.shift_post_id is not null and exists (
        select 1 from public.shift_posts sp
        where sp.id = a.shift_post_id and sp.clinic_id = p_user_id
      ))
    );

  -- Mark retained applications.
  update public.applications a
  set
    clinic_account_deleted_at = coalesce(a.clinic_account_deleted_at, v_now),
    clinic_logo_storage_path = null,
    updated_at = v_now
  where a.clinic_account_deleted_at is null
    and (
      (a.job_post_id is not null and exists (
        select 1 from public.job_posts jp
        where jp.id = a.job_post_id and jp.clinic_id = p_user_id
      ))
      or (a.shift_post_id is not null and exists (
        select 1 from public.shift_posts sp
        where sp.id = a.shift_post_id and sp.clinic_id = p_user_id
      ))
    );

  update public.messages
  set body = '[Message removed]'
  where sender_id = p_user_id;

  update public.conversations
  set
    clinic_account_deleted_at = v_now,
    messaging_closed_at = coalesce(messaging_closed_at, v_now),
    last_message_preview = case
      when last_sender_id = p_user_id then '[Message removed]'
      else last_message_preview
    end,
    updated_at = v_now
  where clinic_id = p_user_id
    and clinic_account_deleted_at is null;
end;
$$;
