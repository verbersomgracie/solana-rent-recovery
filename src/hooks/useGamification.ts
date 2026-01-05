import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserStats {
  id: string;
  wallet_address: string;
  total_sol_recovered: number;
  total_accounts_closed: number;
  total_transactions: number;
  current_level: number;
  current_xp: number;
  referral_code: string | null;
  referred_by: string | null;
  referral_count: number;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  badge_color: string;
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface LeaderboardEntry {
  wallet_address: string;
  total_sol_recovered: number;
  total_accounts_closed: number;
  current_level: number;
  rank: number;
}

// XP required for each level (exponential growth)
const getXpForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

export const getLevelProgress = (xp: number, level: number): number => {
  const xpForCurrentLevel = getXpForLevel(level);
  const xpForPrevLevel = level > 1 ? getXpForLevel(level - 1) : 0;
  const xpInCurrentLevel = xp - xpForPrevLevel;
  const xpNeededForLevel = xpForCurrentLevel - xpForPrevLevel;
  return Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);
};

export const getLevelFromXp = (xp: number): number => {
  let level = 1;
  let totalXp = 0;
  while (totalXp + getXpForLevel(level) <= xp) {
    totalXp += getXpForLevel(level);
    level++;
  }
  return level;
};

export const useGamification = (walletAddress: string | null) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  // Fetch or create user stats
  const fetchUserStats = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);

    try {
      // Check if user exists
      let { data: stats, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      // Create user if doesn't exist
      if (!stats) {
        const { data: referralCode } = await supabase.rpc('generate_referral_code');
        
        const { data: newStats, error: insertError } = await supabase
          .from('user_stats')
          .insert({
            wallet_address: walletAddress,
            referral_code: referralCode
          })
          .select()
          .single();

        if (insertError) throw insertError;
        stats = newStats;
      }

      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch achievements with user unlock status
  const fetchAchievements = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const { data: allAchievements, error: achieveError } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (achieveError) throw achieveError;

      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('wallet_address', walletAddress);

      if (userError) throw userError;

      const unlockedMap = new Map(
        userAchievements?.map(ua => [ua.achievement_id, ua.unlocked_at]) || []
      );

      const achievementsWithStatus = allAchievements?.map(a => ({
        ...a,
        unlocked: unlockedMap.has(a.id),
        unlocked_at: unlockedMap.get(a.id)
      })) || [];

      setAchievements(achievementsWithStatus);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  }, [walletAddress]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('wallet_address, total_sol_recovered, total_accounts_closed, current_level')
        .order('total_sol_recovered', { ascending: false })
        .limit(10);

      if (error) throw error;

      const leaderboardWithRank = data?.map((entry, index) => ({
        ...entry,
        rank: index + 1
      })) || [];

      setLeaderboard(leaderboardWithRank);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, []);

  // Update stats after a transaction
  const updateStatsAfterTransaction = useCallback(async (
    solRecovered: number,
    accountsClosed: number
  ) => {
    if (!walletAddress || !userStats) return;

    try {
      const newTotalSol = Number(userStats.total_sol_recovered) + solRecovered;
      const newTotalAccounts = userStats.total_accounts_closed + accountsClosed;
      const newTotalTransactions = userStats.total_transactions + 1;

      // Check for new achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*');

      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('wallet_address', walletAddress);

      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      
      let xpGained = 0;
      const newUnlocks: Achievement[] = [];

      for (const achievement of allAchievements || []) {
        if (unlockedIds.has(achievement.id)) continue;

        let currentValue = 0;
        switch (achievement.requirement_type) {
          case 'sol_recovered':
            currentValue = newTotalSol;
            break;
          case 'accounts_closed':
            currentValue = newTotalAccounts;
            break;
          case 'transactions':
            currentValue = newTotalTransactions;
            break;
          case 'referrals':
            currentValue = userStats.referral_count;
            break;
        }

        if (currentValue >= achievement.requirement_value) {
          // Unlock achievement
          await supabase
            .from('user_achievements')
            .insert({
              wallet_address: walletAddress,
              achievement_id: achievement.id
            });

          xpGained += achievement.xp_reward;
          newUnlocks.push(achievement);
        }
      }

      // Calculate new level from XP
      const newXp = userStats.current_xp + xpGained;
      const newLevel = getLevelFromXp(newXp);

      // Update user stats
      const { data: updatedStats, error } = await supabase
        .from('user_stats')
        .update({
          total_sol_recovered: newTotalSol,
          total_accounts_closed: newTotalAccounts,
          total_transactions: newTotalTransactions,
          current_xp: newXp,
          current_level: newLevel
        })
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) throw error;

      setUserStats(updatedStats);
      setNewlyUnlocked(newUnlocks);

      // Show achievement notifications
      for (const achievement of newUnlocks) {
        toast.success(`🏆 Conquista Desbloqueada: ${achievement.name}`, {
          description: `+${achievement.xp_reward} XP`
        });
      }

      if (newLevel > userStats.current_level) {
        toast.success(`🎉 Level Up! Nível ${newLevel}`, {
          description: 'Continue recuperando SOL para subir de nível!'
        });
      }

      // Refresh achievements
      await fetchAchievements();
      await fetchLeaderboard();
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }, [walletAddress, userStats, fetchAchievements, fetchLeaderboard]);

  // Apply referral code
  const applyReferralCode = useCallback(async (code: string) => {
    if (!walletAddress) return false;

    try {
      // Check if already referred
      if (userStats?.referred_by) {
        toast.error('Você já usou um código de referência');
        return false;
      }

      // Check if code exists and is not own code
      const { data: referrer, error } = await supabase
        .from('user_stats')
        .select('wallet_address, referral_count')
        .eq('referral_code', code.toUpperCase())
        .maybeSingle();

      if (error || !referrer) {
        toast.error('Código de referência inválido');
        return false;
      }

      if (referrer.wallet_address === walletAddress) {
        toast.error('Você não pode usar seu próprio código');
        return false;
      }

      // Update current user
      await supabase
        .from('user_stats')
        .update({ referred_by: code.toUpperCase() })
        .eq('wallet_address', walletAddress);

      // Update referrer count
      await supabase
        .from('user_stats')
        .update({ referral_count: referrer.referral_count + 1 })
        .eq('wallet_address', referrer.wallet_address);

      toast.success('Código de referência aplicado!');
      await fetchUserStats();
      return true;
    } catch (error) {
      console.error('Error applying referral:', error);
      toast.error('Erro ao aplicar código');
      return false;
    }
  }, [walletAddress, userStats, fetchUserStats]);

  // Clear newly unlocked achievements
  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchUserStats();
      fetchAchievements();
      fetchLeaderboard();
    } else {
      setUserStats(null);
      setAchievements([]);
    }
  }, [walletAddress, fetchUserStats, fetchAchievements, fetchLeaderboard]);

  return {
    userStats,
    achievements,
    leaderboard,
    isLoading,
    newlyUnlocked,
    updateStatsAfterTransaction,
    applyReferralCode,
    clearNewlyUnlocked,
    fetchLeaderboard,
    getLevelProgress: (xp: number, level: number) => getLevelProgress(xp, level)
  };
};
