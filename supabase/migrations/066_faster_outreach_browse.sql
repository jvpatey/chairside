-- Faster clinic fill-in outreach: browse opted-in workers by role without shift search.

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
      and (
        (
          outreach_role_type is null
          and outreach_shift_date is null
          and outreach_start_time is null
          and outreach_end_time is null
        )
        or (
          outreach_shift_date is not null
          and outreach_start_time is not null
          and outreach_end_time is not null
          and outreach_role_type is not null
        )
      )
    )
  );

drop index if exists public.conversations_outreach_inquiry_unique;

create unique index if not exists conversations_outreach_general_unique
  on public.conversations (clinic_id, worker_id)
  where conversation_type = 'outreach'
    and outreach_shift_date is null
    and outreach_start_time is null
    and outreach_end_time is null
    and outreach_role_type is null;

create unique index if not exists conversations_outreach_inquiry_unique
  on public.conversations (
    clinic_id,
    worker_id,
    outreach_role_type,
    outreach_shift_date,
    outreach_start_time,
    outreach_end_time
  )
  where conversation_type = 'outreach'
    and outreach_shift_date is not null;

create or replace function public.list_fill_in_outreach_workers_for_clinic(
  p_role_type text default null
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
    raise exception 'Only clinics can browse outreach workers';
  end if;

  select cp.province into v_clinic_province
  from public.clinic_profiles cp
  where cp.id = v_clinic_id
    and cp.setup_completed_at is not null;

  if v_clinic_province is null then
    raise exception 'Complete your clinic profile before browsing workers';
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
        and c.outreach_shift_date is null
        and c.outreach_start_time is null
        and c.outreach_end_time is null
        and c.outreach_role_type is null
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
    and (
      p_role_type is null
      or public.worker_role_matches_post(wp.role_type, wp.role_types, p_role_type)
    )
  order by wp.city nulls last, p.display_name nulls last;
end;
$$;

revoke all on function public.list_fill_in_outreach_workers_for_clinic(text) from public;
grant execute on function public.list_fill_in_outreach_workers_for_clinic(text) to authenticated;

drop function if exists public.start_clinic_fill_in_outreach(uuid, text, date, time, time, text, boolean);

create or replace function public.start_clinic_fill_in_outreach(
  p_worker_id uuid,
  p_message text,
  p_role_type text default null,
  p_shift_date date default null,
  p_start_time time default null,
  p_end_time time default null,
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
  v_has_shift_context boolean;
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

  v_has_shift_context := p_shift_date is not null
    or p_start_time is not null
    or p_end_time is not null
    or p_role_type is not null;

  if p_shift_date is not null or p_start_time is not null or p_end_time is not null then
    if p_shift_date is null or p_start_time is null or p_end_time is null or p_role_type is null then
      raise exception 'Provide role, date, and times together when adding shift details';
    end if;
    if p_shift_date < current_date then
      raise exception 'Shift date must be today or later';
    end if;
    if p_start_time >= p_end_time then
      raise exception 'End time must be after start time';
    end if;
  end if;

  select * into v_worker
  from public.worker_profiles wp
  where wp.id = p_worker_id
    and wp.setup_completed_at is not null
    and wp.short_notice_available = true
    and wp.accepts_clinic_fill_in_outreach = true
    and wp.province = v_clinic.province
    and (
      p_role_type is null
      or public.worker_role_matches_post(wp.role_type, wp.role_types, p_role_type)
    );

  if not found then
    raise exception 'Worker is not available for fill-in outreach';
  end if;

  v_message_body := trim(p_message);
  if v_message_body = '' then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(v_message_body) > 2000 then
    raise exception 'Message must be 2000 characters or fewer';
  end if;

  if v_has_shift_context and p_shift_date is not null then
    select id into v_conversation_id
    from public.conversations
    where conversation_type = 'outreach'
      and clinic_id = v_clinic_id
      and worker_id = p_worker_id
      and outreach_role_type = p_role_type
      and outreach_shift_date = p_shift_date
      and outreach_start_time = p_start_time
      and outreach_end_time = p_end_time;
  else
    select id into v_conversation_id
    from public.conversations
    where conversation_type = 'outreach'
      and clinic_id = v_clinic_id
      and worker_id = p_worker_id
      and outreach_shift_date is null
      and outreach_start_time is null
      and outreach_end_time is null
      and outreach_role_type is null;
  end if;

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
      case when v_has_shift_context and p_shift_date is not null then p_role_type else null end,
      case when v_has_shift_context and p_shift_date is not null then p_shift_date else null end,
      case when v_has_shift_context and p_shift_date is not null then p_start_time else null end,
      case when v_has_shift_context and p_shift_date is not null then p_end_time else null end
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

revoke all on function public.start_clinic_fill_in_outreach(uuid, text, text, date, time, time, boolean) from public;
grant execute on function public.start_clinic_fill_in_outreach(uuid, text, text, date, time, time, boolean) to authenticated;
