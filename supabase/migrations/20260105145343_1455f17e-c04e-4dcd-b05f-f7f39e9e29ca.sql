-- Drop existing function and recreate with fixed logic
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow checking own role
  IF _user_id != auth.uid() THEN
    RETURN false;
  END IF;

  -- Check if user has the role (removed rate limit check that was causing issues)
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;