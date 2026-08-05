-- Personal first/last name on profiles; keep display_name as the joined public value.
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

-- Backfill from display_name: first token → first_name, remainder → last_name.
update public.profiles
set
  first_name = nullif(trim(split_part(trim(display_name), ' ', 1)), ''),
  last_name = nullif(
    trim(
      substring(
        trim(display_name)
        from length(split_part(trim(display_name), ' ', 1)) + 2
      )
    ),
    ''
  )
where display_name is not null
  and trim(display_name) <> ''
  and first_name is null
  and last_name is null;
