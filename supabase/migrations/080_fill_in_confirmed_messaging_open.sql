-- Confirmed fill-ins use status = hired; keep their application threads open for coordination.

create or replace function public.application_messaging_open(p_status text)
returns boolean
language sql
immutable
as $$
  select p_status in (
    'screening_submitted',
    'applied',
    'reviewed',
    'in_progress',
    'interview_offered',
    'interview_scheduled',
    'selected',
    'hired'
  );
$$;

update public.conversations c
set
  messaging_closed_at = null,
  updated_at = now()
from public.applications a
where c.application_id = a.id
  and a.shift_post_id is not null
  and a.status = 'hired'
  and c.messaging_closed_at is not null;
