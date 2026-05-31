-- Workers may read clinic logos for clinics they can see via live posts or applications.

drop policy if exists "Workers read clinic logos for visible clinics" on storage.objects;

create policy "Workers read clinic logos for visible clinics"
  on storage.objects for select
  using (
    bucket_id = 'clinic-logos'
    and exists (
      select 1
      from public.clinic_profiles cp
      where cp.id::text = (storage.foldername(name))[1]
        and cp.logo_storage_path = name
        and (
          exists (
            select 1
            from public.job_posts jp
            where jp.clinic_id = cp.id
              and jp.status = 'live'
          )
          or exists (
            select 1
            from public.shift_posts sp
            where sp.clinic_id = cp.id
              and sp.status = 'live'
          )
          or exists (
            select 1
            from public.applications a
            join public.job_posts jp2 on jp2.id = a.job_post_id
            where jp2.clinic_id = cp.id
              and a.worker_id = auth.uid()
          )
          or exists (
            select 1
            from public.applications a
            join public.shift_posts sp2 on sp2.id = a.shift_post_id
            where sp2.clinic_id = cp.id
              and a.worker_id = auth.uid()
          )
        )
    )
  );
