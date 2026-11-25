-- Match Auth phones whether stored as +1… or 1… / digits-only.
CREATE OR REPLACE FUNCTION public.find_auth_user_by_phone(p_phone text)
RETURNS TABLE (user_id uuid, email text, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  normalized text := nullif(trim(p_phone), '');
  digits text;
BEGIN
  IF normalized IS NULL THEN
    RETURN;
  END IF;

  digits := nullif(regexp_replace(normalized, '\D', '', 'g'), '');

  RETURN QUERY
  SELECT u.id, u.email::text, u.phone::text
  FROM auth.users u
  WHERE u.phone IS NOT NULL
    AND (
      u.phone = normalized
      OR u.phone = ltrim(normalized, '+')
      OR ('+' || u.phone) = normalized
      OR (
        digits IS NOT NULL
        AND regexp_replace(u.phone, '\D', '', 'g') = digits
      )
      OR (
        digits IS NOT NULL
        AND length(digits) = 11
        AND left(digits, 1) = '1'
        AND regexp_replace(u.phone, '\D', '', 'g') IN (digits, right(digits, 10))
      )
      OR (
        digits IS NOT NULL
        AND length(digits) = 10
        AND regexp_replace(u.phone, '\D', '', 'g') IN (digits, '1' || digits)
      )
    )
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.find_auth_user_by_phone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_auth_user_by_phone(text) TO service_role;
