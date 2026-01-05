-- Create explicit RLS policies for rate_limits table
-- Users can only view their own rate limit records (for transparency)
CREATE POLICY "Users can view own rate limits"
ON public.rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Block all direct INSERT from users (only SECURITY DEFINER functions can insert)
CREATE POLICY "No direct insert allowed"
ON public.rate_limits
FOR INSERT
WITH CHECK (false);

-- Block all direct UPDATE from users (only SECURITY DEFINER functions can update)
CREATE POLICY "No direct update allowed"
ON public.rate_limits
FOR UPDATE
USING (false);

-- Block all direct DELETE from users
CREATE POLICY "No direct delete allowed"
ON public.rate_limits
FOR DELETE
USING (false);