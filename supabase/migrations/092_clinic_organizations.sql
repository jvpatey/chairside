-- Clinic organizations, locations, memberships, invitations, and post attribution.
-- organization_id equals the owner auth.users.id so existing clinic_id joins remain valid.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.clinic_organizations (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null default 'individual'
    check (account_type in ('individual', 'group')),
  name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clinic_organizations is
  'Clinic account org. id always equals the owner auth.users.id.';

create table public.clinic_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.clinic_organizations(id) on delete cascade,
  name text not null default '',
  address_line1 text,
  address_line2 text,
  city text,
  province text not null default 'NS',
  postal_code text,
  latitude double precision,
  longitude double precision,
  phone text,
  contact_name text,
  specialty text not null default 'general'
    check (specialty in ('general', 'ortho', 'pediatric', 'periodontics', 'endodontics', 'oral_surgery', 'other')),
  software_used text[] not null default '{}',
  operatories_count int,
  team_size_range text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index clinic_locations_one_primary_per_org
  on public.clinic_locations (organization_id)
  where is_primary;

create index clinic_locations_organization_id_idx
  on public.clinic_locations (organization_id);

create table public.clinic_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.clinic_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager')),
  display_name text,
  title text,
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create unique index clinic_memberships_one_owner_per_org
  on public.clinic_memberships (organization_id)
  where role = 'owner' and status = 'active';

create index clinic_memberships_user_id_idx
  on public.clinic_memberships (user_id)
  where status = 'active';

create table public.clinic_member_location_assignments (
  membership_id uuid not null references public.clinic_memberships(id) on delete cascade,
  location_id uuid not null references public.clinic_locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (membership_id, location_id)
);

create table public.clinic_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.clinic_organizations(id) on delete cascade,
  email text not null,
  display_name text,
  title text,
  role text not null default 'manager' check (role in ('manager')),
  token text not null unique,
  location_ids uuid[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by_user_id uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clinic_invitations_org_status_idx
  on public.clinic_invitations (organization_id, status);

create unique index clinic_invitations_pending_email_per_org
  on public.clinic_invitations (organization_id, lower(email))
  where status = 'pending';

-- Mirror fields on clinic_profiles for account type and org linkage
alter table public.clinic_profiles
  add column if not exists account_type text not null default 'individual'
    check (account_type in ('individual', 'group')),
  add column if not exists organization_id uuid references public.clinic_organizations(id);

-- Post attribution / location scoping
alter table public.job_posts
  add column if not exists organization_id uuid references public.clinic_organizations(id),
  add column if not exists location_id uuid references public.clinic_locations(id),
  add column if not exists posted_by_membership_id uuid references public.clinic_memberships(id),
  add column if not exists posted_by_display_name text,
  add column if not exists posted_by_title text;

alter table public.shift_posts
  add column if not exists organization_id uuid references public.clinic_organizations(id),
  add column if not exists location_id uuid references public.clinic_locations(id),
  add column if not exists posted_by_membership_id uuid references public.clinic_memberships(id),
  add column if not exists posted_by_display_name text,
  add column if not exists posted_by_title text;

create index if not exists job_posts_organization_id_idx on public.job_posts (organization_id);
create index if not exists job_posts_location_id_idx on public.job_posts (location_id);
create index if not exists shift_posts_organization_id_idx on public.shift_posts (organization_id);
create index if not exists shift_posts_location_id_idx on public.shift_posts (location_id);

-- ---------------------------------------------------------------------------
-- Backfill from existing clinic_profiles
-- ---------------------------------------------------------------------------

insert into public.clinic_organizations (id, account_type, name, created_at, updated_at)
select
  cp.id,
  'individual',
  coalesce(nullif(trim(cp.clinic_name), ''), 'Clinic'),
  coalesce(cp.created_at, now()),
  coalesce(cp.updated_at, now())
from public.clinic_profiles cp
on conflict (id) do nothing;

update public.clinic_profiles cp
set
  organization_id = cp.id,
  account_type = 'individual'
where cp.organization_id is null;

insert into public.clinic_memberships (
  organization_id, user_id, role, display_name, title, status, created_at, updated_at
)
select
  cp.id,
  cp.id,
  'owner',
  coalesce(nullif(trim(cp.contact_name), ''), nullif(trim(cp.clinic_name), ''), 'Owner'),
  'Owner',
  'active',
  coalesce(cp.created_at, now()),
  coalesce(cp.updated_at, now())
from public.clinic_profiles cp
where not exists (
  select 1 from public.clinic_memberships m
  where m.organization_id = cp.id and m.user_id = cp.id
);

insert into public.clinic_locations (
  organization_id,
  name,
  address_line1,
  address_line2,
  city,
  province,
  postal_code,
  latitude,
  longitude,
  phone,
  contact_name,
  specialty,
  software_used,
  operatories_count,
  team_size_range,
  is_primary,
  is_active,
  created_at,
  updated_at
)
select
  cp.id,
  coalesce(nullif(trim(cp.clinic_name), ''), 'Primary location'),
  cp.address_line1,
  cp.address_line2,
  cp.city,
  coalesce(cp.province, 'NS'),
  cp.postal_code,
  cp.latitude,
  cp.longitude,
  cp.phone,
  cp.contact_name,
  coalesce(cp.specialty, 'general'),
  coalesce(cp.software_used, '{}'),
  cp.operatories_count,
  cp.team_size_range,
  true,
  true,
  coalesce(cp.created_at, now()),
  coalesce(cp.updated_at, now())
from public.clinic_profiles cp
where not exists (
  select 1 from public.clinic_locations l where l.organization_id = cp.id
);

-- Orphan clinic owners: posts/subscriptions may exist without clinic_profiles
-- (e.g. incomplete setup or scrubbed profile). Create org stubs when the auth
-- user still exists so job/shift organization_id backfill can satisfy the FK.
insert into public.clinic_organizations (id, account_type, name, created_at, updated_at)
select distinct
  orphan.clinic_id,
  'individual',
  coalesce(
    nullif(trim(p.display_name), ''),
    nullif(trim(split_part(u.email, '@', 1)), ''),
    'Clinic'
  ),
  coalesce(u.created_at, now()),
  now()
from (
  select clinic_id from public.job_posts
  union
  select clinic_id from public.shift_posts
  union
  select clinic_id from public.clinic_subscriptions
  union
  select clinic_id from public.conversations
) orphan
join auth.users u on u.id = orphan.clinic_id
left join public.profiles p on p.id = orphan.clinic_id
where not exists (
  select 1 from public.clinic_organizations o where o.id = orphan.clinic_id
)
on conflict (id) do nothing;

insert into public.clinic_memberships (
  organization_id, user_id, role, display_name, title, status, created_at, updated_at
)
select
  o.id,
  o.id,
  'owner',
  coalesce(nullif(trim(p.display_name), ''), o.name, 'Owner'),
  'Owner',
  'active',
  o.created_at,
  now()
from public.clinic_organizations o
left join public.profiles p on p.id = o.id
where not exists (
  select 1 from public.clinic_memberships m
  where m.organization_id = o.id and m.user_id = o.id
);

insert into public.clinic_locations (
  organization_id,
  name,
  province,
  specialty,
  software_used,
  is_primary,
  is_active,
  created_at,
  updated_at
)
select
  o.id,
  coalesce(nullif(trim(o.name), ''), 'Primary location'),
  'NS',
  'general',
  '{}',
  true,
  true,
  o.created_at,
  now()
from public.clinic_organizations o
where not exists (
  select 1 from public.clinic_locations l where l.organization_id = o.id
);

-- Backfill posts: organization_id = clinic_id only when the org row exists
-- (clinic_id without a matching auth user cannot get an organization stub).
update public.job_posts jp
set organization_id = jp.clinic_id
where jp.organization_id is null
  and exists (
    select 1 from public.clinic_organizations o where o.id = jp.clinic_id
  );

update public.shift_posts sp
set organization_id = sp.clinic_id
where sp.organization_id is null
  and exists (
    select 1 from public.clinic_organizations o where o.id = sp.clinic_id
  );

update public.job_posts jp
set location_id = l.id
from public.clinic_locations l
where jp.location_id is null
  and l.organization_id = jp.clinic_id
  and l.is_primary;

update public.shift_posts sp
set location_id = l.id
from public.clinic_locations l
where sp.location_id is null
  and l.organization_id = sp.clinic_id
  and l.is_primary;

update public.job_posts jp
set
  posted_by_membership_id = m.id,
  posted_by_display_name = coalesce(m.display_name, cp.contact_name, cp.clinic_name, o.name),
  posted_by_title = coalesce(m.title, 'Owner')
from public.clinic_memberships m
join public.clinic_organizations o on o.id = m.organization_id
left join public.clinic_profiles cp on cp.id = m.organization_id
where jp.posted_by_membership_id is null
  and m.organization_id = jp.clinic_id
  and m.role = 'owner'
  and m.status = 'active';

update public.shift_posts sp
set
  posted_by_membership_id = m.id,
  posted_by_display_name = coalesce(m.display_name, cp.contact_name, cp.clinic_name, o.name),
  posted_by_title = coalesce(m.title, 'Owner')
from public.clinic_memberships m
join public.clinic_organizations o on o.id = m.organization_id
left join public.clinic_profiles cp on cp.id = m.organization_id
where sp.posted_by_membership_id is null
  and m.organization_id = sp.clinic_id
  and m.role = 'owner'
  and m.status = 'active';

-- ---------------------------------------------------------------------------
-- Auth helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_clinic_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_clinic_org_owner(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
      and m.status = 'active'
  );
$$;

create or replace function public.get_active_clinic_membership(p_organization_id uuid)
returns public.clinic_memberships
language sql
stable
security definer
set search_path = public
as $$
  select m.*
  from public.clinic_memberships m
  where m.organization_id = p_organization_id
    and m.user_id = auth.uid()
    and m.status = 'active'
  limit 1;
$$;

create or replace function public.can_access_clinic_location(
  p_organization_id uuid,
  p_location_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_clinic_org_owner(p_organization_id)
    or exists (
      select 1
      from public.clinic_memberships m
      join public.clinic_member_location_assignments a on a.membership_id = m.id
      where m.organization_id = p_organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and a.location_id = p_location_id
    );
$$;

create or replace function public.get_clinic_organization_id_for_user(p_user_id uuid default auth.uid())
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.organization_id
  from public.clinic_memberships m
  where m.user_id = p_user_id
    and m.status = 'active'
  order by case when m.role = 'owner' then 0 else 1 end, m.created_at
  limit 1;
$$;

-- Ensure org + owner membership + primary location when clinic_profiles is upserted
create or replace function public.ensure_clinic_organization_for_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_membership_id uuid;
begin
  v_org_id := coalesce(new.organization_id, new.id);
  new.organization_id := v_org_id;
  new.account_type := coalesce(new.account_type, 'individual');

  insert into public.clinic_organizations (id, account_type, name, updated_at)
  values (
    v_org_id,
    new.account_type,
    coalesce(nullif(trim(new.clinic_name), ''), 'Clinic'),
    now()
  )
  on conflict (id) do update
  set
    account_type = excluded.account_type,
    name = case
      when nullif(trim(excluded.name), '') is null then clinic_organizations.name
      else excluded.name
    end,
    updated_at = now();

  insert into public.clinic_memberships (
    organization_id, user_id, role, display_name, title, status, updated_at
  )
  values (
    v_org_id,
    new.id,
    'owner',
    coalesce(nullif(trim(new.contact_name), ''), nullif(trim(new.clinic_name), ''), 'Owner'),
    'Owner',
    'active',
    now()
  )
  on conflict (organization_id, user_id) do update
  set
    role = 'owner',
    status = 'active',
    display_name = coalesce(
      nullif(trim(excluded.display_name), ''),
      clinic_memberships.display_name
    ),
    updated_at = now()
  returning id into v_membership_id;

  -- Individual clinics get a primary location mirrored from the profile.
  -- Group clinics add locations explicitly during setup — never seed a placeholder.
  if new.account_type = 'individual'
    and not exists (
      select 1 from public.clinic_locations l where l.organization_id = v_org_id
    )
  then
    insert into public.clinic_locations (
      organization_id,
      name,
      address_line1,
      address_line2,
      city,
      province,
      postal_code,
      latitude,
      longitude,
      phone,
      contact_name,
      specialty,
      software_used,
      operatories_count,
      team_size_range,
      is_primary,
      is_active
    )
    values (
      v_org_id,
      coalesce(nullif(trim(new.clinic_name), ''), 'Primary location'),
      new.address_line1,
      new.address_line2,
      new.city,
      coalesce(new.province, 'NS'),
      new.postal_code,
      new.latitude,
      new.longitude,
      new.phone,
      new.contact_name,
      coalesce(new.specialty, 'general'),
      coalesce(new.software_used, '{}'),
      new.operatories_count,
      new.team_size_range,
      true,
      true
    );
  elsif new.account_type = 'individual' then
    update public.clinic_locations
    set
      name = coalesce(nullif(trim(new.clinic_name), ''), name),
      address_line1 = coalesce(new.address_line1, address_line1),
      address_line2 = coalesce(new.address_line2, address_line2),
      city = coalesce(new.city, city),
      province = coalesce(new.province, province),
      postal_code = coalesce(new.postal_code, postal_code),
      latitude = coalesce(new.latitude, latitude),
      longitude = coalesce(new.longitude, longitude),
      phone = coalesce(new.phone, phone),
      contact_name = coalesce(new.contact_name, contact_name),
      specialty = coalesce(new.specialty, specialty),
      software_used = coalesce(new.software_used, software_used),
      operatories_count = coalesce(new.operatories_count, operatories_count),
      team_size_range = coalesce(new.team_size_range, team_size_range),
      updated_at = now()
    where organization_id = v_org_id
      and is_primary;
  end if;

  return new;
end;
$$;

drop trigger if exists clinic_profiles_ensure_organization on public.clinic_profiles;
create trigger clinic_profiles_ensure_organization
  before insert or update on public.clinic_profiles
  for each row
  execute function public.ensure_clinic_organization_for_profile();

-- Sync profile address from primary location when primary location changes (group accounts)
create or replace function public.sync_clinic_profile_from_primary_location()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_primary and new.is_active then
    update public.clinic_profiles
    set
      address_line1 = new.address_line1,
      address_line2 = new.address_line2,
      city = new.city,
      province = new.province,
      postal_code = new.postal_code,
      latitude = new.latitude,
      longitude = new.longitude,
      updated_at = now()
    where organization_id = new.organization_id
       or id = new.organization_id;
  end if;
  return new;
end;
$$;

drop trigger if exists clinic_locations_sync_primary_to_profile on public.clinic_locations;
create trigger clinic_locations_sync_primary_to_profile
  after insert or update on public.clinic_locations
  for each row
  execute function public.sync_clinic_profile_from_primary_location();

-- Stamp attribution on post insert when missing
create or replace function public.stamp_clinic_post_attribution()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership public.clinic_memberships;
  v_org_id uuid;
begin
  v_org_id := coalesce(new.organization_id, new.clinic_id);
  new.organization_id := v_org_id;
  new.clinic_id := coalesce(new.clinic_id, v_org_id);

  if new.posted_by_membership_id is null then
    select * into v_membership
    from public.clinic_memberships m
    where m.organization_id = v_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
    limit 1;

    if v_membership.id is not null then
      new.posted_by_membership_id := v_membership.id;
      new.posted_by_display_name := coalesce(
        new.posted_by_display_name,
        v_membership.display_name
      );
      new.posted_by_title := coalesce(new.posted_by_title, v_membership.title);
    end if;
  end if;

  if new.location_id is null then
    select l.id into new.location_id
    from public.clinic_locations l
    where l.organization_id = v_org_id
      and l.is_primary
      and l.is_active
    limit 1;
  end if;

  return new;
end;
$$;

drop trigger if exists job_posts_stamp_attribution on public.job_posts;
create trigger job_posts_stamp_attribution
  before insert on public.job_posts
  for each row
  execute function public.stamp_clinic_post_attribution();

drop trigger if exists shift_posts_stamp_attribution on public.shift_posts;
create trigger shift_posts_stamp_attribution
  before insert on public.shift_posts
  for each row
  execute function public.stamp_clinic_post_attribution();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.clinic_organizations enable row level security;
alter table public.clinic_locations enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.clinic_member_location_assignments enable row level security;
alter table public.clinic_invitations enable row level security;

create policy "Members read own organization"
  on public.clinic_organizations for select
  using (public.is_clinic_org_member(id));

create policy "Owners update own organization"
  on public.clinic_organizations for update
  using (public.is_clinic_org_owner(id))
  with check (public.is_clinic_org_owner(id));

create policy "Owners insert organization"
  on public.clinic_organizations for insert
  with check (auth.uid() = id);

create policy "Members read organization locations"
  on public.clinic_locations for select
  using (
    public.is_clinic_org_owner(organization_id)
    or public.can_access_clinic_location(organization_id, id)
    or exists (
      -- Workers need location city when browsing? Prefer org-level clinic_profiles for public.
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'worker'
    )
  );

create policy "Owners manage locations"
  on public.clinic_locations for all
  using (public.is_clinic_org_owner(organization_id))
  with check (public.is_clinic_org_owner(organization_id));

create policy "Members read memberships in org"
  on public.clinic_memberships for select
  using (public.is_clinic_org_member(organization_id) or user_id = auth.uid());

create policy "Owners manage memberships"
  on public.clinic_memberships for all
  using (public.is_clinic_org_owner(organization_id) or user_id = auth.uid())
  with check (public.is_clinic_org_owner(organization_id) or user_id = auth.uid());

create policy "Members read location assignments"
  on public.clinic_member_location_assignments for select
  using (
    exists (
      select 1 from public.clinic_memberships m
      where m.id = membership_id
        and public.is_clinic_org_member(m.organization_id)
    )
  );

create policy "Owners manage location assignments"
  on public.clinic_member_location_assignments for all
  using (
    exists (
      select 1 from public.clinic_memberships m
      where m.id = membership_id
        and public.is_clinic_org_owner(m.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.clinic_memberships m
      where m.id = membership_id
        and public.is_clinic_org_owner(m.organization_id)
    )
  );

create policy "Owners manage invitations"
  on public.clinic_invitations for all
  using (public.is_clinic_org_owner(organization_id))
  with check (public.is_clinic_org_owner(organization_id));

create policy "Invitees can read invitation by matching email session"
  on public.clinic_invitations for select
  using (
    status = 'pending'
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Expand clinic profile access to org members (not only owner user id)
drop policy if exists "Clinic owners read own clinic profile" on public.clinic_profiles;
create policy "Clinic members read org clinic profile"
  on public.clinic_profiles for select
  using (
    auth.uid() = id
    or public.is_clinic_org_member(coalesce(organization_id, id))
  );

drop policy if exists "Clinic owners update own clinic profile" on public.clinic_profiles;
create policy "Clinic owners update org clinic profile"
  on public.clinic_profiles for update
  using (
    auth.uid() = id
    or public.is_clinic_org_owner(coalesce(organization_id, id))
  )
  with check (
    auth.uid() = id
    or public.is_clinic_org_owner(coalesce(organization_id, id))
  );

-- Expand job/shift policies to org members
drop policy if exists "Clinics read own job posts" on public.job_posts;
create policy "Clinic members read org job posts"
  on public.job_posts for select
  using (
    auth.uid() = clinic_id
    or public.is_clinic_org_member(coalesce(organization_id, clinic_id))
  );

drop policy if exists "Clinics insert own job posts" on public.job_posts;
create policy "Clinic members insert org job posts"
  on public.job_posts for insert
  with check (
    public.is_clinic_org_member(coalesce(organization_id, clinic_id))
    and (
      public.is_clinic_org_owner(coalesce(organization_id, clinic_id))
      or location_id is null
      or public.can_access_clinic_location(coalesce(organization_id, clinic_id), location_id)
    )
  );

drop policy if exists "Clinics update own job posts" on public.job_posts;
drop policy if exists "Clinics update own job posts with check" on public.job_posts;
create policy "Clinic members update org job posts"
  on public.job_posts for update
  using (
    auth.uid() = clinic_id
    or public.is_clinic_org_member(coalesce(organization_id, clinic_id))
  )
  with check (
    public.is_clinic_org_member(coalesce(organization_id, clinic_id))
  );

drop policy if exists "Clinics read own shift posts" on public.shift_posts;
create policy "Clinic members read org shift posts"
  on public.shift_posts for select
  using (
    auth.uid() = clinic_id
    or public.is_clinic_org_member(coalesce(organization_id, clinic_id))
  );

drop policy if exists "Clinics insert own shift posts" on public.shift_posts;
create policy "Clinic members insert org shift posts"
  on public.shift_posts for insert
  with check (
    public.is_clinic_org_member(coalesce(organization_id, clinic_id))
    and (
      public.is_clinic_org_owner(coalesce(organization_id, clinic_id))
      or location_id is null
      or public.can_access_clinic_location(coalesce(organization_id, clinic_id), location_id)
    )
  );

drop policy if exists "Clinics update own shift posts" on public.shift_posts;
drop policy if exists "Clinics update own shift posts with check" on public.shift_posts;
create policy "Clinic members update org shift posts"
  on public.shift_posts for update
  using (
    auth.uid() = clinic_id
    or public.is_clinic_org_member(coalesce(organization_id, clinic_id))
  )
  with check (
    public.is_clinic_org_member(coalesce(organization_id, clinic_id))
  );

-- Billing: allow members to read org subscription (owner id = clinic_id)
drop policy if exists "Clinics read own subscription" on public.clinic_subscriptions;
create policy "Clinic members read org subscription"
  on public.clinic_subscriptions for select
  using (
    auth.uid() = clinic_id
    or public.is_clinic_org_member(clinic_id)
  );

-- Invitation RPCs
create or replace function public.create_clinic_manager_invitation(
  p_organization_id uuid,
  p_email text,
  p_display_name text default null,
  p_title text default null,
  p_location_ids uuid[] default '{}',
  p_expires_in_hours int default 168
)
returns public.clinic_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.clinic_invitations;
  v_email text := lower(trim(p_email));
begin
  if auth.uid() is distinct from p_organization_id
     and not public.is_clinic_org_owner(p_organization_id) then
    raise exception 'Only the organization owner can invite managers';
  end if;

  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'A valid email is required';
  end if;

  -- Expire any existing pending invite for this email
  update public.clinic_invitations
  set status = 'revoked', updated_at = now()
  where organization_id = p_organization_id
    and lower(email) = v_email
    and status = 'pending';

  insert into public.clinic_invitations (
    organization_id,
    email,
    display_name,
    title,
    role,
    token,
    location_ids,
    status,
    invited_by_user_id,
    expires_at
  )
  values (
    p_organization_id,
    v_email,
    nullif(trim(p_display_name), ''),
    nullif(trim(p_title), ''),
    'manager',
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    coalesce(p_location_ids, '{}'),
    'pending',
    auth.uid(),
    now() + make_interval(hours => greatest(p_expires_in_hours, 1))
  )
  returning * into v_invite;

  return v_invite;
end;
$$;

create or replace function public.accept_clinic_manager_invitation(p_token text)
returns public.clinic_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.clinic_invitations;
  v_membership public.clinic_memberships;
  v_location_id uuid;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to accept an invitation';
  end if;

  select * into v_invite
  from public.clinic_invitations
  where token = p_token
  for update;

  if v_invite.id is null then
    raise exception 'Invitation not found';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invitation is no longer pending';
  end if;

  if v_invite.expires_at < now() then
    update public.clinic_invitations
    set status = 'expired', updated_at = now()
    where id = v_invite.id;
    raise exception 'Invitation has expired';
  end if;

  if v_email = '' or lower(v_invite.email) <> v_email then
    raise exception 'Signed-in email does not match this invitation';
  end if;

  -- Ensure clinic role on profile
  insert into public.profiles (id, role, display_name, onboarding_completed_at, updated_at)
  values (
    auth.uid(),
    'clinic',
    coalesce(v_invite.display_name, split_part(v_invite.email, '@', 1)),
    now(),
    now()
  )
  on conflict (id) do update
  set
    role = 'clinic',
    display_name = coalesce(
      nullif(trim(excluded.display_name), ''),
      profiles.display_name
    ),
    onboarding_completed_at = coalesce(profiles.onboarding_completed_at, now()),
    updated_at = now();

  insert into public.clinic_memberships (
    organization_id, user_id, role, display_name, title, status, updated_at
  )
  values (
    v_invite.organization_id,
    auth.uid(),
    'manager',
    coalesce(v_invite.display_name, split_part(v_invite.email, '@', 1)),
    coalesce(v_invite.title, 'Manager'),
    'active',
    now()
  )
  on conflict (organization_id, user_id) do update
  set
    role = 'manager',
    status = 'active',
    display_name = coalesce(excluded.display_name, clinic_memberships.display_name),
    title = coalesce(excluded.title, clinic_memberships.title),
    updated_at = now()
  returning * into v_membership;

  delete from public.clinic_member_location_assignments
  where membership_id = v_membership.id;

  foreach v_location_id in array coalesce(v_invite.location_ids, '{}')
  loop
    if exists (
      select 1 from public.clinic_locations l
      where l.id = v_location_id
        and l.organization_id = v_invite.organization_id
    ) then
      insert into public.clinic_member_location_assignments (membership_id, location_id)
      values (v_membership.id, v_location_id)
      on conflict do nothing;
    end if;
  end loop;

  update public.clinic_invitations
  set
    status = 'accepted',
    accepted_by_user_id = auth.uid(),
    accepted_at = now(),
    updated_at = now()
  where id = v_invite.id;

  return v_membership;
end;
$$;

create or replace function public.revoke_clinic_manager_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.clinic_invitations
  where id = p_invitation_id;

  if v_org_id is null then
    raise exception 'Invitation not found';
  end if;

  if not public.is_clinic_org_owner(v_org_id) then
    raise exception 'Only the organization owner can revoke invitations';
  end if;

  update public.clinic_invitations
  set status = 'revoked', updated_at = now()
  where id = p_invitation_id
    and status = 'pending';
end;
$$;

create or replace function public.remove_clinic_manager(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership public.clinic_memberships;
begin
  select * into v_membership
  from public.clinic_memberships
  where id = p_membership_id;

  if v_membership.id is null then
    raise exception 'Membership not found';
  end if;

  if not public.is_clinic_org_owner(v_membership.organization_id) then
    raise exception 'Only the organization owner can remove managers';
  end if;

  if v_membership.role = 'owner' then
    raise exception 'Cannot remove the organization owner';
  end if;

  update public.clinic_memberships
  set status = 'removed', updated_at = now()
  where id = p_membership_id;

  delete from public.clinic_member_location_assignments
  where membership_id = p_membership_id;
end;
$$;

create or replace function public.transfer_clinic_organization_ownership(
  p_organization_id uuid,
  p_new_owner_membership_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.clinic_memberships;
  v_next public.clinic_memberships;
begin
  if not public.is_clinic_org_owner(p_organization_id) then
    raise exception 'Only the current owner can transfer ownership';
  end if;

  select * into v_current
  from public.clinic_memberships
  where organization_id = p_organization_id
    and user_id = auth.uid()
    and role = 'owner'
    and status = 'active';

  select * into v_next
  from public.clinic_memberships
  where id = p_new_owner_membership_id
    and organization_id = p_organization_id
    and status = 'active';

  if v_next.id is null then
    raise exception 'New owner membership not found';
  end if;

  update public.clinic_memberships
  set role = 'manager', title = coalesce(nullif(title, ''), 'Manager'), updated_at = now()
  where id = v_current.id;

  update public.clinic_memberships
  set role = 'owner', title = 'Owner', updated_at = now()
  where id = v_next.id;
end;
$$;

grant execute on function public.is_clinic_org_member(uuid) to authenticated;
grant execute on function public.is_clinic_org_owner(uuid) to authenticated;
grant execute on function public.can_access_clinic_location(uuid, uuid) to authenticated;
grant execute on function public.get_clinic_organization_id_for_user(uuid) to authenticated;
grant execute on function public.create_clinic_manager_invitation(uuid, text, text, text, uuid[], int) to authenticated;
grant execute on function public.accept_clinic_manager_invitation(text) to authenticated;
grant execute on function public.revoke_clinic_manager_invitation(uuid) to authenticated;
grant execute on function public.remove_clinic_manager(uuid) to authenticated;
grant execute on function public.transfer_clinic_organization_ownership(uuid, uuid) to authenticated;
