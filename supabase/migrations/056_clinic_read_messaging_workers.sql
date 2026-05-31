-- Clinics need worker identity for general (non-application) message threads.

create policy "Clinics read profiles for messaging workers"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.worker_id = profiles.id
        and c.clinic_id = auth.uid()
    )
  );

create policy "Clinics read worker profiles for messaging"
  on public.worker_profiles for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.worker_id = worker_profiles.id
        and c.clinic_id = auth.uid()
    )
  );

create policy "Clinics read worker photos for messaging"
  on storage.objects for select
  using (
    bucket_id = 'worker-photos'
    and exists (
      select 1
      from public.conversations c
      join public.worker_profiles wp on wp.id = c.worker_id
      where c.clinic_id = auth.uid()
        and c.worker_id::text = (storage.foldername(name))[1]
        and wp.photo_storage_path = name
    )
  );
