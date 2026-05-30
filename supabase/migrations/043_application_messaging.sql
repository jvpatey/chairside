-- Application-scoped messaging between workers and clinics.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  clinic_id uuid not null references auth.users(id) on delete cascade,
  worker_last_read_at timestamptz,
  clinic_last_read_at timestamptz,
  last_message_at timestamptz,
  last_message_preview text,
  last_sender_id uuid references auth.users(id) on delete set null,
  messaging_closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_worker_inbox_idx
  on public.conversations (worker_id, last_message_at desc nulls last);

create index conversations_clinic_inbox_idx
  on public.conversations (clinic_id, last_message_at desc nulls last);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

create or replace function public.application_clinic_id(p_application public.applications)
returns uuid
language sql stable set search_path = public as $$
  select coalesce(
    (select jp.clinic_id from public.job_posts jp where jp.id = p_application.job_post_id),
    (select sp.clinic_id from public.shift_posts sp where sp.id = p_application.shift_post_id)
  );
$$;

create or replace function public.application_messaging_open(p_status text)
returns boolean
language sql immutable as $$
  select p_status in (
    'applied',
    'reviewed',
    'in_progress',
    'interview_offered',
    'interview_scheduled',
    'selected'
  );
$$;

create or replace function public.create_conversation_for_application()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_clinic_id uuid;
  v_conversation_id uuid;
begin
  v_clinic_id := public.application_clinic_id(NEW);
  if v_clinic_id is null then
    return NEW;
  end if;

  insert into public.conversations (
    application_id,
    worker_id,
    clinic_id,
    messaging_closed_at
  )
  values (
    NEW.id,
    NEW.worker_id,
    v_clinic_id,
    case when public.application_messaging_open(NEW.status) then null else now() end
  )
  returning id into v_conversation_id;

  if NEW.cover_message is not null and trim(NEW.cover_message) <> '' then
    insert into public.messages (conversation_id, sender_id, body, created_at)
    values (v_conversation_id, NEW.worker_id, trim(NEW.cover_message), NEW.created_at);
  end if;

  return NEW;
end;
$$;

create trigger applications_create_conversation_after_insert
  after insert on public.applications
  for each row execute function public.create_conversation_for_application();

create or replace function public.sync_conversation_messaging_closed()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if OLD.status is distinct from NEW.status then
    update public.conversations
    set
      messaging_closed_at = case
        when public.application_messaging_open(NEW.status) then null
        else coalesce(messaging_closed_at, now())
      end,
      updated_at = now()
    where application_id = NEW.id;
  end if;
  return NEW;
end;
$$;

create trigger applications_sync_conversation_messaging_closed
  after update of status on public.applications
  for each row execute function public.sync_conversation_messaging_closed();

create or replace function public.update_conversation_on_message()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_body text;
  v_preview text;
begin
  v_body := trim(NEW.body);
  v_preview := left(v_body, 120);
  if char_length(v_body) > 120 then
    v_preview := v_preview || '…';
  end if;

  update public.conversations
  set
    last_message_at = NEW.created_at,
    last_message_preview = v_preview,
    last_sender_id = NEW.sender_id,
    updated_at = now()
  where id = NEW.conversation_id;

  return NEW;
end;
$$;

create trigger messages_update_conversation_after_insert
  after insert on public.messages
  for each row execute function public.update_conversation_on_message();

insert into public.conversations (application_id, worker_id, clinic_id, messaging_closed_at)
select
  a.id,
  a.worker_id,
  public.application_clinic_id(a),
  case when public.application_messaging_open(a.status) then null else now() end
from public.applications a
where public.application_clinic_id(a) is not null
on conflict (application_id) do nothing;

insert into public.messages (conversation_id, sender_id, body, created_at)
select
  c.id,
  c.worker_id,
  trim(a.cover_message),
  a.created_at
from public.conversations c
join public.applications a on a.id = c.application_id
where a.cover_message is not null
  and trim(a.cover_message) <> ''
  and not exists (
    select 1 from public.messages m where m.conversation_id = c.id
  );

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Workers read own conversations"
  on public.conversations for select
  using (worker_id = auth.uid());

create policy "Clinics read own conversations"
  on public.conversations for select
  using (clinic_id = auth.uid());

create policy "Participants read messages"
  on public.messages for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.worker_id = auth.uid() or c.clinic_id = auth.uid())
    )
  );

create policy "Participants send messages when open"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      join public.applications a on a.id = c.application_id
      where c.id = messages.conversation_id
        and (c.worker_id = auth.uid() or c.clinic_id = auth.uid())
        and c.messaging_closed_at is null
        and public.application_messaging_open(a.status)
    )
  );

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_conv public.conversations%rowtype;
begin
  select * into v_conv from public.conversations where id = p_conversation_id;
  if not found then
    raise exception 'Conversation not found';
  end if;

  if auth.uid() = v_conv.worker_id then
    update public.conversations
    set worker_last_read_at = now(), updated_at = now()
    where id = p_conversation_id;
  elsif auth.uid() = v_conv.clinic_id then
    update public.conversations
    set clinic_last_read_at = now(), updated_at = now()
    where id = p_conversation_id;
  else
    raise exception 'Not a participant';
  end if;
end;
$$;

revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

alter table public.messages replica identity full;

alter publication supabase_realtime add table public.messages;
