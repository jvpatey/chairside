-- Per-participant inbox hide for conversations (soft delete from message list).

alter table public.conversations
  add column if not exists worker_hidden_at timestamptz,
  add column if not exists clinic_hidden_at timestamptz;

create or replace function public.hide_worker_conversation(p_conversation_id uuid)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.conversations%rowtype;
begin
  select * into v_row
  from public.conversations
  where id = p_conversation_id
    and worker_id = auth.uid();

  if not found then
    raise exception 'Conversation not found';
  end if;

  if v_row.worker_hidden_at is not null then
    return v_row;
  end if;

  update public.conversations
  set worker_hidden_at = now(),
      updated_at = now()
  where id = p_conversation_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.hide_clinic_conversation(p_conversation_id uuid)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.conversations%rowtype;
begin
  select * into v_row
  from public.conversations
  where id = p_conversation_id
    and clinic_id = auth.uid();

  if not found then
    raise exception 'Conversation not found';
  end if;

  if v_row.clinic_hidden_at is not null then
    return v_row;
  end if;

  update public.conversations
  set clinic_hidden_at = now(),
      updated_at = now()
  where id = p_conversation_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.hide_worker_conversation(uuid) from public;
revoke all on function public.hide_clinic_conversation(uuid) from public;
grant execute on function public.hide_worker_conversation(uuid) to authenticated;
grant execute on function public.hide_clinic_conversation(uuid) to authenticated;

create or replace function public.unhide_conversation_for_recipient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    worker_hidden_at = case
      when worker_id is distinct from NEW.sender_id then null
      else worker_hidden_at
    end,
    clinic_hidden_at = case
      when clinic_id is distinct from NEW.sender_id then null
      else clinic_hidden_at
    end,
    updated_at = now()
  where id = NEW.conversation_id
    and (
      (worker_id is distinct from NEW.sender_id and worker_hidden_at is not null)
      or (clinic_id is distinct from NEW.sender_id and clinic_hidden_at is not null)
    );

  return NEW;
end;
$$;

drop trigger if exists messages_unhide_conversation_for_recipient on public.messages;

create trigger messages_unhide_conversation_for_recipient
  after insert on public.messages
  for each row execute function public.unhide_conversation_for_recipient();
