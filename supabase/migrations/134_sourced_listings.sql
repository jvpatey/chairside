-- Exposure-only sourced listings: ads/fill-ins without a clinic account.
-- Managed via admin-sourced-listings Edge Function (service role).

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.job_posts
  alter column clinic_id drop not null;

alter table public.shift_posts
  alter column clinic_id drop not null;

alter table public.job_posts
  add column if not exists is_sourced boolean not null default false,
  add column if not exists display_clinic_name text,
  add column if not exists display_city text,
  add column if not exists display_province text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists external_url text,
  add column if not exists admin_notes text;

alter table public.shift_posts
  add column if not exists is_sourced boolean not null default false,
  add column if not exists display_clinic_name text,
  add column if not exists display_city text,
  add column if not exists display_province text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists external_url text,
  add column if not exists admin_notes text;

alter table public.job_posts
  drop constraint if exists job_posts_sourced_clinic_check;

alter table public.job_posts
  add constraint job_posts_sourced_clinic_check
  check (
    (is_sourced = true and clinic_id is null)
    or (is_sourced = false and clinic_id is not null)
  );

alter table public.shift_posts
  drop constraint if exists shift_posts_sourced_clinic_check;

alter table public.shift_posts
  add constraint shift_posts_sourced_clinic_check
  check (
    (is_sourced = true and clinic_id is null)
    or (is_sourced = false and clinic_id is not null)
  );

alter table public.job_posts
  drop constraint if exists job_posts_sourced_display_check;

alter table public.job_posts
  add constraint job_posts_sourced_display_check
  check (
    is_sourced = false
    or (
      nullif(trim(display_clinic_name), '') is not null
      and nullif(trim(display_city), '') is not null
      and nullif(trim(display_province), '') is not null
      and (
        nullif(trim(contact_phone), '') is not null
        or nullif(trim(contact_email), '') is not null
        or nullif(trim(external_url), '') is not null
      )
    )
  );

alter table public.shift_posts
  drop constraint if exists shift_posts_sourced_display_check;

alter table public.shift_posts
  add constraint shift_posts_sourced_display_check
  check (
    is_sourced = false
    or (
      nullif(trim(display_clinic_name), '') is not null
      and nullif(trim(display_city), '') is not null
      and nullif(trim(display_province), '') is not null
      and (
        nullif(trim(contact_phone), '') is not null
        or nullif(trim(contact_email), '') is not null
        or nullif(trim(external_url), '') is not null
      )
    )
  );

create index if not exists job_posts_sourced_feed_idx
  on public.job_posts (status, is_sourced, display_province)
  where is_sourced = true;

create index if not exists shift_posts_sourced_feed_idx
  on public.shift_posts (status, is_sourced, display_province, shift_date)
  where is_sourced = true;

-- ---------------------------------------------------------------------------
-- Skip org attribution stamp for sourced rows
-- ---------------------------------------------------------------------------

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
  if coalesce(new.is_sourced, false) then
    new.clinic_id := null;
    new.organization_id := null;
    new.location_id := null;
    new.posted_by_membership_id := null;
    return new;
  end if;

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

-- ---------------------------------------------------------------------------
-- Billing: skip publish limits for sourced listings
-- ---------------------------------------------------------------------------

create or replace function public.enforce_clinic_opportunity_limit_on_job_posts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.is_sourced, false) then
    return new;
  end if;

  if new.status <> 'live' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'live' then
    return new;
  end if;

  perform public.assert_clinic_can_publish_opportunity(new.clinic_id, new.id, null);
  return new;
end;
$$;

create or replace function public.enforce_clinic_opportunity_limit_on_shift_posts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.is_sourced, false) then
    return new;
  end if;

  if not (new.status = 'live' and new.shift_date >= current_date) then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'live' and old.shift_date >= current_date then
    return new;
  end if;

  perform public.assert_clinic_can_publish_opportunity(new.clinic_id, null, new.id);
  return new;
end;
$$;
