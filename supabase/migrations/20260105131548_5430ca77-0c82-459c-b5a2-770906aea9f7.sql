-- Drop existing view
DROP VIEW IF EXISTS public.leaderboard_view;

-- Create a function that returns anonymized leaderboard data
-- Using SECURITY DEFINER to bypass RLS on user_stats, but only exposing anonymized data
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  id uuid,
  current_level integer,
  current_xp integer,
  total_accounts_closed integer,
  total_transactions integer,
  total_sol_recovered numeric,
  masked_wallet text,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    us.id,
    us.current_level,
    us.current_xp,
    us.total_accounts_closed,
    us.total_transactions,
    us.total_sol_recovered,
    -- Stronger masking: only show first 2 and last 2 characters
    CASE 
      WHEN us.wallet_address IS NOT NULL AND LENGTH(us.wallet_address) > 8 
      THEN LEFT(us.wallet_address, 2) || '****' || RIGHT(us.wallet_address, 2)
      ELSE '****'
    END AS masked_wallet,
    ROW_NUMBER() OVER (ORDER BY us.current_xp DESC) AS rank
  FROM public.user_stats us
  WHERE us.wallet_address IS NOT NULL
  ORDER BY us.current_xp DESC
  LIMIT 100
$$;

-- Recreate the view using the function for compatibility
-- This view can be queried but only returns anonymized data
CREATE VIEW public.leaderboard_view 
WITH (security_invoker = true)
AS
SELECT 
  id,
  current_level,
  current_xp,
  total_accounts_closed,
  total_transactions,
  total_sol_recovered,
  masked_wallet,
  rank
FROM public.get_leaderboard();

-- Grant execute on function to authenticated users only
REVOKE ALL ON FUNCTION public.get_leaderboard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_leaderboard() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

-- Grant select on view to authenticated users only
REVOKE ALL ON public.leaderboard_view FROM PUBLIC;
REVOKE ALL ON public.leaderboard_view FROM anon;
GRANT SELECT ON public.leaderboard_view TO authenticated;