-- Remove the overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Anyone can view all profiles" ON public.profiles;

-- Create policy for users to view their own profile only
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));