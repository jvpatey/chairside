-- Allow message senders to remove their own messages (body scrubbed, visible to both parties).

create or replace function public.delete_own_message(p_message_id uuid)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_msg public.messages%rowtype;
  v_conv public.conversations%rowtype;
  v_last public.messages%rowtype;
  v_preview text;
  v_body text;
begin
  select * into v_msg
  from public.messages
  where id = p_message_id;

  if not found then
    raise exception 'Message not found';
  end if;

  if v_msg.sender_id is distinct from auth.uid() then
    raise exception 'Not allowed to delete this message';
  end if;

  if v_msg.body = '[Message removed]' then
    return v_msg;
  end if;

  select * into v_conv
  from public.conversations
  where id = v_msg.conversation_id;

  if not found then
    raise exception 'Conversation not found';
  end if;

  if auth.uid() is distinct from v_conv.worker_id
     and auth.uid() is distinct from v_conv.clinic_id
     and not public.is_clinic_org_member(v_conv.clinic_id) then
    raise exception 'Not allowed to delete this message';
  end if;

  update public.messages
  set body = '[Message removed]'
  where id = p_message_id
  returning * into v_msg;

  select * into v_last
  from public.messages m
  where m.conversation_id = v_msg.conversation_id
  order by m.created_at desc
  limit 1;

  if not found then
    update public.conversations
    set
      last_message_at = null,
      last_message_preview = null,
      last_sender_id = null,
      updated_at = now()
    where id = v_msg.conversation_id;
  else
    v_body := trim(v_last.body);
    v_preview := left(v_body, 120);
    if char_length(v_body) > 120 then
      v_preview := v_preview || '…';
    end if;

    update public.conversations
    set
      last_message_at = v_last.created_at,
      last_message_preview = v_preview,
      last_sender_id = v_last.sender_id,
      updated_at = now()
    where id = v_msg.conversation_id;
  end if;

  return v_msg;
end;
$$;

revoke all on function public.delete_own_message(uuid) from public;
grant execute on function public.delete_own_message(uuid) to authenticated;
