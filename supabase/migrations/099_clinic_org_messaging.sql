-- Allow active clinic org members (owners + managers) to participate in
-- org conversations: read/send messages, mark read, hide, and unhide.

create or replace function public.is_clinic_side_sender(
  p_organization_id uuid,
  p_sender_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_sender_id is not null
    and p_organization_id is not null
    and (
      p_sender_id = p_organization_id
      or exists (
        select 1
        from public.clinic_memberships m
        where m.organization_id = p_organization_id
          and m.user_id = p_sender_id
          and m.status = 'active'
      )
    );
$$;

revoke all on function public.is_clinic_side_sender(uuid, uuid) from public;
grant execute on function public.is_clinic_side_sender(uuid, uuid) to authenticated;

drop policy if exists "Clinics read own conversations" on public.conversations;
create policy "Clinic members read org conversations"
  on public.conversations for select
  using (
    clinic_id = auth.uid()
    or public.is_clinic_org_member(clinic_id)
  );

drop policy if exists "Participants read messages" on public.messages;
create policy "Participants read messages"
  on public.messages for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.worker_id = auth.uid()
          or c.clinic_id = auth.uid()
          or public.is_clinic_org_member(c.clinic_id)
        )
    )
  );

drop policy if exists "Participants send messages when open" on public.messages;
create policy "Participants send messages when open"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.worker_id = auth.uid()
          or c.clinic_id = auth.uid()
          or public.is_clinic_org_member(c.clinic_id)
        )
        and c.messaging_closed_at is null
        and c.worker_account_deleted_at is null
        and c.clinic_account_deleted_at is null
        and (
          (
            c.conversation_type = 'application'
            and exists (
              select 1
              from public.applications a
              where a.id = c.application_id
                and public.application_messaging_open(a.status)
                and a.worker_account_deleted_at is null
                and a.clinic_account_deleted_at is null
            )
          )
          or (
            c.conversation_type = 'general'
            and exists (
              select 1
              from public.clinic_profiles cp
              where cp.id = c.clinic_id
                and cp.accepts_general_candidate_messages = true
            )
            and (
              c.clinic_id = auth.uid()
              or public.is_clinic_org_member(c.clinic_id)
              or public.is_worker_profile_complete(c.worker_id)
            )
          )
          or (
            c.conversation_type = 'outreach'
            and exists (
              select 1
              from public.worker_profiles wp
              where wp.id = c.worker_id
                and wp.accepts_clinic_fill_in_outreach = true
                and wp.short_notice_available = true
                and wp.setup_completed_at is not null
            )
            and exists (
              select 1
              from public.clinic_profiles cp
              where cp.id = c.clinic_id
                and cp.setup_completed_at is not null
            )
          )
        )
    )
  );

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
  elsif auth.uid() = v_conv.clinic_id
     or public.is_clinic_org_member(v_conv.clinic_id) then
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
    and (
      clinic_id = auth.uid()
      or public.is_clinic_org_member(clinic_id)
    );

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

create or replace function public.unhide_conversation_for_recipient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker_id uuid;
  v_clinic_id uuid;
begin
  select worker_id, clinic_id
  into v_worker_id, v_clinic_id
  from public.conversations
  where id = NEW.conversation_id;

  if v_worker_id is null then
    return NEW;
  end if;

  update public.conversations
  set
    worker_hidden_at = case
      when v_worker_id is distinct from NEW.sender_id then null
      else worker_hidden_at
    end,
    clinic_hidden_at = case
      when not public.is_clinic_side_sender(v_clinic_id, NEW.sender_id) then null
      else clinic_hidden_at
    end,
    updated_at = now()
  where id = NEW.conversation_id
    and (
      (v_worker_id is distinct from NEW.sender_id and worker_hidden_at is not null)
      or (
        not public.is_clinic_side_sender(v_clinic_id, NEW.sender_id)
        and clinic_hidden_at is not null
      )
    );

  return NEW;
end;
$$;

drop policy if exists "Clinics read profiles for messaging workers" on public.profiles;
create policy "Clinics read profiles for messaging workers"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.worker_id = profiles.id
        and (
          c.clinic_id = auth.uid()
          or public.is_clinic_org_member(c.clinic_id)
        )
    )
  );

drop policy if exists "Clinics read worker profiles for messaging" on public.worker_profiles;
create policy "Clinics read worker profiles for messaging"
  on public.worker_profiles for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.worker_id = worker_profiles.id
        and (
          c.clinic_id = auth.uid()
          or public.is_clinic_org_member(c.clinic_id)
        )
    )
  );

drop policy if exists "Clinics read worker photos for messaging" on storage.objects;
create policy "Clinics read worker photos for messaging"
  on storage.objects for select
  using (
    bucket_id = 'worker-photos'
    and exists (
      select 1
      from public.conversations c
      join public.worker_profiles wp on wp.id = c.worker_id
      where (
          c.clinic_id = auth.uid()
          or public.is_clinic_org_member(c.clinic_id)
        )
        and c.worker_id::text = (storage.foldername(name))[1]
        and wp.photo_storage_path = name
    )
  );
