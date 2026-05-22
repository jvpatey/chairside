create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
