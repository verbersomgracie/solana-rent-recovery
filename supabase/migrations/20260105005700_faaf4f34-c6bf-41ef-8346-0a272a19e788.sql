-- Create user_stats table for gamification
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  total_sol_recovered DECIMAL(20, 9) NOT NULL DEFAULT 0,
  total_accounts_closed INTEGER NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_xp INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  referral_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  requirement_type TEXT NOT NULL, -- 'sol_recovered', 'accounts_closed', 'transactions', 'referrals'
  requirement_value INTEGER NOT NULL,
  badge_color TEXT NOT NULL DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table (junction)
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for user_stats (public read for leaderboard, wallet owner can update)
CREATE POLICY "Anyone can read user stats for leaderboard" 
ON public.user_stats FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stats" 
ON public.user_stats FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own stats" 
ON public.user_stats FOR UPDATE USING (true);

-- Policies for achievements (public read)
CREATE POLICY "Anyone can read achievements" 
ON public.achievements FOR SELECT USING (true);

-- Policies for user_achievements
CREATE POLICY "Anyone can read user achievements" 
ON public.user_achievements FOR SELECT USING (true);

CREATE POLICY "Anyone can insert user achievements" 
ON public.user_achievements FOR INSERT WITH CHECK (true);

-- Insert default achievements
INSERT INTO public.achievements (key, name, description, icon, xp_reward, requirement_type, requirement_value, badge_color) VALUES
-- SOL Recovered achievements
('first_sol', 'First Drop', 'Recover your first SOL', 'Droplets', 50, 'sol_recovered', 1, 'primary'),
('sol_1', 'SOL Starter', 'Recover 1 SOL total', 'Coins', 100, 'sol_recovered', 1, 'primary'),
('sol_10', 'SOL Hunter', 'Recover 10 SOL total', 'Target', 250, 'sol_recovered', 10, 'secondary'),
('sol_50', 'SOL Master', 'Recover 50 SOL total', 'Crown', 500, 'sol_recovered', 50, 'warning'),
('sol_100', 'SOL Legend', 'Recover 100 SOL total', 'Trophy', 1000, 'sol_recovered', 100, 'success'),

-- Accounts closed achievements
('close_1', 'Account Closer', 'Close your first empty account', 'Trash2', 50, 'accounts_closed', 1, 'primary'),
('close_10', 'Clean Sweep', 'Close 10 empty accounts', 'Broom', 100, 'accounts_closed', 10, 'primary'),
('close_50', 'Wallet Cleaner', 'Close 50 empty accounts', 'Sparkles', 250, 'accounts_closed', 50, 'secondary'),
('close_100', 'Purge Master', 'Close 100 empty accounts', 'Flame', 500, 'accounts_closed', 100, 'warning'),
('close_500', 'The Incinerator', 'Close 500 empty accounts', 'Zap', 1000, 'accounts_closed', 500, 'destructive'),

-- Referral achievements
('referral_1', 'Social Butterfly', 'Refer your first friend', 'Users', 150, 'referrals', 1, 'primary'),
('referral_5', 'Community Builder', 'Refer 5 friends', 'Network', 300, 'referrals', 5, 'secondary'),
('referral_10', 'Ambassador', 'Refer 10 friends', 'Medal', 600, 'referrals', 10, 'warning'),
('referral_25', 'SOL Evangelist', 'Refer 25 friends', 'Star', 1000, 'referrals', 25, 'success');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
CREATE TRIGGER update_user_stats_timestamp
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_user_stats_updated_at();

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;