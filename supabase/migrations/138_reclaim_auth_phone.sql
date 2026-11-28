-- Look up auth.users by phone for reclaim-auth-phone (service_role only).
CREATE OR REPLACE FUNCTION public.find_auth_user_by_phone(p_phone text)
RETURNS TABLE (user_id uuid, email text, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  normalized text := nullif(trim(p_phone), '');
BEGIN
  IF normalized IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text, u.phone::text
  FROM auth.users u
  WHERE u.phone = normalized
     OR u.phone = ltrim(normalized, '+')
     OR ('+' || u.phone) = normalized
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.find_auth_user_by_phone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_auth_user_by_phone(text) TO service_role;

-- Digits-only match against worker_profiles.phone (NANP storage).
-- worker_profiles.id is 1:1 with auth.users.id.
CREATE OR REPLACE FUNCTION public.find_worker_user_id_by_phone_digits(p_digits text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT wp.id
  FROM public.worker_profiles wp
  WHERE wp.phone = nullif(regexp_replace(trim(p_digits), '\D', '', 'g'), '')
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_worker_user_id_by_phone_digits(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_worker_user_id_by_phone_digits(text) TO service_role;
