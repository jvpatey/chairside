-- General clinic inquiries: opt-in setting and non-application conversations.

alter table public.clinic_profiles
  add column if not exists accepts_general_candidate_messages boolean not null default false;

comment on column public.clinic_profiles.accepts_general_candidate_messages is
  'When true, completed candidates in the same province may start a general inquiry thread.';

alter table public.conversations
  drop constraint if exists conversations_application_id_key;

alter table public.conversations
  alter column application_id drop not null;

alter table public.conversations
  add column if not exists conversation_type text not null default 'application';

alter table public.conversations
  drop constraint if exists conversations_conversation_type_check;

alter table public.conversations
  add constraint conversations_conversation_type_check
  check (conversation_type in ('application', 'general'));

alter table public.conversations
  drop constraint if exists conversations_type_application_id_check;

alter table public.conversations
  add constraint conversations_type_application_id_check
  check (
    (conversation_type = 'application' and application_id is not null)
    or (conversation_type = 'general' and application_id is null)
  );

create unique index if not exists conversations_application_id_unique
  on public.conversations (application_id)
  where conversation_type = 'application' and application_id is not null;

create unique index if not exists conversations_general_worker_clinic_unique
  on public.conversations (worker_id, clinic_id)
  where conversation_type = 'general';

create or replace function public.is_worker_profile_complete(p_worker_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.worker_profiles wp
    where wp.id = p_worker_id
      and wp.setup_completed_at is not null
  );
$$;

revoke all on function public.is_worker_profile_complete(uuid) from public;
grant execute on function public.is_worker_profile_complete(uuid) to authenticated;

create or replace function public.get_or_create_general_conversation(p_clinic_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_worker_id uuid;
  v_worker_province text;
  v_clinic public.clinic_profiles%rowtype;
  v_conversation_id uuid;
begin
  v_worker_id := auth.uid();
  if v_worker_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_worker_id and role = 'worker'
  ) then
    raise exception 'Only workers can start general inquiries';
  end if;

  if not public.is_worker_profile_complete(v_worker_id) then
    raise exception 'Complete your profile before messaging clinics';
  end if;

  select province into v_worker_province
  from public.worker_profiles
  where id = v_worker_id;

  if v_worker_province is null then
    raise exception 'Worker province is required';
  end if;

  select * into v_clinic
  from public.clinic_profiles
  where id = p_clinic_id;

  if not found then
    raise exception 'Clinic not found';
  end if;

  if v_clinic.setup_completed_at is null then
    raise exception 'Clinic profile is not available';
  end if;

  if not v_clinic.accepts_general_candidate_messages then
    raise exception 'This clinic is not accepting general messages';
  end if;

  if v_clinic.province is distinct from v_worker_province then
    raise exception 'Clinic is not in your province';
  end if;

  select id into v_conversation_id
  from public.conversations
  where worker_id = v_worker_id
    and clinic_id = p_clinic_id
    and conversation_type = 'general';

  if found then
    return v_conversation_id;
  end if;

  insert into public.conversations (
    worker_id,
    clinic_id,
    conversation_type,
    application_id
  )
  values (
    v_worker_id,
    p_clinic_id,
    'general',
    null
  )
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

revoke all on function public.get_or_create_general_conversation(uuid) from public;
grant execute on function public.get_or_create_general_conversation(uuid) to authenticated;

drop policy if exists "Participants send messages when open" on public.messages;

create policy "Participants send messages when open"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.worker_id = auth.uid() or c.clinic_id = auth.uid())
        and c.messaging_closed_at is null
        and (
          (
            c.conversation_type = 'application'
            and exists (
              select 1
              from public.applications a
              where a.id = c.application_id
                and public.application_messaging_open(a.status)
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
              or public.is_worker_profile_complete(c.worker_id)
            )
          )
        )
    )
  );
