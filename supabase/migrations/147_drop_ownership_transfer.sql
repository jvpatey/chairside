-- Remove ownership transfer. A clinic or group is one login, and transfer only made sense
-- when a manager could become the owner. Nothing in the app calls this function.
--
-- It demoted the current owner to 'manager' and promoted another membership, so dropping
-- it removes the only code path that creates a manager from an owner.
-- clinic_memberships rows and the 'manager' role check are kept (see 145).

drop function if exists public.transfer_clinic_organization_ownership(uuid, uuid);
