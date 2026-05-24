-- Application kit: resume upload fields + snapshot on apply.

alter table public.worker_profiles
  add column if not exists resume_storage_path text,
  add column if not exists resume_file_name text,
  add column if not exists resume_uploaded_at timestamptz,
  add column if not exists default_cover_message text;

alter table public.applications
  add column if not exists resume_storage_path text;

create or replace function public.snapshot_application_on_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_worker public.worker_profiles%rowtype;
begin
  select * into v_worker from public.worker_profiles where id = new.worker_id;

  if found then
    new.years_of_experience := v_worker.years_of_experience;
    new.education := public.format_worker_education(v_worker);
    new.role_type := v_worker.role_type;
    new.license_type := null;
    new.resume_storage_path := v_worker.resume_storage_path;
  end if;

  new.match_score := public.compute_application_match_score(
    new.worker_id,
    new.job_post_id,
    new.shift_post_id
  );

  return new;
end;
$$;

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

-- Storage bucket for worker resumes (private).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'worker-resumes',
  'worker-resumes',
  false,
  5242880,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Workers manage their own resume folder.
drop policy if exists "Workers upload own resume" on storage.objects;
drop policy if exists "Workers update own resume" on storage.objects;
drop policy if exists "Workers read own resume" on storage.objects;
drop policy if exists "Workers delete own resume" on storage.objects;
drop policy if exists "Clinics read applicant resumes" on storage.objects;

create policy "Workers upload own resume"
  on storage.objects for insert
  with check (
    bucket_id = 'worker-resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Workers update own resume"
  on storage.objects for update
  using (
    bucket_id = 'worker-resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'worker-resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Workers read own resume"
  on storage.objects for select
  using (
    bucket_id = 'worker-resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Workers delete own resume"
  on storage.objects for delete
  using (
    bucket_id = 'worker-resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Clinics read resumes for applicants to their posts.
create policy "Clinics read applicant resumes"
  on storage.objects for select
  using (
    bucket_id = 'worker-resumes'
    and exists (
      select 1
      from public.applications a
      join public.clinic_profiles cp on cp.id = auth.uid()
      left join public.job_posts jp on jp.id = a.job_post_id
      left join public.shift_posts sp on sp.id = a.shift_post_id
      where a.worker_id::text = (storage.foldername(name))[1]
        and a.resume_storage_path = name
        and (
          (jp.clinic_id = cp.id)
          or (sp.clinic_id = cp.id)
        )
    )
  );
