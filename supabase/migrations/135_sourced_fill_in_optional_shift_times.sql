-- Sourced fill-ins may omit shift date / start / end (exposure-only ads).
-- Clinic-posted fill-ins still require all three.

alter table public.shift_posts
  alter column shift_date drop not null,
  alter column start_time drop not null,
  alter column end_time drop not null;

alter table public.shift_posts
  drop constraint if exists shift_posts_clinic_shift_details_check;

alter table public.shift_posts
  add constraint shift_posts_clinic_shift_details_check
  check (
    coalesce(is_sourced, false) = true
    or (
      shift_date is not null
      and start_time is not null
      and end_time is not null
    )
  );
