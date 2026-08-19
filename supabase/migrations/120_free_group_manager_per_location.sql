-- Free groups: allow one manager per free location slot (2 locations → 2 managers).

create or replace function public.clinic_max_managers(p_plan text, p_account_type text default 'individual')
returns int
language sql
immutable
as $$
  select case
    when p_plan = 'group_pro' then 2147483647
    when p_plan = 'group_starter' then 3
    when p_plan = 'free' and p_account_type = 'group' then 2
    when p_account_type = 'individual' then 0
    else 0
  end;
$$;
