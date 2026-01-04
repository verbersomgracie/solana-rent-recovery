-- Create transactions table to track SOL recovery transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  accounts_closed INTEGER NOT NULL DEFAULT 0,
  sol_recovered DECIMAL(18, 9) NOT NULL DEFAULT 0,
  fee_collected DECIMAL(18, 9) NOT NULL DEFAULT 0,
  fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 5,
  transaction_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view transactions (for admin dashboard)
CREATE POLICY "Anyone can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (true);

-- Allow anyone to insert transactions
CREATE POLICY "Anyone can insert transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_wallet ON public.transactions(wallet_address);