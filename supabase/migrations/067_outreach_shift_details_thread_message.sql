-- When a clinic starts shift-specific fill-in outreach, post shift details as their own
-- in-thread message before the clinic's note so workers see the context in the chat.

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
  v_created_conversation boolean := false;
  v_shift_details_message text;
  v_role_label text;
  v_date_label text;
  v_hours_label text;
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
    v_created_conversation := true;
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

  if p_shift_date is not null and v_created_conversation then
    v_role_label := case p_role_type
      when 'hygienist' then 'Dental Hygienist'
      when 'assistant' then 'Dental Assistant'
      when 'admin' then 'Office Admin'
      when 'office_manager' then 'Office Manager'
      when 'treatment_coordinator' then 'Treatment Coordinator'
      when 'dentist' then 'Dentist'
      when 'other' then 'Other'
      else initcap(replace(p_role_type, '_', ' '))
    end;

    v_date_label := case
      when p_shift_date = current_date then
        'Today · ' || to_char(p_shift_date, 'FMDay, FMMonth FMDD')
      when p_shift_date = current_date + interval '1 day' then
        'Tomorrow · ' || to_char(p_shift_date, 'FMDay, FMMonth FMDD')
      else
        to_char(p_shift_date, 'FMDay, FMMonth FMDD, YYYY')
    end;

    v_hours_label :=
      trim(to_char(p_start_time, 'FMHH12:MI AM'))
      || ' – '
      || trim(to_char(p_end_time, 'FMHH12:MI AM'));

    v_shift_details_message :=
      'Shift details: '
      || v_role_label
      || ' · '
      || v_date_label
      || ' · '
      || v_hours_label;

    insert into public.messages (conversation_id, sender_id, body, trigger_sms_alert)
    values (v_conversation_id, v_clinic_id, v_shift_details_message, false);
  end if;

  insert into public.messages (conversation_id, sender_id, body, trigger_sms_alert)
  values (v_conversation_id, v_clinic_id, v_message_body, v_send_sms);

  return v_conversation_id;
end;
$$;

revoke all on function public.start_clinic_fill_in_outreach(uuid, text, text, date, time, time, boolean) from public;
grant execute on function public.start_clinic_fill_in_outreach(uuid, text, text, date, time, time, boolean) to authenticated;
