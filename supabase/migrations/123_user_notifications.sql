-- In-app notification inbox (replaces Pingram INAPP_WEB).
-- Pingram remains email + SMS only; native push uses Expo via user_push_tokens.

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  deep_link text,
  secondary_id text not null,
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_notifications_user_secondary_key unique (user_id, secondary_id)
);

comment on table public.user_notifications is
  'In-app notification history written by notify edge function. Not delivered via Pingram.';
comment on column public.user_notifications.type is
  'Notification type id (e.g. application_in_progress, message_received).';
comment on column public.user_notifications.secondary_id is
  'Idempotency / dedupe key shared with notification_dispatch_log patterns.';
comment on column public.user_notifications.seen_at is
  'When the user marked the item read in the in-app feed; null = unread.';

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_user_unseen_idx
  on public.user_notifications (user_id)
  where seen_at is null;

alter table public.user_notifications enable row level security;

create policy "Users read own notifications"
  on public.user_notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.user_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Clients never insert/delete; service role (notify) writes rows.
-- Realtime for live bell updates.
alter table public.user_notifications replica identity full;
alter publication supabase_realtime add table public.user_notifications;
