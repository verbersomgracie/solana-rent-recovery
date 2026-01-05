-- Remove the overly permissive SELECT policy on transactions
DROP POLICY IF EXISTS "Anyone can view all transactions" ON public.transactions;

-- Create policy for users to view their own transactions (by wallet_address)
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
USING (
  wallet_address IN (
    SELECT wallet_address FROM public.profiles WHERE id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- Create policy for admins to view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));