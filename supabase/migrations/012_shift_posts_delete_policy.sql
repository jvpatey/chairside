create policy "Clinics delete own shift posts"
  on public.shift_posts for delete using (auth.uid() = clinic_id);
