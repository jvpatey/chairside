-- Server-backed seen state for worker open fill-in shift postings (cross-device tab badges).

create table public.worker_shift_post_views (
  worker_id uuid not null references auth.users(id) on delete cascade,
  shift_post_id uuid not null references public.shift_posts(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (worker_id, shift_post_id)
);

create index worker_shift_post_views_worker_id_idx
  on public.worker_shift_post_views (worker_id);

alter table public.worker_shift_post_views enable row level security;

create policy "Workers read own shift post views"
  on public.worker_shift_post_views for select
  using (auth.uid() = worker_id);

create policy "Workers insert own shift post views"
  on public.worker_shift_post_views for insert
  with check (auth.uid() = worker_id);

create policy "Workers update own shift post views"
  on public.worker_shift_post_views for update
  using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

create or replace function public.mark_shift_posts_seen_by_worker(shift_post_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if shift_post_ids is null or cardinality(shift_post_ids) = 0 then
    return;
  end if;

  insert into public.worker_shift_post_views (worker_id, shift_post_id, seen_at)
  select auth.uid(), unnest(shift_post_ids), now()
  on conflict (worker_id, shift_post_id)
  do update set seen_at = greatest(public.worker_shift_post_views.seen_at, excluded.seen_at);
end;
$$;

revoke all on function public.mark_shift_posts_seen_by_worker(uuid[]) from public;
grant execute on function public.mark_shift_posts_seen_by_worker(uuid[]) to authenticated;
