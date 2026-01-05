-- Fix has_role function to only allow checking own role
-- Returns false if trying to check another user's role (prevents information disclosure)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN _user_id = auth.uid() THEN
        EXISTS (
          SELECT 1
          FROM public.user_roles
          WHERE user_id = _user_id
            AND role = _role
        )
      ELSE false
    END
$$;