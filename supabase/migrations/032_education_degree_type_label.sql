-- Label degree types in application education snapshots (e.g. diploma → Diploma).

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
    else initcap(replace(replace(trim(p_type), '_', ' '), '-', ' '))
  end;
$$;

create or replace function public.format_worker_education(p_worker public.worker_profiles)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      trim(both from concat_ws(
        ' · ',
        nullif(public.education_degree_type_label(p_worker.education_degree_type), ''),
        nullif(trim(p_worker.education_field), ''),
        nullif(trim(p_worker.education_institution), ''),
        case
          when p_worker.education_graduation_year is not null
            then p_worker.education_graduation_year::text
          else null
        end
      )),
      ''
    ),
    nullif(trim(p_worker.education), '')
  );
$$;
