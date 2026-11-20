-- Ungate fill_in_sms while plans are revamped. Coverage SMS is core product.
create or replace function public.clinic_can_use_feature(p_clinic_id uuid, p_feature text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_billing_id uuid := coalesce(
    public.get_clinic_organization_id_for_user(p_clinic_id),
    p_clinic_id
  );
  v_plan text := public.get_clinic_plan(v_billing_id);
begin
  if p_feature = 'fill_in_sms' then
    return true;
  end if;

  case p_feature
    when 'fill_in_outreach',
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
