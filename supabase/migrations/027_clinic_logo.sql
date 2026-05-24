-- Optional clinic logo for the clinic profile tab.

alter table public.clinic_profiles
  add column if not exists logo_storage_path text,
  add column if not exists logo_uploaded_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinic-logos',
  'clinic-logos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Clinics upload own logo" on storage.objects;
drop policy if exists "Clinics update own logo" on storage.objects;
drop policy if exists "Clinics read own logo" on storage.objects;
drop policy if exists "Clinics delete own logo" on storage.objects;

create policy "Clinics upload own logo"
  on storage.objects for insert
  with check (
    bucket_id = 'clinic-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Clinics update own logo"
  on storage.objects for update
  using (
    bucket_id = 'clinic-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'clinic-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Clinics read own logo"
  on storage.objects for select
  using (
    bucket_id = 'clinic-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Clinics delete own logo"
  on storage.objects for delete
  using (
    bucket_id = 'clinic-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
