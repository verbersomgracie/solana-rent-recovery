-- Allow admins to insert transactions (for testing purposes)
CREATE POLICY "Admins can insert transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));