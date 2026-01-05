-- Fix the SECURITY DEFINER view issue by using SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboard_view;

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
  LEFT(wallet_address, 4) || '...' || RIGHT(wallet_address, 4) as masked_wallet
FROM public.user_stats
ORDER BY current_xp DESC
LIMIT 100;