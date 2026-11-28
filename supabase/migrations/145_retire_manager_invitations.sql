-- Retire manager invitations. Each clinic or group uses one login; there are no
-- invited managers anymore.
--
-- What this does:
--   1. Revokes pending invitations (rows are kept for history, not deleted).
--   2. Drops the invitation RPCs and their billing guard helpers.
--
-- What this keeps on purpose:
--   - clinic_invitations and clinic_memberships tables and their data.
--   - The 'manager' role check on clinic_memberships. Existing rows stay valid.
--   - transfer_clinic_organization_ownership. Migration 147 removes it.
--   - The manager limit helpers (clinic_max_managers, get_clinic_manager_count). Migration
--     146 removes them along with the manager fields from get_clinic_billing_state.

update public.clinic_invitations
set status = 'revoked', updated_at = now()
where status = 'pending';

do $$
declare
  v_active_managers integer;
begin
  select count(*) into v_active_managers
  from public.clinic_memberships
  where role = 'manager' and status = 'active';

  if v_active_managers > 0 then
    raise notice 'retire manager invitations: % active manager membership(s) remain; they keep their access until removed', v_active_managers;
  end if;
end $$;

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_clinic_manager_invitation',
        'accept_clinic_manager_invitation',
        'preview_clinic_manager_invitation',
        'resend_clinic_manager_invitation',
        'revoke_clinic_manager_invitation',
        'remove_clinic_manager',
        'assert_clinic_can_add_manager',
        'assert_clinic_can_accept_manager'
      )
  loop
    execute format('drop function %s', r.signature);
  end loop;
end $$;
