-- The snapshot trigger runs BEFORE INSERT and fills match_score, kit fields, etc.
-- RLS WITH CHECK runs after that trigger, so requiring those columns to be null
-- blocked every application insert.

drop policy if exists "Workers insert own applications" on public.applications;

create policy "Workers insert own applications"
  on public.applications for insert
  with check (
    auth.uid() = worker_id
    and status = 'applied'
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
