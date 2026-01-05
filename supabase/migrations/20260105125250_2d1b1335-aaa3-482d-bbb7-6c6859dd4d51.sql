-- Drop existing user SELECT policy and create a stronger one
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;

-- Create strengthened policy: require auth AND (user_id match OR wallet match via profile)
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    user_id = auth.uid() 
    OR (
      user_id IS NULL 
      AND wallet_address IN (
        SELECT p.wallet_address 
        FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.wallet_address IS NOT NULL
      )
    )
  )
);

-- Strengthen INSERT policy: require user_id to always be set
DROP POLICY IF EXISTS "Authenticated users can insert own transactions" ON public.transactions;

CREATE POLICY "Authenticated users can insert own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Add explicit DENY for anonymous users trying to SELECT
CREATE POLICY "Block anonymous access"
ON public.transactions
FOR SELECT
USING (auth.uid() IS NOT NULL);