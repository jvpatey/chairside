-- Delete a confirmed fill-in with a candidate message while retaining worker history.

alter table public.applications
  add column if not exists shift_date date,
  add column if not exists shift_start_time time,
  add column if not exists shift_end_time time,
  add column if not exists shift_role_type text;

alter table public.applications
  drop constraint if exists applications_status_closed_by_check;

alter table public.applications
  add constraint applications_status_closed_by_check
  check (
    status_closed_by is null
    or status_closed_by in ('clinic', 'worker', 'clinic_deleted')
  );

alter table public.applications
  drop constraint if exists applications_post_check;

alter table public.applications
  add constraint applications_post_check
  check (
    (job_post_id is not null and shift_post_id is null)
    or (
      job_post_id is null
      and (shift_post_id is not null or shift_date is not null)
    )
  );

alter table public.applications
  drop constraint if exists applications_shift_post_id_fkey;

alter table public.applications
  add constraint applications_shift_post_id_fkey
  foreign key (shift_post_id) references public.shift_posts(id) on delete set null;

create or replace function public.snapshot_shift_application_on_shift_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.applications a
  set
    shift_date = coalesce(a.shift_date, OLD.shift_date),
    shift_start_time = coalesce(a.shift_start_time, OLD.start_time),
    shift_end_time = coalesce(a.shift_end_time, OLD.end_time),
    shift_role_type = coalesce(a.shift_role_type, OLD.role_type),
    clinic_name = coalesce(a.clinic_name, cp.clinic_name),
    clinic_city = coalesce(a.clinic_city, cp.city),
    clinic_province = coalesce(a.clinic_province, cp.province),
    clinic_logo_storage_path = coalesce(a.clinic_logo_storage_path, cp.logo_storage_path),
    updated_at = now()
  from public.clinic_profiles cp
  where a.shift_post_id = OLD.id
    and cp.id = OLD.clinic_id;

  return OLD;
end;
$$;

drop trigger if exists shift_posts_snapshot_applications_before_delete on public.shift_posts;

create trigger shift_posts_snapshot_applications_before_delete
  before delete on public.shift_posts
  for each row execute function public.snapshot_shift_application_on_shift_delete();

create or replace function public.delete_confirmed_fill_in(
  application_id uuid,
  message text
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.applications;
  v_shift_id uuid;
  v_clinic_id uuid;
  v_message text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select a.*
  into v_row
  from public.applications a
  join public.shift_posts sp on sp.id = a.shift_post_id
  where a.id = application_id
    and a.shift_post_id is not null
    and a.status = 'hired'
    and sp.clinic_id = auth.uid()
  for update of a;

  if not found then
    raise exception 'Confirmed fill-in not found';
  end if;

  v_message := nullif(trim(coalesce(message, '')), '');
  if v_message is null then
    raise exception 'Deletion message is required';
  end if;

  v_shift_id := v_row.shift_post_id;

  select sp.clinic_id
  into v_clinic_id
  from public.shift_posts sp
  where sp.id = v_shift_id;

  update public.applications a
  set
    status = 'rejected',
    status_note = v_message,
    status_closed_by = 'clinic_deleted',
    shift_date = sp.shift_date,
    shift_start_time = sp.start_time,
    shift_end_time = sp.end_time,
    shift_role_type = sp.role_type,
    clinic_name = coalesce(a.clinic_name, cp.clinic_name),
    clinic_city = coalesce(a.clinic_city, cp.city),
    clinic_province = coalesce(a.clinic_province, cp.province),
    clinic_logo_storage_path = coalesce(a.clinic_logo_storage_path, cp.logo_storage_path),
    updated_at = now()
  from public.shift_posts sp
  join public.clinic_profiles cp on cp.id = sp.clinic_id
  where a.id = application_id
    and sp.id = v_shift_id
  returning a.* into v_row;

  delete from public.shift_posts
  where id = v_shift_id
    and clinic_id = v_clinic_id;

  return v_row;
end;
$$;

revoke all on function public.delete_confirmed_fill_in(uuid, text) from public;
grant execute on function public.delete_confirmed_fill_in(uuid, text) to authenticated;
