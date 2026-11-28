-- Per-post fill-in pricing.
--
-- Replaces tier-based fill-in limits (see 143) with:
--   * a free allowance of 2 fill-in posts per clinic (per location for group accounts),
--     counted from launch (the ledger starts empty, so existing clinics start at 0), and
--   * paid credits (CA$8 each, sold as App Store / RevenueCat consumables).
--
-- A fill-in is charged once, on the transition to live. Edits to a live post never charge.
-- A live post that is closed within 15 minutes of going live is refunded (credit returned to
-- the balance, or the free post restored). Refunds are never cash.

-- ---------------------------------------------------------------------------
-- Ledger
-- ---------------------------------------------------------------------------

create table if not exists public.fill_in_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.profiles (id) on delete cascade,
  location_id uuid references public.clinic_locations (id) on delete set null,
  shift_post_id uuid references public.shift_posts (id) on delete set null,
  -- free_post / spend: a fill-in was charged. free_refund / refund: that charge was reversed.
  -- purchase: credits bought (delta = quantity).
  reason text not null check (reason in ('free_post', 'free_refund', 'spend', 'refund', 'purchase')),
  delta int not null default 0,
  external_ref text unique,
  created_at timestamptz not null default now()
);

create index if not exists fill_in_credit_ledger_clinic_idx
  on public.fill_in_credit_ledger (clinic_id, created_at desc);
create index if not exists fill_in_credit_ledger_shift_idx
  on public.fill_in_credit_ledger (shift_post_id);

alter table public.fill_in_credit_ledger enable row level security;

drop policy if exists "Clinics read own fill-in ledger" on public.fill_in_credit_ledger;
create policy "Clinics read own fill-in ledger"
  on public.fill_in_credit_ledger for select
  using (auth.uid() = clinic_id);

revoke all on public.fill_in_credit_ledger from anon, authenticated;
grant select on public.fill_in_credit_ledger to authenticated;

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------

create or replace function public.fill_in_free_allowance()
returns int
language sql
immutable
as $$
  select 2;
$$;

-- ---------------------------------------------------------------------------
-- Derived counts
-- ---------------------------------------------------------------------------

-- Free posts used in scope. Individuals: per clinic. Groups: per location.
create or replace function public.fill_in_free_posts_used(
  p_clinic_id uuid,
  p_location_id uuid default null
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(
           case l.reason
             when 'free_post' then 1
             when 'free_refund' then -1
             else 0
           end
         ), 0)::int
  from public.fill_in_credit_ledger l
  where l.clinic_id = p_clinic_id
    and (
      public.clinic_account_type(p_clinic_id) <> 'group'
      -- "is not distinct from" so a group post without a location is counted, not free forever.
      or l.location_id is not distinct from p_location_id
    );
$$;

create or replace function public.fill_in_credit_balance(p_clinic_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(l.delta), 0)::int
  from public.fill_in_credit_ledger l
  where l.clinic_id = p_clinic_id;
$$;

-- True when a fill-in currently holds a charge (a charge exists with no matching reversal).
create or replace function public.fill_in_post_charge_active(p_shift_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    count(*) filter (where l.reason in ('free_post', 'spend'))
    - count(*) filter (where l.reason in ('free_refund', 'refund'))
  ) > 0
  from public.fill_in_credit_ledger l
  where l.shift_post_id = p_shift_post_id;
$$;

-- ---------------------------------------------------------------------------
-- Charge on going live
-- ---------------------------------------------------------------------------

create or replace function public.charge_fill_in_on_live()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used int;
  v_balance int;
  v_reason text;
begin
  if coalesce(new.is_sourced, false) then
    return new;
  end if;

  -- Only fill-ins that are (or stay) live for a current or future date are charged.
  if not (new.status = 'live' and new.shift_date >= current_date) then
    return new;
  end if;

  -- Edits to a post that was already live do not charge.
  if tg_op = 'UPDATE' and old.status = 'live' and old.shift_date >= current_date then
    return new;
  end if;

  -- Re-opened after a close that was not refunded: the charge still stands.
  if public.fill_in_post_charge_active(new.id) then
    return new;
  end if;

  -- Serialise charges per clinic so two simultaneous publishes cannot both use the last credit.
  perform pg_advisory_xact_lock(hashtextextended(new.clinic_id::text, 0));

  v_used := public.fill_in_free_posts_used(new.clinic_id, new.location_id);
  if v_used < public.fill_in_free_allowance() then
    v_reason := 'free_post';
  else
    v_balance := public.fill_in_credit_balance(new.clinic_id);
    if v_balance < 1 then
      raise exception 'No fill-in credits left. Buy a fill-in to publish.'
        using errcode = 'P0001';
    end if;
    v_reason := 'spend';
  end if;

  insert into public.fill_in_credit_ledger (clinic_id, location_id, shift_post_id, reason, delta)
  values (
    new.clinic_id,
    new.location_id,
    new.id,
    v_reason,
    case when v_reason = 'spend' then -1 else 0 end
  );

  return new;
end;
$$;

-- Named with a z_ prefix so it runs after shift_posts_stamp_attribution (which sets location_id).
drop trigger if exists z_charge_fill_in_on_live on public.shift_posts;
create trigger z_charge_fill_in_on_live
  before insert or update on public.shift_posts
  for each row
  execute function public.charge_fill_in_on_live();

-- Retire the tier-based fill-in publish check. Roles keep their existing trigger.
drop trigger if exists enforce_clinic_opportunity_limit_shift_posts on public.shift_posts;

-- ---------------------------------------------------------------------------
-- Grants from the payment provider (service role only)
-- ---------------------------------------------------------------------------

create or replace function public.grant_fill_in_credits(
  p_clinic_id uuid,
  p_quantity int,
  p_external_ref text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'quantity must be positive';
  end if;

  insert into public.fill_in_credit_ledger (clinic_id, reason, delta, external_ref)
  values (p_clinic_id, 'purchase', p_quantity, p_external_ref)
  on conflict (external_ref) do nothing;
end;
$$;

revoke all on function public.grant_fill_in_credits(uuid, int, text) from public, anon, authenticated;
grant execute on function public.grant_fill_in_credits(uuid, int, text) to service_role;

-- ---------------------------------------------------------------------------
-- Client-facing state
-- ---------------------------------------------------------------------------

create or replace function public.get_fill_in_pricing_state(p_location_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid := auth.uid();
  v_used int;
  v_remaining int;
  v_balance int;
begin
  if v_clinic_id is null then
    raise exception 'Not authenticated';
  end if;

  v_used := public.fill_in_free_posts_used(v_clinic_id, p_location_id);
  v_remaining := greatest(0, public.fill_in_free_allowance() - v_used);
  v_balance := public.fill_in_credit_balance(v_clinic_id);

  return jsonb_build_object(
    'free_allowance', public.fill_in_free_allowance(),
    'free_remaining', v_remaining,
    'credit_balance', v_balance,
    'can_publish_fill_in', v_remaining > 0 or v_balance > 0
  );
end;
$$;

revoke all on function public.get_fill_in_pricing_state(uuid) from public, anon;
grant execute on function public.get_fill_in_pricing_state(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Close a fill-in (with 15-minute grace refund)
-- ---------------------------------------------------------------------------

create or replace function public.close_shift_post(p_shift_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sp public.shift_posts%rowtype;
  v_charge public.fill_in_credit_ledger%rowtype;
  v_refunded boolean := false;
begin
  select * into v_sp
  from public.shift_posts
  where id = p_shift_post_id
  for update;

  if not found then
    raise exception 'Shift not found';
  end if;

  -- Same access rules as the shift_posts insert policy.
  if not (
    (
      auth.uid() = v_sp.clinic_id
      or public.is_clinic_org_member(coalesce(v_sp.organization_id, v_sp.clinic_id))
    )
    and (
      auth.uid() = v_sp.clinic_id
      or public.is_clinic_org_owner(coalesce(v_sp.organization_id, v_sp.clinic_id))
      or v_sp.location_id is null
      or public.can_access_clinic_location(coalesce(v_sp.organization_id, v_sp.clinic_id), v_sp.location_id)
    )
  ) then
    raise exception 'Not allowed to close this fill-in';
  end if;

  if v_sp.status = 'closed' then
    return jsonb_build_object('refunded', false);
  end if;

  select * into v_charge
  from public.fill_in_credit_ledger l
  where l.shift_post_id = p_shift_post_id
    and l.reason in ('free_post', 'spend')
  order by l.created_at desc
  limit 1;

  if found then
    if v_sp.status = 'live'
       and public.fill_in_post_charge_active(p_shift_post_id)
       and v_charge.created_at >= now() - interval '15 minutes' then
      insert into public.fill_in_credit_ledger (clinic_id, location_id, shift_post_id, reason, delta)
      values (
        v_sp.clinic_id,
        v_sp.location_id,
        p_shift_post_id,
        case when v_charge.reason = 'spend' then 'refund' else 'free_refund' end,
        case when v_charge.reason = 'spend' then 1 else 0 end
      );
      v_refunded := true;
    end if;
  end if;

  update public.shift_posts
  set status = 'closed'
  where id = p_shift_post_id;

  return jsonb_build_object('refunded', v_refunded);
end;
$$;

revoke all on function public.close_shift_post(uuid) from public, anon;
grant execute on function public.close_shift_post(uuid) to authenticated;
