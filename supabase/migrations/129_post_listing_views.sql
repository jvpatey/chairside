-- Unique professional opens of role / fill-in detail pages (clinic-visible reach).
-- Distinct from worker_shift_post_views, which only tracks badge "seen" state.

create table public.job_post_listing_views (
  worker_id uuid not null references auth.users(id) on delete cascade,
  job_post_id uuid not null references public.job_posts(id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  primary key (worker_id, job_post_id)
);

create index job_post_listing_views_job_post_id_idx
  on public.job_post_listing_views (job_post_id);

create table public.shift_post_listing_views (
  worker_id uuid not null references auth.users(id) on delete cascade,
  shift_post_id uuid not null references public.shift_posts(id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  primary key (worker_id, shift_post_id)
);

create index shift_post_listing_views_shift_post_id_idx
  on public.shift_post_listing_views (shift_post_id);

alter table public.job_post_listing_views enable row level security;
alter table public.shift_post_listing_views enable row level security;

-- Workers may upsert their own view rows; clinics read counts via RPCs only.
create policy "Workers insert own job listing views"
  on public.job_post_listing_views for insert
  with check (auth.uid() = worker_id);

create policy "Workers update own job listing views"
  on public.job_post_listing_views for update
  using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

create policy "Workers insert own shift listing views"
  on public.shift_post_listing_views for insert
  with check (auth.uid() = worker_id);

create policy "Workers update own shift listing views"
  on public.shift_post_listing_views for update
  using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

create or replace function public.record_job_post_listing_view(p_job_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_job_post_id is null then
    return;
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'worker'
  ) then
    return;
  end if;

  if not exists (select 1 from public.job_posts jp where jp.id = p_job_post_id) then
    return;
  end if;

  insert into public.job_post_listing_views (worker_id, job_post_id)
  values (auth.uid(), p_job_post_id)
  on conflict (worker_id, job_post_id)
  do update set last_viewed_at = greatest(
    public.job_post_listing_views.last_viewed_at,
    excluded.last_viewed_at
  );
end;
$$;

create or replace function public.record_shift_post_listing_view(p_shift_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_shift_post_id is null then
    return;
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'worker'
  ) then
    return;
  end if;

  if not exists (select 1 from public.shift_posts sp where sp.id = p_shift_post_id) then
    return;
  end if;

  insert into public.shift_post_listing_views (worker_id, shift_post_id)
  values (auth.uid(), p_shift_post_id)
  on conflict (worker_id, shift_post_id)
  do update set last_viewed_at = greatest(
    public.shift_post_listing_views.last_viewed_at,
    excluded.last_viewed_at
  );
end;
$$;

create or replace function public.get_job_post_listing_view_counts(p_job_post_ids uuid[])
returns table (job_post_id uuid, view_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select v.job_post_id, count(*)::bigint as view_count
  from public.job_post_listing_views v
  inner join public.job_posts jp on jp.id = v.job_post_id
  where p_job_post_ids is not null
    and cardinality(p_job_post_ids) > 0
    and v.job_post_id = any (p_job_post_ids)
    and (
      jp.clinic_id = auth.uid()
      or public.is_clinic_org_member(coalesce(jp.organization_id, jp.clinic_id))
    )
  group by v.job_post_id;
$$;

create or replace function public.get_shift_post_listing_view_counts(p_shift_post_ids uuid[])
returns table (shift_post_id uuid, view_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select v.shift_post_id, count(*)::bigint as view_count
  from public.shift_post_listing_views v
  inner join public.shift_posts sp on sp.id = v.shift_post_id
  where p_shift_post_ids is not null
    and cardinality(p_shift_post_ids) > 0
    and v.shift_post_id = any (p_shift_post_ids)
    and (
      sp.clinic_id = auth.uid()
      or public.is_clinic_org_member(coalesce(sp.organization_id, sp.clinic_id))
    )
  group by v.shift_post_id;
$$;

revoke all on function public.record_job_post_listing_view(uuid) from public;
revoke all on function public.record_shift_post_listing_view(uuid) from public;
revoke all on function public.get_job_post_listing_view_counts(uuid[]) from public;
revoke all on function public.get_shift_post_listing_view_counts(uuid[]) from public;

grant execute on function public.record_job_post_listing_view(uuid) to authenticated;
grant execute on function public.record_shift_post_listing_view(uuid) to authenticated;
grant execute on function public.get_job_post_listing_view_counts(uuid[]) to authenticated;
grant execute on function public.get_shift_post_listing_view_counts(uuid[]) to authenticated;
