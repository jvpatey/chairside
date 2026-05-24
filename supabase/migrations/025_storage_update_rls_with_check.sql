-- Enforce folder ownership on storage object updates (WITH CHECK on new row values).

drop policy if exists "Workers update own photo" on storage.objects;

create policy "Workers update own photo"
  on storage.objects for update
  using (
    bucket_id = 'worker-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'worker-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Workers update own resume" on storage.objects;

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
