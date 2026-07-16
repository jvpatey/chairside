-- Optional photo per clinic location (group accounts).

alter table public.clinic_locations
  add column if not exists logo_storage_path text,
  add column if not exists logo_uploaded_at timestamptz;

comment on column public.clinic_locations.logo_storage_path is
  'Optional location photo in clinic-logos bucket. Path: {organization_id}/locations/{location_id}/logo.*';

-- Workers may read location logos for clinics they can already see.
drop policy if exists "Workers read clinic logos for visible clinics" on storage.objects;

create policy "Workers read clinic logos for visible clinics"
  on storage.objects for select
  using (
    bucket_id = 'clinic-logos'
    and (
      exists (
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
      or exists (
        select 1
        from public.clinic_locations cl
        where cl.logo_storage_path = name
          and cl.organization_id::text = (storage.foldername(name))[1]
          and (
            exists (
              select 1
              from public.job_posts jp
              where jp.organization_id = cl.organization_id
                and (jp.location_id = cl.id or jp.location_id is null)
                and jp.status = 'live'
            )
            or exists (
              select 1
              from public.shift_posts sp
              where sp.organization_id = cl.organization_id
                and (sp.location_id = cl.id or sp.location_id is null)
                and sp.status = 'live'
            )
            or exists (
              select 1
              from public.applications a
              join public.job_posts jp2 on jp2.id = a.job_post_id
              where jp2.organization_id = cl.organization_id
                and a.worker_id = auth.uid()
            )
            or exists (
              select 1
              from public.applications a
              join public.shift_posts sp2 on sp2.id = a.shift_post_id
              where sp2.organization_id = cl.organization_id
                and a.worker_id = auth.uid()
            )
          )
      )
    )
  );
