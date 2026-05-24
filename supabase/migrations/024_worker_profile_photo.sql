-- Optional worker profile photo, snapshotted on application insert.

alter table public.worker_profiles
  add column if not exists photo_storage_path text,
  add column if not exists photo_uploaded_at timestamptz;

alter table public.applications
  add column if not exists worker_photo_storage_path text;

create or replace function public.format_worker_address(p_worker public.worker_profiles)
returns text
language sql immutable as $$
  select nullif(
    trim(both ', ' from concat_ws(
      ', ',
      nullif(trim(p_worker.address_line1), ''),
      nullif(trim(p_worker.address_line2), ''),
      nullif(trim(p_worker.city), ''),
      nullif(trim(p_worker.province), ''),
      nullif(trim(p_worker.postal_code), '')
    )),
    ''
  );
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'worker-photos',
  'worker-photos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Workers upload own photo" on storage.objects;
drop policy if exists "Workers update own photo" on storage.objects;
drop policy if exists "Workers read own photo" on storage.objects;
drop policy if exists "Workers delete own photo" on storage.objects;
drop policy if exists "Clinics read applicant photos" on storage.objects;

create policy "Workers upload own photo"
  on storage.objects for insert
  with check (
    bucket_id = 'worker-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Workers update own photo"
  on storage.objects for update
  using (
    bucket_id = 'worker-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Workers read own photo"
  on storage.objects for select
  using (
    bucket_id = 'worker-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Workers delete own photo"
  on storage.objects for delete
  using (
    bucket_id = 'worker-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Clinics read applicant photos"
  on storage.objects for select
  using (
    bucket_id = 'worker-photos'
    and exists (
      select 1
      from public.applications a
      join public.clinic_profiles cp on cp.id = auth.uid()
      left join public.job_posts jp on jp.id = a.job_post_id
      left join public.shift_posts sp on sp.id = a.shift_post_id
      where a.worker_id::text = (storage.foldername(name))[1]
        and a.worker_photo_storage_path = name
        and (
          (jp.clinic_id = cp.id)
          or (sp.clinic_id = cp.id)
        )
    )
  );

create or replace function public.snapshot_application_on_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_worker public.worker_profiles%rowtype;
  v_display_name text;
begin
  select * into v_worker from public.worker_profiles where id = new.worker_id;

  if found then
    select display_name into v_display_name
    from public.profiles
    where id = new.worker_id;

    new.years_of_experience := v_worker.years_of_experience;
    new.education := public.format_worker_education(v_worker);
    new.role_type := v_worker.role_type;
    new.license_type := null;
    new.resume_storage_path := v_worker.resume_storage_path;
    new.software_used := coalesce(v_worker.software_used, '{}');
    new.practice_types := coalesce(v_worker.practice_types, '{}');
    new.worker_display_name := nullif(trim(v_display_name), '');
    new.worker_address := public.format_worker_address(v_worker);
    new.worker_photo_storage_path := v_worker.photo_storage_path;
  end if;

  new.match_score := public.compute_application_match_score(
    new.worker_id,
    new.job_post_id,
    new.shift_post_id
  );

  return new;
end;
$$;

update public.applications a
set worker_photo_storage_path = w.photo_storage_path
from public.worker_profiles w
where a.worker_id = w.id
  and a.worker_photo_storage_path is null
  and w.photo_storage_path is not null;

drop policy if exists "Workers insert own applications" on public.applications;

create policy "Workers insert own applications"
  on public.applications for insert
  with check (
    auth.uid() = worker_id
    and status = 'applied'
    and match_score is null
    and years_of_experience is null
    and education is null
    and role_type is null
    and license_type is null
    and resume_storage_path is null
    and software_used = '{}'
    and practice_types = '{}'
    and worker_display_name is null
    and worker_address is null
    and worker_photo_storage_path is null
    and (
      (
        job_post_id is not null
        and shift_post_id is null
        and exists (
          select 1 from public.job_posts
          where job_posts.id = job_post_id and job_posts.status = 'live'
        )
      )
      or (
        shift_post_id is not null
        and job_post_id is null
        and exists (
          select 1 from public.shift_posts
          where shift_posts.id = shift_post_id and shift_posts.status = 'live'
        )
      )
    )
  );
