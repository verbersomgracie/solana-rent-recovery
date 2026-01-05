-- =====================================================
-- FIX: platform_settings - Restrict updates to admins only
-- =====================================================
DROP POLICY IF EXISTS "Anyone can update settings" ON public.platform_settings;

CREATE POLICY "Admins can update settings"
ON public.platform_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FIX: transactions - Restrict inserts to authenticated users
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert transactions" ON public.transactions;

CREATE POLICY "Authenticated users can insert own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (user_id = auth.uid() OR user_id IS NULL)
);

-- =====================================================
-- FIX: user_achievements - Restrict inserts to system/validated
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert user achievements" ON public.user_achievements;

-- Only allow inserting achievements for wallets owned by the authenticated user
CREATE POLICY "Users can earn achievements for their wallet"
ON public.user_achievements
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  wallet_address IN (
    SELECT wallet_address FROM public.profiles WHERE id = auth.uid()
  )
);

-- =====================================================
-- FIX: user_stats - Restrict read/write to owner only
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read user stats for leaderboard" ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;

-- Users can only view their own stats
CREATE POLICY "Users can view their own stats"
ON public.user_stats
FOR SELECT
USING (
  wallet_address IN (
    SELECT wallet_address FROM public.profiles WHERE id = auth.uid()
  )
);

-- Admins can view all stats for leaderboard/admin panel
CREATE POLICY "Admins can view all stats"
ON public.user_stats
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Public leaderboard view - only aggregated/non-sensitive data
-- Create a view for leaderboard that masks wallet addresses
CREATE OR REPLACE VIEW public.leaderboard_view AS
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

-- Users can insert stats for their own wallet
CREATE POLICY "Users can insert own stats"
ON public.user_stats
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  wallet_address IN (
    SELECT wallet_address FROM public.profiles WHERE id = auth.uid()
  )
);

-- Users can update stats for their own wallet
CREATE POLICY "Users can update own stats"
ON public.user_stats
FOR UPDATE
USING (
  wallet_address IN (
    SELECT wallet_address FROM public.profiles WHERE id = auth.uid()
  )
);