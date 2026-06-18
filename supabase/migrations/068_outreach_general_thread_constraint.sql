-- Ensure general outreach threads (no shift context) are allowed.
-- Safe to re-run if 066 was skipped or only partially applied.

alter table public.conversations
  drop constraint if exists conversations_type_application_id_check;

alter table public.conversations
  add constraint conversations_type_application_id_check
  check (
    (conversation_type = 'application' and application_id is not null)
    or (conversation_type = 'general' and application_id is null)
    or (
      conversation_type = 'outreach'
      and application_id is null
      and (
        (
          outreach_role_type is null
          and outreach_shift_date is null
          and outreach_start_time is null
          and outreach_end_time is null
        )
        or (
          outreach_shift_date is not null
          and outreach_start_time is not null
          and outreach_end_time is not null
          and outreach_role_type is not null
        )
      )
    )
  );

create unique index if not exists conversations_outreach_general_unique
  on public.conversations (clinic_id, worker_id)
  where conversation_type = 'outreach'
    and outreach_shift_date is null
    and outreach_start_time is null
    and outreach_end_time is null
    and outreach_role_type is null;
