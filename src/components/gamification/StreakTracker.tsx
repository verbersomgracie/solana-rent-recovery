import { useState, useEffect } from "react";
import { Flame, Calendar, Gift, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  className?: string;
}

const STREAK_REWARDS = [
  { days: 3, bonus: "5% XP Extra", icon: "⚡" },
  { days: 7, bonus: "10% XP Extra", icon: "🔥" },
  { days: 14, bonus: "15% XP Extra + Badge", icon: "💎" },
  { days: 30, bonus: "20% XP Extra + Taxa -0.5%", icon: "👑" }
];

const StreakTracker = ({ 
  currentStreak, 
  longestStreak, 
  lastActiveDate,
  className 
}: StreakTrackerProps) => {
  const [isActive, setIsActive] = useState(false);
  const [hoursUntilReset, setHoursUntilReset] = useState(0);

  useEffect(() => {
    if (!lastActiveDate) {
      setIsActive(false);
      return;
    }

    const lastActive = new Date(lastActiveDate);
    const now = new Date();
    const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      setIsActive(true);
      setHoursUntilReset(Math.max(0, 24 - diffHours));
    } else if (diffHours < 48) {
      setIsActive(false);
      setHoursUntilReset(Math.max(0, 48 - diffHours));
    } else {
      setIsActive(false);
      setHoursUntilReset(0);
    }
  }, [lastActiveDate]);

  const nextReward = STREAK_REWARDS.find(r => r.days > currentStreak);
  const currentReward = STREAK_REWARDS.filter(r => r.days <= currentStreak).pop();

  const getFlameColor = () => {
    if (currentStreak >= 30) return "text-yellow-400";
    if (currentStreak >= 14) return "text-purple-400";
    if (currentStreak >= 7) return "text-orange-500";
    if (currentStreak >= 3) return "text-primary";
    return "text-muted-foreground";
  };

  return (
    <div className={cn("glass rounded-xl p-5 border border-border/50", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className={cn("w-6 h-6", getFlameColor(), currentStreak > 0 && "animate-pulse")} />
          <h3 className="text-lg font-bold text-foreground">Streak Diária</h3>
        </div>
        {isActive && hoursUntilReset > 0 && (
          <div className="text-xs text-muted-foreground">
            Reseta em {Math.floor(hoursUntilReset)}h
          </div>
        )}
      </div>

      {/* Current Streak Display */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="text-center">
          <div className={cn(
            "text-5xl font-bold",
            currentStreak > 0 ? "text-gradient" : "text-muted-foreground"
          )}>
            {currentStreak}
          </div>
          <div className="text-sm text-muted-foreground">dias seguidos</div>
        </div>
        
        <div className="h-16 w-px bg-border" />
        
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{longestStreak}</div>
          <div className="text-xs text-muted-foreground">recorde</div>
        </div>
      </div>

      {/* Week Progress */}
      <div className="flex justify-between mb-4">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => {
          const isCompleted = index < (currentStreak % 7);
          const isToday = index === (currentStreak % 7);
          
          return (
            <div
              key={index}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                isCompleted && "bg-primary text-primary-foreground",
                isToday && !isActive && "bg-muted border-2 border-dashed border-primary",
                isToday && isActive && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                !isCompleted && !isToday && "bg-muted/50 text-muted-foreground"
              )}
            >
              {isCompleted ? "✓" : day}
            </div>
          );
        })}
      </div>

      {/* Current Bonus */}
      {currentReward && (
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentReward.icon}</span>
            <div>
              <div className="text-sm font-medium text-foreground">Bônus Ativo</div>
              <div className="text-xs text-primary">{currentReward.bonus}</div>
            </div>
          </div>
        </div>
      )}

      {/* Next Reward Progress */}
      {nextReward && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Próxima recompensa</span>
            <span className="font-medium text-foreground">
              {nextReward.icon} {nextReward.days} dias
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
              style={{ width: `${(currentStreak / nextReward.days) * 100}%` }}
            />
          </div>
          <div className="text-xs text-center text-muted-foreground">
            Faltam {nextReward.days - currentStreak} dias para {nextReward.bonus}
          </div>
        </div>
      )}

      {/* Inactive Warning */}
      {!isActive && currentStreak > 0 && hoursUntilReset > 0 && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-center gap-2 text-warning text-sm">
            <Zap className="w-4 h-4" />
            <span>Faça uma transação para manter sua streak!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakTracker;
