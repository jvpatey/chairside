-- Clinics may archive decided applications from their applicant lists without deleting records.

alter table public.applications
  add column if not exists clinic_hidden_at timestamptz;

create or replace function public.hide_clinic_application(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
begin
  select a.* into v_row
  from public.applications a
  where a.id = application_id
    and (
      (
        a.job_post_id is not null
        and exists (
          select 1
          from public.job_posts jp
          where jp.id = a.job_post_id
            and jp.clinic_id = auth.uid()
        )
      )
      or (
        a.shift_post_id is not null
        and exists (
          select 1
          from public.shift_posts sp
          where sp.id = a.shift_post_id
            and sp.clinic_id = auth.uid()
        )
      )
    );

  if not found then
    raise exception 'Application not found';
  end if;

  if v_row.clinic_hidden_at is not null then
    return v_row;
  end if;

  if v_row.status not in ('rejected', 'selected', 'hired') then
    raise exception 'Only decided applications can be removed from the list';
  end if;

  update public.applications
  set clinic_hidden_at = now(),
      updated_at = now()
  where id = application_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.hide_clinic_application(uuid) to authenticated;
