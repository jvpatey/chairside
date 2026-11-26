-- Companion Accept: clinics decide fill-in cover requests from an SMS link without
-- signing into the full app. Tokens are minted by notify (service role); preview +
-- decide are anon-callable with the raw token from the URL.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.fill_in_decision_tokens (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_decision text check (used_decision is null or used_decision in ('accept', 'decline'))
);

create index if not exists fill_in_decision_tokens_expires_idx
  on public.fill_in_decision_tokens (expires_at)
  where used_at is null;

alter table public.fill_in_decision_tokens enable row level security;

-- Mint (or refresh) a decision token for a fill-in cover request. Returns the raw
-- token for the SMS URL; only the hash is stored. Expires end of shift day (Atlantic).
create or replace function public.create_fill_in_decision_token(p_application_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_shift_id uuid;
  v_shift_date date;
  v_expires_at timestamptz;
  v_token text;
  v_hash text;
begin
  select a.shift_post_id, sp.shift_date
  into v_shift_id, v_shift_date
  from public.applications a
  join public.shift_posts sp on sp.id = a.shift_post_id
  where a.id = p_application_id
    and a.shift_post_id is not null;

  if v_shift_id is null or v_shift_date is null then
    raise exception 'Fill-in application not found';
  end if;

  v_expires_at := ((v_shift_date + 1)::timestamp) at time zone 'America/Halifax';
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into public.fill_in_decision_tokens (application_id, token_hash, expires_at)
  values (p_application_id, v_hash, v_expires_at)
  on conflict (application_id) do update
    set token_hash = excluded.token_hash,
        expires_at = excluded.expires_at,
        used_at = null,
        used_decision = null,
        created_at = now();

  return v_token;
end;
$$;

-- Safe preview for the companion Accept page (anon + token).
create or replace function public.get_fill_in_decision_preview(
  p_application_id uuid,
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_token public.fill_in_decision_tokens%rowtype;
  v_app public.applications%rowtype;
  v_shift public.shift_posts%rowtype;
  v_worker_name text;
  v_clinic_name text;
  v_decision_state text;
begin
  if p_application_id is null or nullif(trim(p_token), '') is null then
    return null;
  end if;

  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

  select * into v_token
  from public.fill_in_decision_tokens
  where application_id = p_application_id
    and token_hash = v_hash;

  if not found then
    return null;
  end if;

  select * into v_app from public.applications where id = p_application_id;
  if not found or v_app.shift_post_id is null then
    return null;
  end if;

  select * into v_shift from public.shift_posts where id = v_app.shift_post_id;
  if not found then
    return null;
  end if;

  v_worker_name := coalesce(
    nullif(trim(v_app.worker_display_name), ''),
    (
      select nullif(trim(p.display_name), '')
      from public.profiles p
      where p.id = v_app.worker_id
    ),
    'A professional'
  );

  select coalesce(nullif(trim(c.clinic_name), ''), 'Clinic')
  into v_clinic_name
  from public.clinic_profiles c
  where c.id = v_shift.clinic_id;

  if v_token.used_at is not null then
    v_decision_state := case v_token.used_decision
      when 'accept' then 'accepted'
      when 'decline' then 'declined'
      else 'already_decided'
    end;
  elsif v_token.expires_at <= now() then
    v_decision_state := 'expired';
  elsif v_shift.status = 'filled' or exists (
    select 1 from public.applications
    where shift_post_id = v_shift.id and status = 'hired' and id <> v_app.id
  ) then
    v_decision_state := 'filled_other';
  elsif v_app.status = 'hired' then
    v_decision_state := 'accepted';
  elsif v_app.status = 'rejected' then
    v_decision_state := 'declined';
  elsif public.is_fill_in_pending_status(v_app.status) and v_shift.status = 'live' then
    v_decision_state := 'pending';
  else
    v_decision_state := 'unavailable';
  end if;

  return jsonb_build_object(
    'application_id', v_app.id,
    'status', v_app.status,
    'decision_state', v_decision_state,
    'worker_name', coalesce(v_worker_name, 'A professional'),
    'role_type', v_shift.role_type,
    'shift_date', v_shift.shift_date,
    'start_time', v_shift.start_time,
    'end_time', v_shift.end_time,
    'compensation', v_shift.compensation,
    'clinic_name', coalesce(v_clinic_name, 'Clinic'),
    'shift_status', v_shift.status
  );
end;
$$;

-- Accept or decline from the SMS companion link (anon + token).
create or replace function public.decide_fill_in_from_sms(
  p_application_id uuid,
  p_token text,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_token public.fill_in_decision_tokens%rowtype;
  v_app public.applications%rowtype;
  v_shift_id uuid;
  v_shift_status text;
  v_decision text := lower(trim(coalesce(p_decision, '')));
begin
  if p_application_id is null or nullif(trim(p_token), '') is null then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if v_decision not in ('accept', 'decline') then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

  select * into v_token
  from public.fill_in_decision_tokens
  where application_id = p_application_id
    and token_hash = v_hash
  for update;

  if not found then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if v_token.used_at is not null then
    return jsonb_build_object(
      'outcome',
      case v_token.used_decision
        when 'accept' then 'accepted'
        when 'decline' then 'declined'
        else 'already_decided'
      end,
      'application_id', p_application_id
    );
  end if;

  if v_token.expires_at <= now() then
    return jsonb_build_object('outcome', 'expired', 'application_id', p_application_id);
  end if;

  select a.shift_post_id, sp.status
  into v_shift_id, v_shift_status
  from public.applications a
  join public.shift_posts sp on sp.id = a.shift_post_id
  where a.id = p_application_id
    and a.shift_post_id is not null
  for update of sp;

  if v_shift_id is null then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  select * into v_app from public.applications where id = p_application_id;
  if not found then
    return jsonb_build_object('outcome', 'unavailable');
  end if;

  if v_shift_status = 'filled' or exists (
    select 1 from public.applications
    where shift_post_id = v_shift_id and status = 'hired' and id <> p_application_id
  ) then
    return jsonb_build_object('outcome', 'filled', 'application_id', p_application_id);
  end if;

  if v_app.status = 'hired' then
    update public.fill_in_decision_tokens
    set used_at = coalesce(used_at, now()), used_decision = coalesce(used_decision, 'accept')
    where application_id = p_application_id;
    return jsonb_build_object('outcome', 'accepted', 'application_id', p_application_id);
  end if;

  if v_app.status = 'rejected' then
    update public.fill_in_decision_tokens
    set used_at = coalesce(used_at, now()), used_decision = coalesce(used_decision, 'decline')
    where application_id = p_application_id;
    return jsonb_build_object('outcome', 'declined', 'application_id', p_application_id);
  end if;

  if not public.is_fill_in_pending_status(v_app.status) or v_shift_status <> 'live' then
    return jsonb_build_object('outcome', 'unavailable', 'application_id', p_application_id);
  end if;

  if v_decision = 'accept' then
    update public.applications
    set status = 'hired', updated_at = now()
    where id = p_application_id;

    update public.applications
    set status = 'rejected', updated_at = now()
    where shift_post_id = v_shift_id
      and id <> p_application_id
      and public.is_fill_in_pending_status(status);

    update public.shift_posts
    set status = 'filled', updated_at = now()
    where id = v_shift_id;

    update public.fill_in_decision_tokens
    set used_at = now(), used_decision = 'accept'
    where application_id = p_application_id;

    return jsonb_build_object('outcome', 'accepted', 'application_id', p_application_id);
  end if;

  -- decline
  update public.applications
  set status = 'rejected', updated_at = now()
  where id = p_application_id;

  update public.fill_in_decision_tokens
  set used_at = now(), used_decision = 'decline'
  where application_id = p_application_id;

  return jsonb_build_object('outcome', 'declined', 'application_id', p_application_id);
end;
$$;

revoke all on function public.create_fill_in_decision_token(uuid) from public, anon, authenticated;
grant execute on function public.create_fill_in_decision_token(uuid) to service_role;

revoke all on function public.get_fill_in_decision_preview(uuid, text) from public;
grant execute on function public.get_fill_in_decision_preview(uuid, text) to anon, authenticated;

revoke all on function public.decide_fill_in_from_sms(uuid, text, text) from public;
grant execute on function public.decide_fill_in_from_sms(uuid, text, text) to anon, authenticated;
