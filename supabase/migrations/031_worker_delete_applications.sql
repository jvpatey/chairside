-- Workers may withdraw their own applications.

create policy "Workers delete own applications"
  on public.applications for delete
  using (auth.uid() = worker_id);
