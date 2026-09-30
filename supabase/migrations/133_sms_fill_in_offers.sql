-- Reply-to-request for fill-in SMS: each fill-in text carries a short offer code the worker
-- can reply with ("YES 4821"). Only the notify / pingram-sms-inbound edge functions touch
-- this table (service role); workers never read it directly.

create table if not exists public.sms_fill_in_offers (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles (id) on delete cascade,
  shift_post_id uuid not null references public.shift_posts (id) on delete cascade,
  code text not null check (code ~ '^[0-9]{4}$'),
  phone_e164 text not null,
  pingram_tracking_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  unique (worker_id, shift_post_id)
);

create unique index if not exists sms_fill_in_offers_open_code_idx
  on public.sms_fill_in_offers (worker_id, code)
  where used_at is null;

create index if not exists sms_fill_in_offers_worker_open_idx
  on public.sms_fill_in_offers (worker_id, expires_at)
  where used_at is null;

alter table public.sms_fill_in_offers enable row level security;

-- Returns the worker's offer code for this shift, reusing an existing code when the fill-in
-- is re-sent (e.g. after an edit). Expires at the end of the shift day (Atlantic time).
create or replace function public.create_sms_fill_in_offer(
  p_worker_id uuid,
  p_shift_post_id uuid,
  p_phone_e164 text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift_date date;
  v_expires_at timestamptz;
  v_code text;
  v_attempt int := 0;
begin
  select shift_date into v_shift_date from public.shift_posts where id = p_shift_post_id;
  if v_shift_date is null then
    raise exception 'Shift not found';
  end if;
  v_expires_at := ((v_shift_date + 1)::timestamp) at time zone 'America/Halifax';

  select code into v_code
  from public.sms_fill_in_offers
  where worker_id = p_worker_id
    and shift_post_id = p_shift_post_id;

  if v_code is not null then
    update public.sms_fill_in_offers
    set phone_e164 = p_phone_e164,
        expires_at = v_expires_at
    where worker_id = p_worker_id
      and shift_post_id = p_shift_post_id;
    return v_code;
  end if;

  -- Free up codes held by this worker's expired offers.
  update public.sms_fill_in_offers
  set used_at = now()
  where worker_id = p_worker_id
    and used_at is null
    and expires_at <= now();

  loop
    v_attempt := v_attempt + 1;
    v_code := lpad((floor(random() * 10000))::int::text, 4, '0');
    begin
      insert into public.sms_fill_in_offers (worker_id, shift_post_id, code, phone_e164, expires_at)
      values (p_worker_id, p_shift_post_id, v_code, p_phone_e164, v_expires_at);
      return v_code;
    exception when unique_violation then
      if v_attempt >= 20 then
        raise;
      end if;
    end;
  end loop;
end;
$$;

-- Creates (or re-opens) a cover request on behalf of a worker who replied to a fill-in SMS.
-- Mirrors the app's request flow: the shift must be live, a worker can hold one request per
-- shift, and a previously declined request is re-opened through re_request_shift_cover.
create or replace function public.request_shift_cover_from_sms(
  p_worker_id uuid,
  p_shift_post_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift public.shift_posts%rowtype;
  v_existing public.applications%rowtype;
begin
  select * into v_shift from public.shift_posts where id = p_shift_post_id;
  if not found then
    return 'shift_unavailable';
  end if;

  if v_shift.clinic_id = p_worker_id
    or not exists (select 1 from public.profiles where id = p_worker_id and role = 'worker')
    or not exists (
      select 1 from public.worker_profiles
      where id = p_worker_id and setup_completed_at is not null
    )
  then
    return 'not_eligible';
  end if;

  if v_shift.shift_date < (now() at time zone 'America/Halifax')::date then
    return 'shift_unavailable';
  end if;

  select * into v_existing
  from public.applications
  where worker_id = p_worker_id
    and shift_post_id = p_shift_post_id
  for update;

  if found then
    if v_existing.status = 'hired' then
      return 'already_confirmed';
    end if;
    if v_existing.status <> 'rejected' then
      return 'already_requested';
    end if;

    -- re_request_shift_cover authorizes via auth.uid(); scope the worker's identity to this
    -- transaction so the same rules run for SMS replies.
    perform set_config(
      'request.jwt.claims',
      json_build_object('sub', p_worker_id, 'role', 'authenticated')::text,
      true
    );
    begin
      perform public.re_request_shift_cover(p_shift_post_id, null);
    exception when others then
      return 'shift_unavailable';
    end;
    return 'requested';
  end if;

  if v_shift.status <> 'live'
    or exists (
      select 1 from public.applications
      where shift_post_id = p_shift_post_id and status = 'hired'
    )
  then
    return 'shift_unavailable';
  end if;

  begin
    insert into public.applications (worker_id, shift_post_id, status, updated_at)
    values (p_worker_id, p_shift_post_id, 'applied', now());
  exception when unique_violation then
    return 'already_requested';
  end;

  return 'requested';
end;
$$;

revoke all on function public.create_sms_fill_in_offer(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.create_sms_fill_in_offer(uuid, uuid, text) to service_role;

revoke all on function public.request_shift_cover_from_sms(uuid, uuid) from public, anon, authenticated;
grant execute on function public.request_shift_cover_from_sms(uuid, uuid) to service_role;
