import { useState } from "react";
import { 
  Trophy, Star, ChartBar, Users, Medal, 
  ChevronRight, Zap, Target, Gift
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserStats, Achievement, LeaderboardEntry } from "@/hooks/useGamification";
import UserLevelBadge from "./UserLevelBadge";
import AchievementCard from "./AchievementCard";
import Leaderboard from "./Leaderboard";
import StatsChart from "./StatsChart";
import ReferralCard from "./ReferralCard";

interface GamificationDashboardProps {
  userStats: UserStats | null;
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  walletAddress: string | null;
  onApplyReferralCode: (code: string) => Promise<boolean>;
  isLoading?: boolean;
  className?: string;
}

const GamificationDashboard = ({
  userStats,
  achievements,
  leaderboard,
  walletAddress,
  onApplyReferralCode,
  isLoading,
  className
}: GamificationDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalAchievements = achievements.length;

  // Group achievements by type
  const achievementsByType = {
    sol_recovered: achievements.filter(a => a.requirement_type === 'sol_recovered'),
    accounts_closed: achievements.filter(a => a.requirement_type === 'accounts_closed'),
    referrals: achievements.filter(a => a.requirement_type === 'referrals')
  };

  if (!walletAddress) {
    return (
      <div className={cn("glass rounded-2xl p-8 text-center border border-border/50", className)}>
        <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-xl font-bold text-foreground mb-2">
          Conecte sua Wallet
        </h3>
        <p className="text-muted-foreground">
          Conecte sua wallet para ver seu progresso, conquistas e ranking!
        </p>
      </div>
    );
  }

  if (isLoading || !userStats) {
    return (
      <div className={cn("glass rounded-2xl p-8 text-center border border-border/50", className)}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted animate-pulse" />
        <div className="h-6 w-48 mx-auto bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* User Level Header */}
      <div className="glass rounded-2xl p-6 border border-border/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserLevelBadge 
              level={userStats.current_level} 
              xp={userStats.current_xp}
              size="lg"
            />
            <div>
              <p className="text-sm text-muted-foreground font-mono">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-muted-foreground">
                  <Zap className="w-3 h-3 inline mr-1" />
                  {userStats.current_xp} XP
                </span>
                <span className="text-xs text-muted-foreground">
                  <Medal className="w-3 h-3 inline mr-1" />
                  {unlockedCount}/{totalAchievements} conquistas
                </span>
              </div>
            </div>
          </div>
          
          <UserLevelBadge 
            level={userStats.current_level} 
            xp={userStats.current_xp}
            showProgress
            size="sm"
            className="w-full sm:w-48"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full glass">
          <TabsTrigger value="overview" className="gap-2">
            <ChartBar className="w-4 h-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Conquistas</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Ranking</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-2">
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Referências</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <StatsChart
            totalSolRecovered={Number(userStats.total_sol_recovered)}
            totalAccountsClosed={userStats.total_accounts_closed}
            totalTransactions={userStats.total_transactions}
            level={userStats.current_level}
          />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6 space-y-6">
          {/* SOL Recovered Achievements */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">SOL Recuperado</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {achievementsByType.sol_recovered.map(achievement => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement}
                  size="sm"
                />
              ))}
            </div>
          </div>

          {/* Accounts Closed Achievements */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-secondary" />
              <h3 className="font-bold text-foreground">Contas Fechadas</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {achievementsByType.accounts_closed.map(achievement => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement}
                  size="sm"
                />
              ))}
            </div>
          </div>

          {/* Referral Achievements */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-warning" />
              <h3 className="font-bold text-foreground">Referências</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {achievementsByType.referrals.map(achievement => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement}
                  size="sm"
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <div className="glass rounded-2xl p-5 border border-border/50">
            <Leaderboard 
              entries={leaderboard} 
              currentWallet={walletAddress}
            />
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralCard
            referralCode={userStats.referral_code}
            referralCount={userStats.referral_count}
            referredBy={userStats.referred_by}
            onApplyCode={onApplyReferralCode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationDashboard;
