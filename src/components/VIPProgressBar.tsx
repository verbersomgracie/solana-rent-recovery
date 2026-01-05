import { Crown, TrendingUp, Star, Shield, Flame, Diamond } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { VIP_TIERS, getVIPTierIndex, getNextVIPTier } from "@/hooks/useVIPTier";
import { UserStats } from "@/hooks/useGamification";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface VIPProgressBarProps {
  userStats: UserStats | null;
  className?: string;
}

const getTierIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    Star: <Star className="w-4 h-4" />,
    Shield: <Shield className="w-4 h-4" />,
    Crown: <Crown className="w-4 h-4" />,
    Flame: <Flame className="w-4 h-4" />,
    Diamond: <Diamond className="w-4 h-4" />,
  };
  return icons[iconName] || <Star className="w-4 h-4" />;
};

const VIPProgressBar = ({ userStats, className }: VIPProgressBarProps) => {
  const { t } = useTranslation();

  if (!userStats) {
    return (
      <div className={cn("glass rounded-xl p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-warning" />
          <span className="text-sm font-medium text-foreground">{t('vipProgress.title')}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t('vipProgress.connectToSee')}</p>
      </div>
    );
  }

  const currentTierIndex = getVIPTierIndex(userStats.current_level, userStats.total_sol_recovered);
  const currentTier = VIP_TIERS[currentTierIndex];
  const nextTier = getNextVIPTier(userStats.current_level, userStats.total_sol_recovered);

  // Calculate progress to next tier
  let progress = 100;
  let progressLabel = t('vipProgress.maxTier');
  let solNeeded = 0;
  let levelNeeded = 0;

  if (nextTier) {
    // Calculate SOL progress
    const solProgress = Math.min(
      ((userStats.total_sol_recovered - currentTier.minSol) / (nextTier.minSol - currentTier.minSol)) * 100,
      100
    );
    // Calculate level progress
    const levelProgress = Math.min(
      ((userStats.current_level - currentTier.minLevel) / (nextTier.minLevel - currentTier.minLevel)) * 100,
      100
    );
    // Use the lower of the two (both requirements must be met)
    progress = Math.min(solProgress, levelProgress);
    
    solNeeded = Math.max(0, nextTier.minSol - userStats.total_sol_recovered);
    levelNeeded = Math.max(0, nextTier.minLevel - userStats.current_level);
    
    if (solNeeded > 0 && levelNeeded > 0) {
      progressLabel = `${solNeeded.toFixed(1)} SOL & ${levelNeeded} ${t('vipProgress.levels')}`;
    } else if (solNeeded > 0) {
      progressLabel = `${solNeeded.toFixed(1)} SOL ${t('vipProgress.toGo')}`;
    } else if (levelNeeded > 0) {
      progressLabel = `${levelNeeded} ${t('vipProgress.levelsToGo')}`;
    }
  }

  return (
    <div className={cn("glass rounded-xl p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentTier.color} flex items-center justify-center text-white`}>
            {getTierIcon(currentTier.icon)}
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">{currentTier.name}</span>
            <span className="text-xs text-muted-foreground ml-2">{currentTier.fee}% {t('vip.fee')}</span>
          </div>
        </div>
        
        {nextTier && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${nextTier.color} flex items-center justify-center text-white opacity-60`}>
              {getTierIcon(nextTier.icon)}
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">{nextTier.name}</span>
              <span className="text-xs text-green-500 ml-2">{nextTier.fee}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {t('vipProgress.progress')}: {Math.round(progress)}%
          </span>
          <span className="text-xs text-muted-foreground">
            {nextTier ? progressLabel : `🎉 ${progressLabel}`}
          </span>
        </div>
      </div>

      {nextTier && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            {t('vipProgress.unlockNext')} <span className="text-green-500 font-medium">{(currentTier.fee - nextTier.fee).toFixed(1)}%</span> {t('vipProgress.lowerFees')}
          </p>
        </div>
      )}
    </div>
  );
};

export default VIPProgressBar;
