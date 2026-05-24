-- Clinics see city and province only — not street address or postal code.

create or replace function public.get_province_label(p_province text)
returns text
language sql immutable as $$
  select case trim(p_province)
    when 'NS' then 'Nova Scotia'
    when 'NB' then 'New Brunswick'
    when 'PE' then 'Prince Edward Island'
    when 'NL' then 'Newfoundland and Labrador'
    else nullif(trim(p_province), '')
  end;
$$;

create or replace function public.format_worker_address(p_worker public.worker_profiles)
returns text
language sql immutable as $$
  select nullif(
    trim(both ', ' from concat_ws(
      ', ',
      nullif(trim(p_worker.city), ''),
      public.get_province_label(p_worker.province)
    )),
    ''
  );
$$;

update public.applications a
set worker_address = public.format_worker_address(w)
from public.worker_profiles w
where a.worker_id = w.id
  and a.worker_address is not null;
