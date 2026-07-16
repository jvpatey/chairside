-- Per-member bio + photo for clinic group owners/managers.

alter table public.clinic_memberships
  add column if not exists bio text,
  add column if not exists photo_storage_path text,
  add column if not exists photo_uploaded_at timestamptz;

comment on column public.clinic_memberships.photo_storage_path is
  'Optional member photo in clinic-member-photos bucket. Path: {organization_id}/members/{membership_id}/profile.*';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinic-member-photos',
  'clinic-member-photos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members upload own photo" on storage.objects;
drop policy if exists "Members update own photo" on storage.objects;
drop policy if exists "Members delete own photo" on storage.objects;
drop policy if exists "Org members read member photos" on storage.objects;

create policy "Members upload own photo"
  on storage.objects for insert
  with check (
    bucket_id = 'clinic-member-photos'
    and exists (
      select 1
      from public.clinic_memberships m
      where m.id::text = (storage.foldername(name))[3]
        and m.organization_id::text = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
        and m.status = 'active'
        and (storage.foldername(name))[2] = 'members'
    )
  );

create policy "Members update own photo"
  on storage.objects for update
  using (
    bucket_id = 'clinic-member-photos'
    and exists (
      select 1
      from public.clinic_memberships m
      where m.id::text = (storage.foldername(name))[3]
        and m.organization_id::text = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
        and m.status = 'active'
        and (storage.foldername(name))[2] = 'members'
    )
  )
  with check (
    bucket_id = 'clinic-member-photos'
    and exists (
      select 1
      from public.clinic_memberships m
      where m.id::text = (storage.foldername(name))[3]
        and m.organization_id::text = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
        and m.status = 'active'
        and (storage.foldername(name))[2] = 'members'
    )
  );

create policy "Members delete own photo"
  on storage.objects for delete
  using (
    bucket_id = 'clinic-member-photos'
    and exists (
      select 1
      from public.clinic_memberships m
      where m.id::text = (storage.foldername(name))[3]
        and m.organization_id::text = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
        and m.status = 'active'
        and (storage.foldername(name))[2] = 'members'
    )
  );

create policy "Org members read member photos"
  on storage.objects for select
  using (
    bucket_id = 'clinic-member-photos'
    and (storage.foldername(name))[2] = 'members'
    and public.is_clinic_org_member((storage.foldername(name))[1]::uuid)
  );
