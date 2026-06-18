-- Clinic-initiated fill-in outreach: discover available workers and start conversations.

alter table public.worker_profiles
  add column if not exists accepts_clinic_fill_in_outreach boolean not null default false;

comment on column public.worker_profiles.accepts_clinic_fill_in_outreach is
  'When true, completed workers in the same province may appear in clinic fill-in outreach search.';

-- Outreach context on conversations (shift inquiry without an application).
alter table public.conversations
  add column if not exists outreach_role_type text,
  add column if not exists outreach_shift_date date,
  add column if not exists outreach_start_time time,
  add column if not exists outreach_end_time time;

alter table public.conversations
  drop constraint if exists conversations_conversation_type_check;

alter table public.conversations
  add constraint conversations_conversation_type_check
  check (conversation_type in ('application', 'general', 'outreach'));

alter table public.conversations
  drop constraint if exists conversations_type_application_id_check;

alter table public.conversations
  add constraint conversations_type_application_id_check
  check (
    (conversation_type = 'application' and application_id is not null)
    or (conversation_type = 'general' and application_id is null)
    or (
      conversation_type = 'outreach'
      and application_id is null
      and outreach_role_type is not null
      and outreach_shift_date is not null
      and outreach_start_time is not null
      and outreach_end_time is not null
    )
  );

alter table public.conversations
  drop constraint if exists conversations_outreach_role_type_check;

alter table public.conversations
  add constraint conversations_outreach_role_type_check
  check (
    outreach_role_type is null
    or outreach_role_type in (
      'hygienist',
      'assistant',
      'admin',
      'office_manager',
      'treatment_coordinator',
      'dentist',
      'other'
    )
  );

create unique index if not exists conversations_outreach_inquiry_unique
  on public.conversations (
    clinic_id,
    worker_id,
    outreach_role_type,
    outreach_shift_date,
    outreach_start_time,
    outreach_end_time
  )
  where conversation_type = 'outreach';

alter table public.messages
  add column if not exists trigger_sms_alert boolean not null default false;

comment on column public.messages.trigger_sms_alert is
  'When true on an outreach message from a clinic, notify edge function may send an opt-in SMS alert to the worker.';

create or replace function public.shift_date_weekday(p_shift_date date)
returns int
language sql immutable set search_path = public as $$
  select extract(dow from p_shift_date)::int;
$$;

create or replace function public.worker_available_for_shift(
  p_worker_id uuid,
  p_shift_date date,
  p_start_time time,
  p_end_time time
) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.availability_blocks ab
    where ab.worker_id = p_worker_id
      and ab.day_of_week = public.shift_date_weekday(p_shift_date)
      and ab.start_time <= p_start_time
      and ab.end_time >= p_end_time
  );
$$;

revoke all on function public.shift_date_weekday(date) from public;
grant execute on function public.shift_date_weekday(date) to authenticated;

revoke all on function public.worker_available_for_shift(uuid, date, time, time) from public;
grant execute on function public.worker_available_for_shift(uuid, date, time, time) to authenticated;

create or replace function public.list_available_fill_in_workers_for_clinic(
  p_role_type text,
  p_shift_date date,
  p_start_time time,
  p_end_time time
)
returns table (
  worker_id uuid,
  display_name text,
  role_types text[],
  city text,
  years_of_experience int,
  short_notice_available boolean,
  photo_storage_path text,
  availability_summary text,
  existing_conversation_id uuid,
  sms_opt_in boolean
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_clinic_id uuid;
  v_clinic_province text;
begin
  v_clinic_id := auth.uid();
  if v_clinic_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_clinic_id and role = 'clinic'
  ) then
    raise exception 'Only clinics can search available workers';
  end if;

  select cp.province into v_clinic_province
  from public.clinic_profiles cp
  where cp.id = v_clinic_id
    and cp.setup_completed_at is not null;

  if v_clinic_province is null then
    raise exception 'Complete your clinic profile before searching workers';
  end if;

  if p_shift_date < current_date then
    raise exception 'Shift date must be today or later';
  end if;

  if p_start_time >= p_end_time then
    raise exception 'End time must be after start time';
  end if;

  return query
  select
    wp.id as worker_id,
    coalesce(nullif(trim(p.display_name), ''), 'Candidate') as display_name,
    public.worker_role_types_resolved(wp.role_type, wp.role_types) as role_types,
    wp.city,
    wp.years_of_experience,
    wp.short_notice_available,
    wp.photo_storage_path,
    (
      select string_agg(
        case ab.day_of_week
          when 0 then 'Sun'
          when 1 then 'Mon'
          when 2 then 'Tue'
          when 3 then 'Wed'
          when 4 then 'Thu'
          when 5 then 'Fri'
          when 6 then 'Sat'
        end || ' ' || to_char(ab.start_time, 'HH12:MI AM') || '-' || to_char(ab.end_time, 'HH12:MI AM'),
        ', '
        order by ab.day_of_week, ab.start_time
      )
      from public.availability_blocks ab
      where ab.worker_id = wp.id
    ) as availability_summary,
    (
      select c.id
      from public.conversations c
      where c.conversation_type = 'outreach'
        and c.clinic_id = v_clinic_id
        and c.worker_id = wp.id
        and c.outreach_role_type = p_role_type
        and c.outreach_shift_date = p_shift_date
        and c.outreach_start_time = p_start_time
        and c.outreach_end_time = p_end_time
      limit 1
    ) as existing_conversation_id,
    wp.fill_in_sms_opt_in as sms_opt_in
  from public.worker_profiles wp
  join public.profiles p on p.id = wp.id and p.role = 'worker'
  where wp.setup_completed_at is not null
    and wp.province = v_clinic_province
    and wp.short_notice_available = true
    and wp.accepts_clinic_fill_in_outreach = true
    and wp.id <> v_clinic_id
    and public.worker_role_matches_post(wp.role_type, wp.role_types, p_role_type)
    and public.worker_available_for_shift(wp.id, p_shift_date, p_start_time, p_end_time)
  order by wp.city nulls last, p.display_name nulls last;
end;
$$;

revoke all on function public.list_available_fill_in_workers_for_clinic(text, date, time, time) from public;
grant execute on function public.list_available_fill_in_workers_for_clinic(text, date, time, time) to authenticated;

create or replace function public.can_send_outreach_sms(
  p_clinic_id uuid,
  p_worker_id uuid
) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1
    from public.notification_dispatch_log ndl
    where ndl.idempotency_key like 'outreach_sms:' || p_clinic_id::text || ':' || p_worker_id::text || ':%'
      and ndl.created_at > now() - interval '24 hours'
  );
$$;

revoke all on function public.can_send_outreach_sms(uuid, uuid) from public;
grant execute on function public.can_send_outreach_sms(uuid, uuid) to authenticated;

create or replace function public.start_clinic_fill_in_outreach(
  p_worker_id uuid,
  p_role_type text,
  p_shift_date date,
  p_start_time time,
  p_end_time time,
  p_message text,
  p_send_sms boolean default false
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_clinic_id uuid;
  v_clinic public.clinic_profiles%rowtype;
  v_worker public.worker_profiles%rowtype;
  v_conversation_id uuid;
  v_message_body text;
  v_send_sms boolean := false;
  v_sms_key text;
begin
  v_clinic_id := auth.uid();
  if v_clinic_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_clinic_id and role = 'clinic'
  ) then
    raise exception 'Only clinics can start fill-in outreach';
  end if;

  select * into v_clinic
  from public.clinic_profiles
  where id = v_clinic_id;

  if not found or v_clinic.setup_completed_at is null then
    raise exception 'Complete your clinic profile before messaging workers';
  end if;

  select * into v_worker
  from public.worker_profiles wp
  where wp.id = p_worker_id
    and wp.setup_completed_at is not null
    and wp.short_notice_available = true
    and wp.accepts_clinic_fill_in_outreach = true
    and wp.province = v_clinic.province
    and public.worker_role_matches_post(wp.role_type, wp.role_types, p_role_type)
    and public.worker_available_for_shift(wp.id, p_shift_date, p_start_time, p_end_time);

  if not found then
    raise exception 'Worker is not available for this fill-in outreach';
  end if;

  v_message_body := trim(p_message);
  if v_message_body = '' then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(v_message_body) > 2000 then
    raise exception 'Message must be 2000 characters or fewer';
  end if;

  select id into v_conversation_id
  from public.conversations
  where conversation_type = 'outreach'
    and clinic_id = v_clinic_id
    and worker_id = p_worker_id
    and outreach_role_type = p_role_type
    and outreach_shift_date = p_shift_date
    and outreach_start_time = p_start_time
    and outreach_end_time = p_end_time;

  if not found then
    insert into public.conversations (
      worker_id,
      clinic_id,
      conversation_type,
      application_id,
      outreach_role_type,
      outreach_shift_date,
      outreach_start_time,
      outreach_end_time
    )
    values (
      p_worker_id,
      v_clinic_id,
      'outreach',
      null,
      p_role_type,
      p_shift_date,
      p_start_time,
      p_end_time
    )
    returning id into v_conversation_id;
  end if;

  if p_send_sms then
    if not v_worker.fill_in_sms_opt_in or v_worker.phone is null then
      raise exception 'This worker has not opted into text alerts';
    end if;
    if not public.can_send_outreach_sms(v_clinic_id, p_worker_id) then
      raise exception 'Text alert rate limit reached. Try again later or message in-app only.';
    end if;
    v_send_sms := true;
    v_sms_key := 'outreach_sms:' || v_clinic_id::text || ':' || p_worker_id::text || ':' || gen_random_uuid()::text;
    insert into public.notification_dispatch_log (idempotency_key)
    values (v_sms_key);
  end if;

  insert into public.messages (conversation_id, sender_id, body, trigger_sms_alert)
  values (v_conversation_id, v_clinic_id, v_message_body, v_send_sms);

  return v_conversation_id;
end;
$$;

revoke all on function public.start_clinic_fill_in_outreach(uuid, text, date, time, time, text, boolean) from public;
grant execute on function public.start_clinic_fill_in_outreach(uuid, text, date, time, time, text, boolean) to authenticated;

-- Security definer helpers avoid RLS recursion between profiles, worker_profiles, and clinic_profiles.
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

-- Clinics may read outreach-eligible worker profiles in their province.
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
          or (
            c.conversation_type = 'outreach'
            and exists (
              select 1
              from public.worker_profiles wp
              where wp.id = c.worker_id
                and wp.accepts_clinic_fill_in_outreach = true
                and wp.short_notice_available = true
                and wp.setup_completed_at is not null
            )
            and exists (
              select 1
              from public.clinic_profiles cp
              where cp.id = c.clinic_id
                and cp.setup_completed_at is not null
            )
          )
        )
    )
  );
