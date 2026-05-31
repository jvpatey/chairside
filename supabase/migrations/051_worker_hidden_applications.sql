-- Workers may hide terminal or stale applications from their list without deleting records.

alter table public.applications
  add column if not exists worker_hidden_at timestamptz;

create or replace function public.hide_worker_application(application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_post_status text;
begin
  select * into v_row
  from public.applications
  where id = application_id
    and worker_id = auth.uid();

  if not found then
    raise exception 'Application not found';
  end if;

  if v_row.worker_hidden_at is not null then
    return v_row;
  end if;

  if v_row.status not in ('rejected', 'selected', 'hired') then
    if v_row.job_post_id is not null then
      select status into v_post_status
      from public.job_posts
      where id = v_row.job_post_id;

      if v_post_status is null or v_post_status not in ('filled', 'closed') then
        raise exception 'Application is still active';
      end if;
    elsif v_row.shift_post_id is not null then
      select status into v_post_status
      from public.shift_posts
      where id = v_row.shift_post_id;

      if v_post_status is null or v_post_status not in ('filled', 'closed') then
        raise exception 'Application is still active';
      end if;
    else
      raise exception 'Application is still active';
    end if;
  end if;

  update public.applications
  set worker_hidden_at = now(),
      updated_at = now()
  where id = application_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.hide_worker_application(uuid) to authenticated;
