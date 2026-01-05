import { 
  Trophy, Crown, Star, Zap, Flame, Target, Coins, 
  Sparkles, Users, Medal, Trash2, Droplets, Network 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Achievement } from "@/hooks/useGamification";

interface AchievementCardProps {
  achievement: Achievement;
  showDetails?: boolean;
  size?: "sm" | "md";
}

const iconMap: Record<string, React.ElementType> = {
  Trophy, Crown, Star, Zap, Flame, Target, Coins,
  Sparkles, Users, Medal, Trash2, Droplets, Network,
  Broom: Sparkles // fallback
};

const colorMap: Record<string, string> = {
  primary: "from-primary to-primary/70 border-primary/30",
  secondary: "from-secondary to-secondary/70 border-secondary/30",
  warning: "from-warning to-amber-600 border-warning/30",
  success: "from-success to-emerald-600 border-success/30",
  destructive: "from-destructive to-red-700 border-destructive/30"
};

const AchievementCard = ({ 
  achievement, 
  showDetails = true,
  size = "md" 
}: AchievementCardProps) => {
  const Icon = iconMap[achievement.icon] || Star;
  const colorClass = colorMap[achievement.badge_color] || colorMap.primary;
  const isUnlocked = achievement.unlocked;

  return (
    <div 
      className={cn(
        "relative group rounded-xl border transition-all duration-300",
        isUnlocked 
          ? "glass border-primary/20 hover:border-primary/40" 
          : "bg-muted/30 border-border/30",
        size === "sm" ? "p-3" : "p-4"
      )}
    >
      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      
      <div className="relative flex items-start gap-3">
        {/* Badge icon */}
        <div 
          className={cn(
            "flex-shrink-0 rounded-lg flex items-center justify-center",
            isUnlocked 
              ? `bg-gradient-to-br ${colorClass}` 
              : "bg-muted border border-border/50",
            size === "sm" ? "w-10 h-10" : "w-12 h-12"
          )}
        >
          <Icon 
            className={cn(
              isUnlocked ? "text-background" : "text-muted-foreground/50",
              size === "sm" ? "w-5 h-5" : "w-6 h-6"
            )} 
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "font-semibold truncate",
              isUnlocked ? "text-foreground" : "text-muted-foreground",
              size === "sm" ? "text-sm" : "text-base"
            )}>
              {achievement.name}
            </h4>
            {isUnlocked && (
              <span className="flex-shrink-0 text-xs text-primary font-medium">
                ✓
              </span>
            )}
          </div>
          
          {showDetails && (
            <>
              <p className={cn(
                "text-muted-foreground mt-0.5 line-clamp-2",
                size === "sm" ? "text-xs" : "text-sm"
              )}>
                {achievement.description}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  isUnlocked 
                    ? "bg-primary/20 text-primary" 
                    : "bg-muted text-muted-foreground"
                )}>
                  <Zap className="w-3 h-3" />
                  +{achievement.xp_reward} XP
                </span>
                
                {!isUnlocked && (
                  <span className="text-xs text-muted-foreground">
                    {achievement.requirement_value} {
                      achievement.requirement_type === 'sol_recovered' ? 'SOL' :
                      achievement.requirement_type === 'accounts_closed' ? 'contas' :
                      achievement.requirement_type === 'referrals' ? 'referências' :
                      'transações'
                    }
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lock overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 rounded-xl bg-background/30 backdrop-blur-[1px]" />
      )}
    </div>
  );
};

export default AchievementCard;
