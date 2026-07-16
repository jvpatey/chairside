-- Fix clinic organization bootstrap: new owners must be able to insert + read
-- their org before a membership row exists (account-type setup step).

create or replace function public.ensure_owner_membership_for_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.clinic_memberships (
    organization_id, user_id, role, display_name, title, status, updated_at
  )
  values (
    new.id,
    new.id,
    'owner',
    coalesce(nullif(trim(new.name), ''), 'Owner'),
    'Owner',
    'active',
    now()
  )
  on conflict (organization_id, user_id) do update
  set
    role = 'owner',
    status = 'active',
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists clinic_organizations_ensure_owner_membership
  on public.clinic_organizations;
create trigger clinic_organizations_ensure_owner_membership
  after insert on public.clinic_organizations
  for each row
  execute function public.ensure_owner_membership_for_organization();

-- Owner can always read/update their org (id = auth.uid()) even before membership
-- resolves, and members retain access.
drop policy if exists "Members read own organization" on public.clinic_organizations;
create policy "Members read own organization"
  on public.clinic_organizations for select
  using (
    auth.uid() = id
    or public.is_clinic_org_member(id)
  );

drop policy if exists "Owners update own organization" on public.clinic_organizations;
create policy "Owners update own organization"
  on public.clinic_organizations for update
  using (
    auth.uid() = id
    or public.is_clinic_org_owner(id)
  )
  with check (
    auth.uid() = id
    or public.is_clinic_org_owner(id)
  );

-- Allow the owner to insert their own membership during bootstrap / upserts.
drop policy if exists "Owners manage memberships" on public.clinic_memberships;
create policy "Owners manage memberships"
  on public.clinic_memberships for all
  using (
    user_id = auth.uid()
    or public.is_clinic_org_owner(organization_id)
    or auth.uid() = organization_id
  )
  with check (
    user_id = auth.uid()
    or public.is_clinic_org_owner(organization_id)
    or auth.uid() = organization_id
  );

-- Backfill any orgs missing an owner membership (from failed setup attempts).
insert into public.clinic_memberships (
  organization_id, user_id, role, display_name, title, status, updated_at
)
select
  o.id,
  o.id,
  'owner',
  coalesce(nullif(trim(o.name), ''), 'Owner'),
  'Owner',
  'active',
  now()
from public.clinic_organizations o
where not exists (
  select 1
  from public.clinic_memberships m
  where m.organization_id = o.id
    and m.user_id = o.id
    and m.status = 'active'
)
on conflict (organization_id, user_id) do update
set
  role = 'owner',
  status = 'active',
  updated_at = now();
