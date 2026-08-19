-- Expo Push device tokens (replaces Pingram Mobile Push token storage).

create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_push_tokens_expo_push_token_key unique (expo_push_token)
);

comment on table public.user_push_tokens is
  'Expo Push tokens per device. notify edge function reads these; Pingram no longer delivers native push.';
comment on column public.user_push_tokens.expo_push_token is
  'ExpoPushToken[…] string from expo-notifications getExpoPushTokenAsync';
comment on column public.user_push_tokens.platform is
  'ios | android';

create index if not exists user_push_tokens_user_id_idx
  on public.user_push_tokens (user_id);

alter table public.user_push_tokens enable row level security;

create policy "Users read own push tokens"
  on public.user_push_tokens for select
  using (auth.uid() = user_id);

create policy "Users insert own push tokens"
  on public.user_push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users update own push tokens"
  on public.user_push_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own push tokens"
  on public.user_push_tokens for delete
  using (auth.uid() = user_id);

-- Allows reassigning a device token when the same Expo token signs in as a different user.
create or replace function public.upsert_user_push_token(
  p_expo_push_token text,
  p_platform text
)
returns public.user_push_tokens
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_push_tokens;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_platform not in ('ios', 'android') then
    raise exception 'Invalid platform';
  end if;

  if p_expo_push_token is null or length(trim(p_expo_push_token)) = 0 then
    raise exception 'expo_push_token is required';
  end if;

  insert into public.user_push_tokens (user_id, expo_push_token, platform, updated_at)
  values (auth.uid(), trim(p_expo_push_token), p_platform, now())
  on conflict (expo_push_token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.upsert_user_push_token(text, text) from public;
grant execute on function public.upsert_user_push_token(text, text) to authenticated;
