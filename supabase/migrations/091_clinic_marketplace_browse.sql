-- Listing-safe clinic summaries for cross-clinic marketplace browse (workers + clinics).

create or replace function public.list_clinic_listing_summaries(p_province text)
returns table (
  id uuid,
  clinic_name text,
  city text,
  province text,
  specialty text,
  software_used text[],
  latitude double precision,
  longitude double precision,
  logo_storage_path text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cp.id,
    cp.clinic_name,
    cp.city,
    cp.province,
    cp.specialty,
    coalesce(cp.software_used, '{}'::text[]) as software_used,
    cp.latitude,
    cp.longitude,
    cp.logo_storage_path
  from public.clinic_profiles cp
  where cp.province = p_province
    and cp.setup_completed_at is not null;
$$;

create or replace function public.get_clinic_listing_summary(p_clinic_id uuid)
returns table (
  id uuid,
  clinic_name text,
  city text,
  province text,
  specialty text,
  software_used text[],
  latitude double precision,
  longitude double precision,
  logo_storage_path text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cp.id,
    cp.clinic_name,
    cp.city,
    cp.province,
    cp.specialty,
    coalesce(cp.software_used, '{}'::text[]) as software_used,
    cp.latitude,
    cp.longitude,
    cp.logo_storage_path
  from public.clinic_profiles cp
  where cp.id = p_clinic_id
    and cp.setup_completed_at is not null;
$$;

revoke all on function public.list_clinic_listing_summaries(text) from public;
grant execute on function public.list_clinic_listing_summaries(text) to authenticated;

revoke all on function public.get_clinic_listing_summary(uuid) from public;
grant execute on function public.get_clinic_listing_summary(uuid) to authenticated;
