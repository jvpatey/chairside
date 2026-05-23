-- Tighten UPDATE policies: enforce ownership on the new row values too (see Copilot RLS review).
drop policy if exists "Clinics update own job posts" on public.job_posts;

create policy "Clinics update own job posts"
  on public.job_posts for update
  using (auth.uid() = clinic_id)
  with check (auth.uid() = clinic_id);

drop policy if exists "Clinics update own shift posts" on public.shift_posts;

create policy "Clinics update own shift posts"
  on public.shift_posts for update
  using (auth.uid() = clinic_id)
  with check (auth.uid() = clinic_id);
