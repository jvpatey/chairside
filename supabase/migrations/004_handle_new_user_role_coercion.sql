-- Coerce invalid signup metadata roles to NULL so auth.users insert is not rolled back.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case
      when new.raw_user_meta_data->>'role' in ('worker', 'clinic')
        then new.raw_user_meta_data->>'role'
      else null
    end
  );
  return new;
end;
$$;
