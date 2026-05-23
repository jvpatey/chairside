-- Replace team_size (int) with team_size_range (structured buckets)
alter table public.clinic_profiles
  add column team_size_range text
  check (
    team_size_range is null
    or team_size_range in ('1-5', '6-10', '11-20', '21-50', '51+', 'prefer_not_to_say')
  );

update public.clinic_profiles
set team_size_range = case
  when team_size is null then null
  when team_size <= 5 then '1-5'
  when team_size <= 10 then '6-10'
  when team_size <= 20 then '11-20'
  when team_size <= 50 then '21-50'
  else '51+'
end
where team_size is not null;

alter table public.clinic_profiles drop column team_size;
