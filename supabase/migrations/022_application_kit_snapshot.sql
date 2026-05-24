-- Snapshot software and practice types (specialties) on application insert.

alter table public.applications
  add column if not exists software_used text[] not null default '{}',
  add column if not exists practice_types text[] not null default '{}';

create or replace function public.snapshot_application_on_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_worker public.worker_profiles%rowtype;
begin
  select * into v_worker from public.worker_profiles where id = new.worker_id;

  if found then
    new.years_of_experience := v_worker.years_of_experience;
    new.education := public.format_worker_education(v_worker);
    new.role_type := v_worker.role_type;
    new.license_type := null;
    new.resume_storage_path := v_worker.resume_storage_path;
    new.software_used := coalesce(v_worker.software_used, '{}');
    new.practice_types := coalesce(v_worker.practice_types, '{}');
  end if;

  new.match_score := public.compute_application_match_score(
    new.worker_id,
    new.job_post_id,
    new.shift_post_id
  );

  return new;
end;
$$;

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
