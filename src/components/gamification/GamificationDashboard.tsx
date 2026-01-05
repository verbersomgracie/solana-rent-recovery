import { useState } from "react";
import { 
  Trophy, Star, ChartBar, Users, Medal, 
  Zap, Target, Gift, Crown, Flame, Sparkles
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
import VIPTiers from "./VIPTiers";
import StreakTracker from "./StreakTracker";
import LuckyWheel from "./LuckyWheel";

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
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalAchievements = achievements.length;

  // Group achievements by type
  const achievementsByType = {
    sol_recovered: achievements.filter(a => a.requirement_type === 'sol_recovered'),
    accounts_closed: achievements.filter(a => a.requirement_type === 'accounts_closed'),
    referrals: achievements.filter(a => a.requirement_type === 'referrals')
  };

  const handlePrizeWon = (prize: any) => {
    console.log('Prize won:', prize);
    // TODO: Apply prize to user stats
  };

  if (!walletAddress) {
    return (
      <div className={cn("glass rounded-2xl p-8 text-center border border-border/50", className)}>
        <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-xl font-bold text-foreground mb-2">
          Conecte sua Wallet
        </h3>
        <p className="text-muted-foreground mb-6">
          Conecte sua wallet para ver seu progresso, conquistas e ranking!
        </p>
        
        {/* Preview features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <Crown className="w-5 h-5 text-warning mb-2" />
            <div className="text-sm font-medium text-foreground">Níveis VIP</div>
            <div className="text-xs text-muted-foreground">Taxas a partir de 3%</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <Trophy className="w-5 h-5 text-primary mb-2" />
            <div className="text-sm font-medium text-foreground">Conquistas</div>
            <div className="text-xs text-muted-foreground">14+ badges exclusivos</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <Flame className="w-5 h-5 text-orange-500 mb-2" />
            <div className="text-sm font-medium text-foreground">Streak Diária</div>
            <div className="text-xs text-muted-foreground">Bônus progressivos</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <Sparkles className="w-5 h-5 text-secondary mb-2" />
            <div className="text-sm font-medium text-foreground">Roda da Sorte</div>
            <div className="text-xs text-muted-foreground">Prêmios extras</div>
          </div>
        </div>
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

  // Calculate streak (mock - should come from database)
  const currentStreak = Math.floor(userStats.total_transactions / 2);
  const longestStreak = Math.max(currentStreak, 7);

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
                  {unlockedCount}/{totalAchievements}
                </span>
                <span className="text-xs text-orange-500">
                  <Flame className="w-3 h-3 inline mr-1" />
                  {currentStreak} dias
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLuckyWheel(true)}
              className="border-secondary/50 text-secondary hover:bg-secondary/10"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Roda da Sorte
            </Button>
            <UserLevelBadge 
              level={userStats.current_level} 
              xp={userStats.current_xp}
              showProgress
              size="sm"
              className="hidden sm:flex w-48"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full glass">
          <TabsTrigger value="overview" className="gap-1.5">
            <ChartBar className="w-4 h-4" />
            <span className="hidden md:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="vip" className="gap-1.5">
            <Crown className="w-4 h-4" />
            <span className="hidden md:inline">VIP</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1.5">
            <Trophy className="w-4 h-4" />
            <span className="hidden md:inline">Conquistas</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1.5">
            <Target className="w-4 h-4" />
            <span className="hidden md:inline">Ranking</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-1.5">
            <Gift className="w-4 h-4" />
            <span className="hidden md:inline">Referências</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StatsChart
                totalSolRecovered={Number(userStats.total_sol_recovered)}
                totalAccountsClosed={userStats.total_accounts_closed}
                totalTransactions={userStats.total_transactions}
                level={userStats.current_level}
              />
            </div>
            <div>
              <StreakTracker
                currentStreak={currentStreak}
                longestStreak={longestStreak}
                lastActiveDate={userStats.updated_at}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vip" className="mt-6">
          <VIPTiers
            currentLevel={userStats.current_level}
            totalSolRecovered={Number(userStats.total_sol_recovered)}
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

      {/* Lucky Wheel Modal */}
      <LuckyWheel
        isOpen={showLuckyWheel}
        onClose={() => setShowLuckyWheel(false)}
        onPrizeWon={handlePrizeWon}
      />
    </div>
  );
};

export default GamificationDashboard;
