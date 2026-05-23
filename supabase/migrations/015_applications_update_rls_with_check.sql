-- Tighten UPDATE policies: enforce clinic ownership on the new row values too.
drop policy if exists "Clinics update applications for own job posts" on public.applications;

create policy "Clinics update applications for own job posts"
  on public.applications for update
  using (
    job_post_id is not null
    and exists (
      select 1 from public.job_posts
      where job_posts.id = applications.job_post_id
        and job_posts.clinic_id = auth.uid()
    )
  )
  with check (
    job_post_id is not null
    and exists (
      select 1 from public.job_posts
      where job_posts.id = applications.job_post_id
        and job_posts.clinic_id = auth.uid()
    )
  );

drop policy if exists "Clinics update applications for own shift posts" on public.applications;

create policy "Clinics update applications for own shift posts"
  on public.applications for update
  using (
    shift_post_id is not null
    and exists (
      select 1 from public.shift_posts
      where shift_posts.id = applications.shift_post_id
        and shift_posts.clinic_id = auth.uid()
    )
  )
  with check (
    shift_post_id is not null
    and exists (
      select 1 from public.shift_posts
      where shift_posts.id = applications.shift_post_id
        and shift_posts.clinic_id = auth.uid()
    )
  );
