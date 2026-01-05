-- Add blockchain column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN blockchain text NOT NULL DEFAULT 'solana';

-- Add index for blockchain column
CREATE INDEX idx_transactions_blockchain ON public.transactions(blockchain);