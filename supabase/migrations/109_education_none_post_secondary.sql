-- Label explicit "no post-secondary education" on worker profiles and application snapshots.

create or replace function public.education_degree_type_label(p_type text)
returns text
language sql
immutable
as $$
  select case nullif(trim(p_type), '')
    when 'certificate' then 'Certificate'
    when 'diploma' then 'Diploma'
    when 'associate' then 'Associate degree'
    when 'bachelors' then 'Bachelor''s degree'
    when 'masters' then 'Master''s degree'
    when 'doctorate' then 'Doctorate'
    when 'other' then 'Other'
    when 'none_post_secondary' then 'No post-secondary education'
    else initcap(replace(replace(trim(p_type), '_', ' '), '-', ' '))
  end;
$$;
