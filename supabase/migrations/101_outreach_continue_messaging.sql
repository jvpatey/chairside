-- Allow continuing outreach threads without re-checking live fill-in availability.
-- Starting outreach still requires those flags; send on an open thread does not.

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
