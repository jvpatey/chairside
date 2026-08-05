-- Robust message send authorization:
-- Nested EXISTS(applications/...) in the INSERT policy runs as the invoker and
-- fails for some threads when applications SELECT RLS is owner-only (managers)
-- or when posts/org joins don't match. Evaluate send rules as SECURITY DEFINER.

create or replace function public.conversation_allows_message_send(p_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv public.conversations%rowtype;
  v_app_status text;
begin
  select * into v_conv
  from public.conversations
  where id = p_conversation_id;

  if not found then
    return false;
  end if;

  if auth.uid() is distinct from v_conv.worker_id
     and auth.uid() is distinct from v_conv.clinic_id
     and not public.is_clinic_org_member(v_conv.clinic_id) then
    return false;
  end if;

  if v_conv.messaging_closed_at is not null then
    return false;
  end if;

  if v_conv.worker_account_deleted_at is not null
     or v_conv.clinic_account_deleted_at is not null then
    return false;
  end if;

  if v_conv.conversation_type = 'application' then
    select a.status into v_app_status
    from public.applications a
    where a.id = v_conv.application_id
      and a.worker_account_deleted_at is null
      and a.clinic_account_deleted_at is null;

    if not found then
      return false;
    end if;

    return public.application_messaging_open(v_app_status);
  end if;

  if v_conv.conversation_type = 'general' then
    return exists (
      select 1
      from public.clinic_profiles cp
      where cp.id = v_conv.clinic_id
        and cp.accepts_general_candidate_messages = true
    );
  end if;

  if v_conv.conversation_type = 'outreach' then
    -- Continuing an open outreach thread does not re-check fill-in availability.
    return true;
  end if;

  return false;
end;
$$;

revoke all on function public.conversation_allows_message_send(uuid) from public;
grant execute on function public.conversation_allows_message_send(uuid) to authenticated;

drop policy if exists "Participants send messages when open" on public.messages;
create policy "Participants send messages when open"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.conversation_allows_message_send(conversation_id)
  );

-- Managers need to read applications for posts in their org (same pattern as job/shift RLS).
drop policy if exists "Clinics read applications for own job posts" on public.applications;
create policy "Clinics read applications for own job posts"
  on public.applications for select
  using (
    job_post_id is not null
    and exists (
      select 1
      from public.job_posts jp
      where jp.id = applications.job_post_id
        and (
          jp.clinic_id = auth.uid()
          or public.is_clinic_org_member(coalesce(jp.organization_id, jp.clinic_id))
        )
    )
  );

drop policy if exists "Clinics read applications for own shift posts" on public.applications;
create policy "Clinics read applications for own shift posts"
  on public.applications for select
  using (
    shift_post_id is not null
    and exists (
      select 1
      from public.shift_posts sp
      where sp.id = applications.shift_post_id
        and (
          sp.clinic_id = auth.uid()
          or public.is_clinic_org_member(coalesce(sp.organization_id, sp.clinic_id))
        )
    )
  );
