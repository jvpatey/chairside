-- Fix infinite RLS recursion between profiles, worker_profiles, and clinic_profiles
-- introduced by outreach browse policies in 064.

create or replace function public.clinic_can_browse_outreach_worker(p_worker_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.worker_profiles wp
    join public.clinic_profiles cp on cp.id = auth.uid()
    where wp.id = p_worker_id
      and wp.accepts_clinic_fill_in_outreach = true
      and wp.short_notice_available = true
      and wp.setup_completed_at is not null
      and cp.setup_completed_at is not null
      and cp.province = wp.province
  );
$$;

revoke all on function public.clinic_can_browse_outreach_worker(uuid) from public;
grant execute on function public.clinic_can_browse_outreach_worker(uuid) to authenticated;

drop policy if exists "Clinics read outreach-eligible worker profiles" on public.worker_profiles;
drop policy if exists "Clinics read profiles for outreach workers" on public.profiles;
drop policy if exists "Clinics read worker photos for outreach" on storage.objects;

create policy "Clinics read outreach-eligible worker profiles"
  on public.worker_profiles for select
  using (public.clinic_can_browse_outreach_worker(id));

create policy "Clinics read profiles for outreach workers"
  on public.profiles for select
  using (public.clinic_can_browse_outreach_worker(id));

create policy "Clinics read worker photos for outreach"
  on storage.objects for select
  using (
    bucket_id = 'worker-photos'
    and public.clinic_can_browse_outreach_worker((storage.foldername(name))[1]::uuid)
    and exists (
      select 1
      from public.worker_profiles wp
      where wp.id::text = (storage.foldername(name))[1]
        and wp.photo_storage_path = name
    )
  );
