import { Crown, Star, Zap, Flame, Diamond, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VIPTiersProps {
  currentLevel: number;
  totalSolRecovered: number;
  className?: string;
}

const VIP_TIERS = [
  {
    name: "Bronze",
    minLevel: 1,
    minSol: 0,
    fee: 5.0,
    icon: Star,
    color: "from-amber-700 to-amber-900",
    benefits: ["Acesso básico", "Conquistas padrão"]
  },
  {
    name: "Prata",
    minLevel: 5,
    minSol: 5,
    fee: 4.5,
    icon: Shield,
    color: "from-gray-400 to-gray-600",
    benefits: ["Taxa reduzida 4.5%", "Badge exclusivo", "Suporte prioritário"]
  },
  {
    name: "Ouro",
    minLevel: 10,
    minSol: 25,
    fee: 4.0,
    icon: Crown,
    color: "from-yellow-400 to-amber-600",
    benefits: ["Taxa reduzida 4%", "XP +10%", "Acesso antecipado"]
  },
  {
    name: "Platina",
    minLevel: 20,
    minSol: 100,
    fee: 3.5,
    icon: Flame,
    color: "from-cyan-400 to-blue-600",
    benefits: ["Taxa reduzida 3.5%", "XP +20%", "NFT exclusivo"]
  },
  {
    name: "Diamante",
    minLevel: 50,
    minSol: 500,
    fee: 3.0,
    icon: Diamond,
    color: "from-purple-400 to-pink-600",
    benefits: ["Taxa mínima 3%", "XP +30%", "Acesso VIP", "Sorteios especiais"]
  }
];

const VIPTiers = ({ currentLevel, totalSolRecovered, className }: VIPTiersProps) => {
  // Determine current tier
  const getCurrentTier = () => {
    for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
      const tier = VIP_TIERS[i];
      if (currentLevel >= tier.minLevel && totalSolRecovered >= tier.minSol) {
        return i;
      }
    }
    return 0;
  };

  const currentTierIndex = getCurrentTier();
  const currentTier = VIP_TIERS[currentTierIndex];
  const nextTier = VIP_TIERS[currentTierIndex + 1];

  const getProgressToNextTier = () => {
    if (!nextTier) return 100;
    
    const levelProgress = Math.min((currentLevel / nextTier.minLevel) * 100, 100);
    const solProgress = Math.min((totalSolRecovered / nextTier.minSol) * 100, 100);
    
    return Math.min(levelProgress, solProgress);
  };

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
                <currentTier.icon className="w-8 h-8 text-white" />
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
          const Icon = tier.icon;
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
                <Icon className={cn(
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
