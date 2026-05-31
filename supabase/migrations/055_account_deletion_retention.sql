-- Preserve business history when accounts are deleted; scrub PII and close interactions.

-- ---------------------------------------------------------------------------
-- Deletion metadata + clinic snapshots on applications
-- ---------------------------------------------------------------------------

alter table public.applications
  add column if not exists clinic_name text,
  add column if not exists clinic_city text,
  add column if not exists clinic_province text,
  add column if not exists clinic_logo_storage_path text,
  add column if not exists worker_account_deleted_at timestamptz,
  add column if not exists clinic_account_deleted_at timestamptz;

alter table public.job_posts
  add column if not exists clinic_account_deleted_at timestamptz;

alter table public.shift_posts
  add column if not exists clinic_account_deleted_at timestamptz;

alter table public.conversations
  add column if not exists worker_account_deleted_at timestamptz,
  add column if not exists clinic_account_deleted_at timestamptz;

-- Backfill clinic snapshots on existing applications.
update public.applications a
set
  clinic_name = cp.clinic_name,
  clinic_city = cp.city,
  clinic_province = cp.province,
  clinic_logo_storage_path = cp.logo_storage_path
from public.job_posts jp
join public.clinic_profiles cp on cp.id = jp.clinic_id
where a.job_post_id = jp.id
  and a.clinic_name is null;

update public.applications a
set
  clinic_name = cp.clinic_name,
  clinic_city = cp.city,
  clinic_province = cp.province,
  clinic_logo_storage_path = cp.logo_storage_path
from public.shift_posts sp
join public.clinic_profiles cp on cp.id = sp.clinic_id
where a.shift_post_id = sp.id
  and a.clinic_name is null;

-- ---------------------------------------------------------------------------
-- Stop cascading auth.users deletion into historical business records
-- ---------------------------------------------------------------------------

alter table public.applications
  drop constraint if exists applications_worker_id_fkey;

alter table public.job_posts
  drop constraint if exists job_posts_clinic_id_fkey;

alter table public.shift_posts
  drop constraint if exists shift_posts_clinic_id_fkey;

alter table public.conversations
  drop constraint if exists conversations_worker_id_fkey;

alter table public.conversations
  drop constraint if exists conversations_clinic_id_fkey;

alter table public.messages
  drop constraint if exists messages_sender_id_fkey;

alter table public.messages
  alter column sender_id drop not null;

alter table public.messages
  add constraint messages_sender_id_fkey
  foreign key (sender_id) references auth.users(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Snapshot clinic on application insert
-- ---------------------------------------------------------------------------

create or replace function public.snapshot_application_on_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_worker public.worker_profiles%rowtype;
  v_clinic public.clinic_profiles%rowtype;
  v_clinic_id uuid;
  v_display_name text;
  v_job_match jsonb;
begin
  select * into v_worker from public.worker_profiles where id = new.worker_id;

  if found then
    select display_name into v_display_name
    from public.profiles
    where id = new.worker_id;

    new.years_of_experience := v_worker.years_of_experience;
    new.education := public.format_worker_education(v_worker);
    new.role_type := v_worker.role_type;
    new.license_type := null;
    new.resume_storage_path := v_worker.resume_storage_path;
    new.software_used := coalesce(v_worker.software_used, '{}');
    new.practice_types := coalesce(v_worker.practice_types, '{}');
    new.preferred_employment_types := coalesce(v_worker.preferred_employment_types, '{}');
    new.worker_display_name := nullif(trim(v_display_name), '');
    new.worker_address := public.format_worker_address(v_worker);
    new.worker_photo_storage_path := v_worker.photo_storage_path;
  end if;

  v_clinic_id := coalesce(
    (select jp.clinic_id from public.job_posts jp where jp.id = new.job_post_id),
    (select sp.clinic_id from public.shift_posts sp where sp.id = new.shift_post_id)
  );

  if v_clinic_id is not null then
    select * into v_clinic from public.clinic_profiles where id = v_clinic_id;
    if found then
      new.clinic_name := v_clinic.clinic_name;
      new.clinic_city := v_clinic.city;
      new.clinic_province := v_clinic.province;
      new.clinic_logo_storage_path := v_clinic.logo_storage_path;
    end if;
  end if;

  if new.job_post_id is not null then
    new.match_tier := null;
    new.match_breakdown := null;
    new.match_score := null;

    v_job_match := public.compute_job_match(new.worker_id, new.job_post_id);
    if v_job_match is not null then
      new.match_tier := v_job_match->>'tier';
      new.match_breakdown := v_job_match->'breakdown';
    end if;
  else
    new.match_tier := null;
    new.match_breakdown := null;
    new.match_score := null;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Browse policies: hide posts from deleted clinic accounts
-- ---------------------------------------------------------------------------

drop policy if exists "Workers read live job posts" on public.job_posts;
create policy "Workers read live job posts"
  on public.job_posts for select
  using (status = 'live' and clinic_account_deleted_at is null);

drop policy if exists "Workers read live shift posts" on public.shift_posts;
create policy "Workers read live shift posts"
  on public.shift_posts for select
  using (status = 'live' and clinic_account_deleted_at is null);

-- ---------------------------------------------------------------------------
-- Messaging: block sends when either participant account was deleted
-- ---------------------------------------------------------------------------

drop policy if exists "Participants send messages when open" on public.messages;

create policy "Participants send messages when open"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.worker_id = auth.uid() or c.clinic_id = auth.uid())
        and c.messaging_closed_at is null
        and c.worker_account_deleted_at is null
        and c.clinic_account_deleted_at is null
        and (
          (
            c.conversation_type = 'application'
            and exists (
              select 1
              from public.applications a
              where a.id = c.application_id
                and public.application_messaging_open(a.status)
                and a.worker_account_deleted_at is null
                and a.clinic_account_deleted_at is null
            )
          )
          or (
            c.conversation_type = 'general'
            and exists (
              select 1
              from public.clinic_profiles cp
              where cp.id = c.clinic_id
                and cp.accepts_general_candidate_messages = true
            )
            and (
              c.clinic_id = auth.uid()
              or public.is_worker_profile_complete(c.worker_id)
            )
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Account deactivation RPCs (service role only)
-- ---------------------------------------------------------------------------

create or replace function public.deactivate_worker_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  -- Close active applications.
  update public.applications
  set
    status = 'rejected',
    worker_account_deleted_at = v_now,
    worker_address = null,
    resume_storage_path = null,
    worker_photo_storage_path = null,
    interview_at = null,
    interview_duration_minutes = null,
    interview_details = null,
    interview_proposed_at = null,
    interview_proposed_duration_minutes = null,
    interview_proposed_details = null,
    interview_proposed_by = null,
    updated_at = v_now
  where worker_id = p_user_id
    and status in (
      'applied',
      'reviewed',
      'in_progress',
      'interview_offered',
      'interview_scheduled'
    );

  -- Mark retained applications and scrub contact PII.
  update public.applications
  set
    worker_account_deleted_at = coalesce(worker_account_deleted_at, v_now),
    worker_address = null,
    resume_storage_path = null,
    worker_photo_storage_path = null,
    updated_at = v_now
  where worker_id = p_user_id
    and worker_account_deleted_at is null;

  update public.conversations
  set
    worker_account_deleted_at = v_now,
    messaging_closed_at = coalesce(messaging_closed_at, v_now),
    updated_at = v_now
  where worker_id = p_user_id
    and worker_account_deleted_at is null;
end;
$$;

create or replace function public.deactivate_clinic_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  -- Snapshot clinic on applications before profile removal.
  update public.applications a
  set
    clinic_name = coalesce(a.clinic_name, cp.clinic_name),
    clinic_city = coalesce(a.clinic_city, cp.city),
    clinic_province = coalesce(a.clinic_province, cp.province),
    clinic_logo_storage_path = null,
    updated_at = v_now
  from public.clinic_profiles cp
  where cp.id = p_user_id
    and (
      (a.job_post_id is not null and exists (
        select 1 from public.job_posts jp
        where jp.id = a.job_post_id and jp.clinic_id = p_user_id
      ))
      or (a.shift_post_id is not null and exists (
        select 1 from public.shift_posts sp
        where sp.id = a.shift_post_id and sp.clinic_id = p_user_id
      ))
    );

  -- Close live posts.
  update public.job_posts
  set status = 'closed', clinic_account_deleted_at = v_now, updated_at = v_now
  where clinic_id = p_user_id
    and clinic_account_deleted_at is null;

  update public.shift_posts
  set status = 'closed', clinic_account_deleted_at = v_now, updated_at = v_now
  where clinic_id = p_user_id
    and clinic_account_deleted_at is null;

  -- Reject active applications to this clinic's posts.
  update public.applications a
  set
    status = 'rejected',
    clinic_account_deleted_at = v_now,
    updated_at = v_now
  where a.clinic_account_deleted_at is null
    and a.status in (
      'applied',
      'reviewed',
      'in_progress',
      'interview_offered',
      'interview_scheduled'
    )
    and (
      (a.job_post_id is not null and exists (
        select 1 from public.job_posts jp
        where jp.id = a.job_post_id and jp.clinic_id = p_user_id
      ))
      or (a.shift_post_id is not null and exists (
        select 1 from public.shift_posts sp
        where sp.id = a.shift_post_id and sp.clinic_id = p_user_id
      ))
    );

  -- Mark retained applications.
  update public.applications a
  set
    clinic_account_deleted_at = coalesce(a.clinic_account_deleted_at, v_now),
    clinic_logo_storage_path = null,
    updated_at = v_now
  where a.clinic_account_deleted_at is null
    and (
      (a.job_post_id is not null and exists (
        select 1 from public.job_posts jp
        where jp.id = a.job_post_id and jp.clinic_id = p_user_id
      ))
      or (a.shift_post_id is not null and exists (
        select 1 from public.shift_posts sp
        where sp.id = a.shift_post_id and sp.clinic_id = p_user_id
      ))
    );

  update public.conversations
  set
    clinic_account_deleted_at = v_now,
    messaging_closed_at = coalesce(messaging_closed_at, v_now),
    updated_at = v_now
  where clinic_id = p_user_id
    and clinic_account_deleted_at is null;
end;
$$;

revoke all on function public.deactivate_worker_account(uuid) from public;
revoke all on function public.deactivate_clinic_account(uuid) from public;
grant execute on function public.deactivate_worker_account(uuid) to service_role;
grant execute on function public.deactivate_clinic_account(uuid) to service_role;

-- Block applications to posts from deleted clinic accounts.
drop policy if exists "Workers insert own applications" on public.applications;

create policy "Workers insert own applications"
  on public.applications for insert
  with check (
    auth.uid() = worker_id
    and status = 'applied'
    and (
      (
        job_post_id is not null
        and shift_post_id is null
        and exists (
          select 1 from public.job_posts
          where job_posts.id = job_post_id
            and job_posts.status = 'live'
            and job_posts.clinic_account_deleted_at is null
        )
      )
      or (
        shift_post_id is not null
        and job_post_id is null
        and exists (
          select 1 from public.shift_posts
          where shift_posts.id = shift_post_id
            and shift_posts.status = 'live'
            and shift_posts.clinic_account_deleted_at is null
        )
      )
    )
  );
