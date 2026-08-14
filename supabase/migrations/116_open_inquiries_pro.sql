-- Lock Open inquiries (general_candidate_messaging) to Pro / Group Pro.
-- Safe to apply after 115 even if that migration already ran with a Starter gate.

create or replace function public.clinic_can_use_feature(p_clinic_id uuid, p_feature text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plan text := public.get_clinic_plan(p_clinic_id);
begin
  case p_feature
    when 'fill_in_outreach',
         'fill_in_sms',
         'screening_questions',
         'crm_followups',
         'application_pdf_export',
         'clinic_discover' then
      return v_plan in ('starter', 'pro', 'group_starter', 'group_pro');
    when 'priority_listing',
         'bulk_outreach',
         'hiring_insights',
         'general_candidate_messaging' then
      return v_plan in ('pro', 'group_pro');
    else
      return false;
  end case;
end;
$$;

create or replace function public.assert_clinic_can_use_feature(p_clinic_id uuid, p_feature text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.clinic_can_use_feature(p_clinic_id, p_feature) then
    return;
  end if;

  case p_feature
    when 'screening_questions' then
      raise exception 'Screening questions require a paid clinic plan.';
    when 'crm_followups' then
      raise exception 'CRM notes and follow-ups require a paid clinic plan.';
    when 'application_pdf_export' then
      raise exception 'Application PDF export requires a paid clinic plan.';
    when 'clinic_discover' then
      raise exception 'Clinic discover requires a paid clinic plan.';
    when 'general_candidate_messaging' then
      raise exception 'Open inquiries require a Pro plan.';
    else
      raise exception 'This feature requires a paid clinic plan.';
  end case;
end;
$$;
