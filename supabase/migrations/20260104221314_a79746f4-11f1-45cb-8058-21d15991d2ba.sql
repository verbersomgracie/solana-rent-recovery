-- Allow anyone to update platform settings (for simple admin without auth)
DROP POLICY IF EXISTS "Admins can update settings" ON public.platform_settings;
CREATE POLICY "Anyone can update settings" 
ON public.platform_settings 
FOR UPDATE 
USING (true);

-- Allow anyone to view all profiles (for admin dashboard)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Anyone can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);