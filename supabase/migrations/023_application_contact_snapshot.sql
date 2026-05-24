-- Snapshot worker name and address on application insert.
-- Also ensures kit snapshot columns from 021/022 exist (safe if those migrations were skipped).

alter table public.applications
  add column if not exists resume_storage_path text,
  add column if not exists software_used text[] not null default '{}',
  add column if not exists practice_types text[] not null default '{}',
  add column if not exists worker_display_name text,
  add column if not exists worker_address text;

create or replace function public.format_worker_address(p_worker public.worker_profiles)
returns text
language sql immutable as $$
  select nullif(
    trim(both ', ' from concat_ws(
      ', ',
      nullif(trim(p_worker.address_line1), ''),
      nullif(trim(p_worker.address_line2), ''),
      nullif(trim(p_worker.city), ''),
      nullif(trim(p_worker.province), ''),
      nullif(trim(p_worker.postal_code), '')
    )),
    ''
  );
$$;

create or replace function public.snapshot_application_on_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_worker public.worker_profiles%rowtype;
  v_display_name text;
begin
  select * into v_worker from public.worker_profiles where id = new.worker_id;

  if found then
    select display_name into v_display_name
    from public.profiles
    where id = new.worker_id;

    new.years_of_experience := v_worker.years_of_experience;
    new.education := public.format_worker_education(v_worker);
    new.role_type := v_worker.role_type;
    new.license_type := null;
    new.resume_storage_path := v_worker.resume_storage_path;
    new.software_used := coalesce(v_worker.software_used, '{}');
    new.practice_types := coalesce(v_worker.practice_types, '{}');
    new.worker_display_name := nullif(trim(v_display_name), '');
    new.worker_address := public.format_worker_address(v_worker);
  end if;

  new.match_score := public.compute_application_match_score(
    new.worker_id,
    new.job_post_id,
    new.shift_post_id
  );

  return new;
end;
$$;

update public.applications a
set
  worker_display_name = nullif(trim(p.display_name), ''),
  worker_address = public.format_worker_address(w)
from public.worker_profiles w
left join public.profiles p on p.id = w.id
where a.worker_id = w.id
  and (a.worker_display_name is null or a.worker_address is null);

drop policy if exists "Workers insert own applications" on public.applications;

create policy "Workers insert own applications"
  on public.applications for insert
  with check (
    auth.uid() = worker_id
    and status = 'applied'
    and match_score is null
    and years_of_experience is null
    and education is null
    and role_type is null
    and license_type is null
    and resume_storage_path is null
    and software_used = '{}'
    and practice_types = '{}'
    and worker_display_name is null
    and worker_address is null
    and (
      (
        job_post_id is not null
        and shift_post_id is null
        and exists (
          select 1 from public.job_posts
          where job_posts.id = job_post_id and job_posts.status = 'live'
        )
      )
      or (
        shift_post_id is not null
        and job_post_id is null
        and exists (
          select 1 from public.shift_posts
          where shift_posts.id = shift_post_id and shift_posts.status = 'live'
        )
      )
    )
  );
