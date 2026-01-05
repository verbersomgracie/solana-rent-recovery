import { Crown, Star, Zap, Flame, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserLevelBadgeProps {
  level: number;
  xp: number;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getLevelIcon = (level: number) => {
  if (level >= 50) return Trophy;
  if (level >= 25) return Crown;
  if (level >= 10) return Flame;
  if (level >= 5) return Star;
  return Zap;
};

const getLevelColor = (level: number) => {
  if (level >= 50) return "from-yellow-400 to-amber-600";
  if (level >= 25) return "from-purple-400 to-pink-600";
  if (level >= 10) return "from-orange-400 to-red-500";
  if (level >= 5) return "from-primary to-secondary";
  return "from-primary/80 to-primary";
};

const getLevelTitle = (level: number) => {
  if (level >= 50) return "Lenda";
  if (level >= 25) return "Mestre";
  if (level >= 10) return "Expert";
  if (level >= 5) return "Veterano";
  if (level >= 2) return "Iniciado";
  return "Novato";
};

const getXpForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

const getLevelProgress = (xp: number, level: number): number => {
  let totalXpForPrevLevels = 0;
  for (let i = 1; i < level; i++) {
    totalXpForPrevLevels += getXpForLevel(i);
  }
  const xpInCurrentLevel = xp - totalXpForPrevLevels;
  const xpNeededForLevel = getXpForLevel(level);
  return Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);
};

const UserLevelBadge = ({ 
  level, 
  xp, 
  showProgress = false, 
  size = "md",
  className 
}: UserLevelBadgeProps) => {
  const Icon = getLevelIcon(level);
  const gradientColor = getLevelColor(level);
  const title = getLevelTitle(level);
  const progress = getLevelProgress(xp, level);
  const xpForNextLevel = getXpForLevel(level);
  
  let totalXpForPrevLevels = 0;
  for (let i = 1; i < level; i++) {
    totalXpForPrevLevels += getXpForLevel(i);
  }
  const xpInCurrentLevel = xp - totalXpForPrevLevels;

  const sizeClasses = {
    sm: "h-8 px-2 text-xs gap-1",
    md: "h-10 px-3 text-sm gap-2",
    lg: "h-12 px-4 text-base gap-2"
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div 
        className={cn(
          "flex items-center rounded-full glass border border-border/50",
          sizeClasses[size]
        )}
      >
        <div className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br",
          gradientColor,
          size === "sm" ? "w-5 h-5" : size === "md" ? "w-6 h-6" : "w-8 h-8"
        )}>
          <Icon className={cn(iconSizes[size], "text-background")} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-bold text-foreground">Lvl {level}</span>
          {size !== "sm" && (
            <span className="text-[10px] text-muted-foreground">{title}</span>
          )}
        </div>
      </div>
      
      {showProgress && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.floor(xpInCurrentLevel)} XP</span>
            <span>{xpForNextLevel} XP</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full bg-gradient-to-r transition-all duration-500", gradientColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLevelBadge;
