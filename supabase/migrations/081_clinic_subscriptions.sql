-- Clinic subscription entitlements and posting/outreach limits.

create table public.clinic_subscriptions (
  clinic_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'revenuecat',
  provider_customer_id text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  status text not null default 'active' check (
    status in ('active', 'trialing', 'grace_period', 'cancelled', 'expired')
  ),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clinic_subscriptions is
  'Authoritative clinic billing state synced from RevenueCat webhooks and sync endpoint.';

alter table public.clinic_subscriptions enable row level security;

create policy "Clinics read own subscription"
  on public.clinic_subscriptions for select
  using (auth.uid() = clinic_id);

create or replace function public.get_clinic_plan(p_clinic_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select s.plan
      from public.clinic_subscriptions s
      where s.clinic_id = p_clinic_id
        and s.status in ('active', 'trialing', 'grace_period', 'cancelled')
        and (s.current_period_end is null or s.current_period_end > now())
      order by case s.plan when 'pro' then 3 when 'starter' then 2 else 1 end desc
      limit 1
    ),
    'free'
  );
$$;

create or replace function public.clinic_active_opportunity_limit(p_plan text)
returns int
language sql
immutable
as $$
  select case p_plan
    when 'pro' then 2147483647
    when 'starter' then 3
    else 1
  end;
$$;

create or replace function public.get_clinic_active_opportunity_count(p_clinic_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select (
    (
      select count(*)::int
      from public.job_posts jp
      where jp.clinic_id = p_clinic_id
        and jp.status = 'live'
    )
    +
    (
      select count(*)::int
      from public.shift_posts sp
      where sp.clinic_id = p_clinic_id
        and sp.status = 'live'
        and sp.shift_date >= current_date
    )
  );
$$;

create or replace function public.clinic_can_use_feature(p_clinic_id uuid, p_feature text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plan text := public.get_clinic_plan(p_clinic_id);
begin
  case p_feature
    when 'fill_in_outreach', 'fill_in_sms' then
      return v_plan in ('starter', 'pro');
    when 'priority_listing' then
      return v_plan = 'pro';
    else
      return false;
  end case;
end;
$$;

create or replace function public.assert_clinic_can_publish_opportunity(
  p_clinic_id uuid,
  p_exclude_job_id uuid default null,
  p_exclude_shift_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit int;
  v_count int;
begin
  v_plan := public.get_clinic_plan(p_clinic_id);
  v_limit := public.clinic_active_opportunity_limit(v_plan);

  if v_limit >= 2147483647 then
    return;
  end if;

  select (
    (
      select count(*)::int
      from public.job_posts jp
      where jp.clinic_id = p_clinic_id
        and jp.status = 'live'
        and (p_exclude_job_id is null or jp.id <> p_exclude_job_id)
    )
    +
    (
      select count(*)::int
      from public.shift_posts sp
      where sp.clinic_id = p_clinic_id
        and sp.status = 'live'
        and sp.shift_date >= current_date
        and (p_exclude_shift_id is null or sp.id <> p_exclude_shift_id)
    )
  )
  into v_count;

  if v_count >= v_limit then
    raise exception 'Active posting limit reached. Upgrade your plan to publish more roles or fill-ins.';
  end if;
end;
$$;

create or replace function public.enforce_clinic_opportunity_limit_on_job_posts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

drop trigger if exists enforce_clinic_opportunity_limit_job_posts on public.job_posts;
create trigger enforce_clinic_opportunity_limit_job_posts
  before insert or update on public.job_posts
  for each row
  execute function public.enforce_clinic_opportunity_limit_on_job_posts();

drop trigger if exists enforce_clinic_opportunity_limit_shift_posts on public.shift_posts;
create trigger enforce_clinic_opportunity_limit_shift_posts
  before insert or update on public.shift_posts
  for each row
  execute function public.enforce_clinic_opportunity_limit_on_shift_posts();

create or replace function public.get_clinic_billing_state(p_clinic_id uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid := p_clinic_id;
  v_plan text;
  v_status text := 'active';
  v_limit int;
  v_count int;
  v_period_end timestamptz;
begin
  if v_clinic_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles where id = v_clinic_id and role = 'clinic'
  ) then
    raise exception 'Only clinics can read billing state';
  end if;

  select s.plan, s.status, s.current_period_end
  into v_plan, v_status, v_period_end
  from public.clinic_subscriptions s
  where s.clinic_id = v_clinic_id
    and s.status in ('active', 'trialing', 'grace_period', 'cancelled')
    and (s.current_period_end is null or s.current_period_end > now())
  order by case s.plan when 'pro' then 3 when 'starter' then 2 else 1 end desc
  limit 1;

  if not found then
    v_plan := 'free';
    v_status := 'active';
    v_period_end := null;
  end if;

  v_limit := public.clinic_active_opportunity_limit(v_plan);
  v_count := public.get_clinic_active_opportunity_count(v_clinic_id);

  return jsonb_build_object(
    'plan', v_plan,
    'status', v_status,
    'active_opportunity_count', v_count,
    'active_opportunity_limit', case when v_limit >= 2147483647 then null else v_limit end,
    'can_publish_opportunity', v_limit >= 2147483647 or v_count < v_limit,
    'can_use_fill_in_outreach', public.clinic_can_use_feature(v_clinic_id, 'fill_in_outreach'),
    'can_use_fill_in_sms', public.clinic_can_use_feature(v_clinic_id, 'fill_in_sms'),
    'has_priority_listing', public.clinic_can_use_feature(v_clinic_id, 'priority_listing'),
    'current_period_end', v_period_end
  );
end;
$$;

create or replace function public.get_clinic_plan_map(p_clinic_ids uuid[])
returns table (clinic_id uuid, plan text)
language sql
stable
security definer
set search_path = public
as $$
  with ids as (
    select distinct unnest(p_clinic_ids) as clinic_id
  )
  select
    i.clinic_id,
    coalesce(
      (
        select s.plan
        from public.clinic_subscriptions s
        where s.clinic_id = i.clinic_id
          and s.status in ('active', 'trialing', 'grace_period', 'cancelled')
          and (s.current_period_end is null or s.current_period_end > now())
        order by case s.plan when 'pro' then 3 when 'starter' then 2 else 1 end desc
        limit 1
      ),
      'free'
    ) as plan
  from ids i;
$$;

create or replace function public.upsert_clinic_subscription(
  p_clinic_id uuid,
  p_plan text,
  p_status text,
  p_current_period_end timestamptz default null,
  p_provider_customer_id text default null
)
returns public.clinic_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.clinic_subscriptions;
begin
  if p_plan not in ('free', 'starter', 'pro') then
    raise exception 'Invalid clinic plan';
  end if;

  if p_status not in ('active', 'trialing', 'grace_period', 'cancelled', 'expired') then
    raise exception 'Invalid subscription status';
  end if;

  insert into public.clinic_subscriptions (
    clinic_id,
    provider,
    provider_customer_id,
    plan,
    status,
    current_period_end,
    updated_at
  )
  values (
    p_clinic_id,
    'revenuecat',
    p_provider_customer_id,
    p_plan,
    p_status,
    p_current_period_end,
    now()
  )
  on conflict (clinic_id) do update
  set
    provider_customer_id = coalesce(excluded.provider_customer_id, clinic_subscriptions.provider_customer_id),
    plan = excluded.plan,
    status = excluded.status,
    current_period_end = excluded.current_period_end,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

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
language plpgsql
security definer
set search_path = public
as $$
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
  v_clinic_name text;
  v_clinic_address text;
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

  if not public.clinic_can_use_feature(v_clinic_id, 'fill_in_outreach') then
    raise exception 'Direct fill-in outreach requires a paid clinic plan.';
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
    if not public.clinic_can_use_feature(v_clinic_id, 'fill_in_sms') then
      raise exception 'SMS fill-in alerts require a paid clinic plan.';
    end if;
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

    v_clinic_name := nullif(trim(v_clinic.clinic_name), '');
    v_clinic_address := nullif(trim(both ', ' from concat_ws(', ',
      nullif(trim(v_clinic.address_line1), ''),
      nullif(trim(v_clinic.address_line2), ''),
      nullif(trim(concat_ws(' ',
        nullif(trim(v_clinic.city), ''),
        nullif(trim(v_clinic.province), ''),
        nullif(trim(v_clinic.postal_code), '')
      )), '')
    )), '');

    v_shift_details_message := 'Shift details:';
    if v_clinic_name is not null then
      v_shift_details_message := v_shift_details_message || E'\n' || v_clinic_name;
    end if;
    if v_clinic_address is not null then
      v_shift_details_message := v_shift_details_message || E'\n' || v_clinic_address;
    end if;
    v_shift_details_message :=
      v_shift_details_message
      || E'\n'
      || v_role_label
      || ' · '
      || v_date_label
      || ' · '
      || v_hours_label;

    insert into public.messages (
      conversation_id,
      sender_id,
      body,
      trigger_sms_alert,
      suppress_notification
    )
    values (v_conversation_id, v_clinic_id, v_shift_details_message, false, true);
  end if;

  insert into public.messages (conversation_id, sender_id, body, trigger_sms_alert, suppress_notification)
  values (v_conversation_id, v_clinic_id, v_message_body, v_send_sms, false);

  return v_conversation_id;
end;
$$;

revoke all on function public.get_clinic_plan(uuid) from public;
grant execute on function public.get_clinic_plan(uuid) to authenticated;

revoke all on function public.clinic_active_opportunity_limit(text) from public;
grant execute on function public.clinic_active_opportunity_limit(text) to authenticated;

revoke all on function public.get_clinic_active_opportunity_count(uuid) from public;
grant execute on function public.get_clinic_active_opportunity_count(uuid) to authenticated;

revoke all on function public.clinic_can_use_feature(uuid, text) from public;
grant execute on function public.clinic_can_use_feature(uuid, text) to authenticated;

revoke all on function public.assert_clinic_can_publish_opportunity(uuid, uuid, uuid) from public;

revoke all on function public.get_clinic_billing_state(uuid) from public;
grant execute on function public.get_clinic_billing_state(uuid) to authenticated;

revoke all on function public.get_clinic_plan_map(uuid[]) from public;
grant execute on function public.get_clinic_plan_map(uuid[]) to authenticated;

revoke all on function public.upsert_clinic_subscription(uuid, text, text, timestamptz, text) from public;
grant execute on function public.upsert_clinic_subscription(uuid, text, text, timestamptz, text) to service_role;

revoke all on function public.start_clinic_fill_in_outreach(uuid, text, text, date, time, time, boolean) from public;
grant execute on function public.start_clinic_fill_in_outreach(uuid, text, text, date, time, time, boolean) to authenticated;
