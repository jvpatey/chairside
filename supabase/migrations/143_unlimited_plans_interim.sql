-- Interim: tiered plans are being reworked, so lift every plan limit and paid-feature
-- gate for all clinics until the new plans/limits land.
--
-- Everything that enforces a limit reads through these helpers
-- (get_clinic_billing_state, the posting / location / manager triggers and the
-- assert_clinic_can_* functions), so redefining them is the single switch. The
-- subscription rows, plan names and plan-rank logic are untouched; restore the
-- previous bodies (104 / 120 / 137) or replace them with the new matrix to re-enable limits.
--
-- 2147483647 is the existing "unlimited" sentinel (surfaced to the client as null).

create or replace function public.clinic_active_role_limit(p_plan text)
returns int
language sql
immutable
as $$
  select 2147483647;
$$;

create or replace function public.clinic_active_fill_in_limit(p_plan text)
returns int
language sql
immutable
as $$
  select 2147483647;
$$;

create or replace function public.clinic_active_opportunity_limit(p_plan text)
returns int
language sql
immutable
as $$
  select 2147483647;
$$;

create or replace function public.clinic_max_locations(p_plan text, p_account_type text default 'individual')
returns int
language sql
immutable
as $$
  select 2147483647;
$$;

create or replace function public.clinic_max_managers(p_plan text, p_account_type text default 'individual')
returns int
language sql
immutable
as $$
  select 2147483647;
$$;

create or replace function public.clinic_custom_screening_limit(p_plan text)
returns int
language sql
immutable
as $$
  select 2147483647;
$$;

-- Paid features are unlocked for everyone, except priority (featured) listing: that is a
-- placement perk, not a limit, and granting it to every clinic would make every listing
-- look featured to workers.
create or replace function public.clinic_can_use_feature(p_clinic_id uuid, p_feature text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  case p_feature
    when 'fill_in_outreach',
         'fill_in_sms',
         'screening_questions',
         'crm_followups',
         'application_pdf_export',
         'clinic_discover',
         'general_candidate_messaging',
         'bulk_outreach',
         'hiring_insights' then
      return true;
    else
      return false;
  end case;
end;
$$;
