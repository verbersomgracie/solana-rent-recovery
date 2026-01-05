-- Drop existing SELECT policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Block anonymous access" ON public.transactions;

-- Create a single, stronger SELECT policy that validates wallet_address against user's profile
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- User owns the transaction directly
    user_id = auth.uid()
    -- OR transaction wallet matches user's verified profile wallet
    OR (
      user_id IS NULL 
      AND wallet_address IS NOT NULL 
      AND wallet_address = (
        SELECT p.wallet_address 
        FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.wallet_address IS NOT NULL
        LIMIT 1
      )
    )
  )
);

-- Admin policy remains unchanged
-- DROP and recreate to ensure clean state
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also strengthen INSERT policy to validate wallet matches profile
DROP POLICY IF EXISTS "Authenticated users can insert own transactions" ON public.transactions;
CREATE POLICY "Authenticated users can insert own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
  AND (
    wallet_address IS NULL
    OR wallet_address = (
      SELECT p.wallet_address 
      FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.wallet_address IS NOT NULL
      LIMIT 1
    )
  )
);