-- Allow clinic owners to insert job/shift posts even without a membership row.
-- Select/update policies already include auth.uid() = clinic_id; insert did not,
-- which caused RLS failures and a generic "Please try again" on publish.

drop policy if exists "Clinic members insert org job posts" on public.job_posts;
create policy "Clinic members insert org job posts"
  on public.job_posts for insert
  with check (
    (
      auth.uid() = clinic_id
      or public.is_clinic_org_member(coalesce(organization_id, clinic_id))
    )
    and (
      auth.uid() = clinic_id
      or public.is_clinic_org_owner(coalesce(organization_id, clinic_id))
      or location_id is null
      or public.can_access_clinic_location(coalesce(organization_id, clinic_id), location_id)
    )
  );

drop policy if exists "Clinic members insert org shift posts" on public.shift_posts;
create policy "Clinic members insert org shift posts"
  on public.shift_posts for insert
  with check (
    (
      auth.uid() = clinic_id
      or public.is_clinic_org_member(coalesce(organization_id, clinic_id))
    )
    and (
      auth.uid() = clinic_id
      or public.is_clinic_org_owner(coalesce(organization_id, clinic_id))
      or location_id is null
      or public.can_access_clinic_location(coalesce(organization_id, clinic_id), location_id)
    )
  );
