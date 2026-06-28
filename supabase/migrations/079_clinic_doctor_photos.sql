-- Optional profile photos for doctors listed on clinic profiles.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinic-doctor-photos',
  'clinic-doctor-photos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Clinics upload own doctor photos" on storage.objects;
drop policy if exists "Clinics update own doctor photos" on storage.objects;
drop policy if exists "Clinics read own doctor photos" on storage.objects;
drop policy if exists "Clinics delete own doctor photos" on storage.objects;
drop policy if exists "Workers read clinic doctor photos for public profiles" on storage.objects;

create policy "Clinics upload own doctor photos"
  on storage.objects for insert
  with check (
    bucket_id = 'clinic-doctor-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Clinics update own doctor photos"
  on storage.objects for update
  using (
    bucket_id = 'clinic-doctor-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'clinic-doctor-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Clinics read own doctor photos"
  on storage.objects for select
  using (
    bucket_id = 'clinic-doctor-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Clinics delete own doctor photos"
  on storage.objects for delete
  using (
    bucket_id = 'clinic-doctor-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Workers read clinic doctor photos for public profiles"
  on storage.objects for select
  using (
    bucket_id = 'clinic-doctor-photos'
    and exists (
      select 1
      from public.clinic_profiles cp,
           jsonb_array_elements(cp.practice_doctors) as doctor
      where cp.id::text = (storage.foldername(name))[1]
        and cp.setup_completed_at is not null
        and doctor->>'photo_storage_path' = name
    )
  );

create or replace function public.deactivate_clinic_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
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

  delete from storage.objects
  where bucket_id = 'clinic-doctor-photos'
    and (storage.foldername(name))[1] = p_user_id::text;

  update public.clinic_profiles
  set
    practice_doctors = '[]'::jsonb,
    updated_at = v_now
  where id = p_user_id;

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
