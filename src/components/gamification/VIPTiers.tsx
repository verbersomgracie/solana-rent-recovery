import { Crown, Star, Zap, Flame, Diamond, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { VIP_TIERS, getVIPTierIndex, getNextVIPTier } from "@/hooks/useVIPTier";

interface VIPTiersProps {
  currentLevel: number;
  totalSolRecovered: number;
  className?: string;
}

const ICONS = {
  Star,
  Shield,
  Crown,
  Flame,
  Diamond
};

const VIPTiers = ({ currentLevel, totalSolRecovered, className }: VIPTiersProps) => {
  const currentTierIndex = getVIPTierIndex(currentLevel, totalSolRecovered);
  const currentTier = VIP_TIERS[currentTierIndex];
  const nextTier = getNextVIPTier(currentLevel, totalSolRecovered);

  const getProgressToNextTier = () => {
    if (!nextTier) return 100;
    
    const levelProgress = Math.min((currentLevel / nextTier.minLevel) * 100, 100);
    const solProgress = Math.min((totalSolRecovered / nextTier.minSol) * 100, 100);
    
    return Math.min(levelProgress, solProgress);
  };

  const CurrentIcon = ICONS[currentTier.icon as keyof typeof ICONS] || Star;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Current Tier Card */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-6 border",
        `bg-gradient-to-br ${currentTier.color} border-white/20`
      )}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <CurrentIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-white/70">Seu nível VIP</div>
                <div className="text-2xl font-bold text-white">{currentTier.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{currentTier.fee}%</div>
              <div className="text-sm text-white/70">taxa</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {currentTier.benefits.map((benefit, index) => (
              <span 
                key={index}
                className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium"
              >
                {benefit}
              </span>
            ))}
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/80">
                <span>Próximo: {nextTier.name}</span>
                <span>{Math.floor(getProgressToNextTier())}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/80 transition-all"
                  style={{ width: `${getProgressToNextTier()}%` }}
                />
              </div>
              <div className="text-xs text-white/60 text-center">
                Nível {nextTier.minLevel} + {nextTier.minSol} SOL recuperado
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All Tiers List */}
      <div className="grid gap-3">
        <h4 className="text-sm font-medium text-muted-foreground">Todos os níveis VIP</h4>
        {VIP_TIERS.map((tier, index) => {
          const TierIcon = ICONS[tier.icon as keyof typeof ICONS] || Star;
          const isUnlocked = index <= currentTierIndex;
          const isCurrent = index === currentTierIndex;
          
          return (
            <div
              key={tier.name}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                isCurrent && "bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30",
                isUnlocked && !isCurrent && "bg-muted/30 border-border/50",
                !isUnlocked && "bg-muted/10 border-border/20 opacity-60"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isUnlocked ? `bg-gradient-to-br ${tier.color}` : "bg-muted"
              )}>
                <TierIcon className={cn(
                  "w-5 h-5",
                  isUnlocked ? "text-white" : "text-muted-foreground"
                )} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium",
                    isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {tier.name}
                  </span>
                  {isCurrent && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      Atual
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Lvl {tier.minLevel}+ • {tier.minSol} SOL+
                </div>
              </div>
              
              <div className={cn(
                "text-lg font-bold",
                isUnlocked ? "text-success" : "text-muted-foreground"
              )}>
                {tier.fee}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VIPTiers;
