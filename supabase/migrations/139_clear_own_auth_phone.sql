-- Allow a signed-in user to clear their Auth phone (client updateUser cannot).
CREATE OR REPLACE FUNCTION public.clear_own_auth_phone()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE auth.users
  SET
    phone = NULL,
    phone_confirmed_at = NULL,
    phone_change = ''
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.clear_own_auth_phone() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_own_auth_phone() TO authenticated;
