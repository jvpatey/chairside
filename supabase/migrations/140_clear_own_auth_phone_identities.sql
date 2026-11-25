-- Free the number completely: clear auth.users phone fields and remove the
-- phone identity when the user still has another sign-in method.
CREATE OR REPLACE FUNCTION public.clear_own_auth_phone()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  uid uuid := auth.uid();
  other_identity_count int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT count(*)::int
  INTO other_identity_count
  FROM auth.identities
  WHERE user_id = uid
    AND provider <> 'phone';

  -- Never leave the user with zero identities.
  IF other_identity_count > 0 THEN
    DELETE FROM auth.identities
    WHERE user_id = uid
      AND provider = 'phone';
  END IF;

  UPDATE auth.users
  SET
    phone = NULL,
    phone_confirmed_at = NULL,
    phone_change = ''
  WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_own_auth_phone() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_own_auth_phone() TO authenticated;
