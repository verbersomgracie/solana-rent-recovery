import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Star, Zap, Coins, Trophy, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

interface LuckyWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onPrizeWon: (prize: Prize) => void;
}

interface Prize {
  id: string;
  name: string;
  description: string;
  type: "xp" | "discount" | "badge" | "nothing";
  value: number;
  color: string;
  icon: React.ElementType;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const PRIZES: Prize[] = [
  { id: "xp50", name: "+50 XP", description: "Bônus de experiência", type: "xp", value: 50, color: "#00ffff", icon: Zap, rarity: "common" },
  { id: "xp100", name: "+100 XP", description: "Grande bônus de XP", type: "xp", value: 100, color: "#9945FF", icon: Star, rarity: "rare" },
  { id: "xp250", name: "+250 XP", description: "Mega bônus de XP!", type: "xp", value: 250, color: "#FFD700", icon: Trophy, rarity: "epic" },
  { id: "discount1", name: "-0.5% Taxa", description: "Desconto na próxima transação", type: "discount", value: 0.5, color: "#14F195", icon: Coins, rarity: "rare" },
  { id: "discount2", name: "-1% Taxa", description: "Grande desconto!", type: "discount", value: 1, color: "#FF6B6B", icon: Gift, rarity: "epic" },
  { id: "lucky", name: "Sorte!", description: "Tente novamente grátis", type: "nothing", value: 0, color: "#FFD93D", icon: Sparkles, rarity: "common" },
];

const WEIGHTS = {
  common: 45,
  rare: 30,
  epic: 20,
  legendary: 5
};

const LuckyWheel = ({ isOpen, onClose, onPrizeWon }: LuckyWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);

  const getRandomPrize = useCallback(() => {
    const totalWeight = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const prize of PRIZES) {
      random -= WEIGHTS[prize.rarity];
      if (random <= 0) return prize;
    }
    return PRIZES[0];
  }, []);

  const spin = useCallback(() => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setShowResult(false);
    setSelectedPrize(null);

    const prize = getRandomPrize();
    const prizeIndex = PRIZES.findIndex(p => p.id === prize.id);
    const segmentAngle = 360 / PRIZES.length;
    const targetAngle = 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalRotation = rotation + (spins * 360) + targetAngle;
    
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedPrize(prize);
      setShowResult(true);
      
      if (prize.rarity === "epic" || prize.rarity === "legendary") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00ffff', '#9945FF', '#FFD700']
        });
      }
      
      onPrizeWon(prize);
    }, 4000);
  }, [isSpinning, rotation, getRandomPrize, onPrizeWon]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-full max-w-lg glass-strong rounded-2xl p-6 border border-primary/30"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gradient mb-2">Roda da Sorte</h2>
            <p className="text-muted-foreground">Gire e ganhe prêmios!</p>
          </div>

          {/* Wheel Container */}
          <div className="relative w-64 h-64 mx-auto mb-6">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
            </div>
            
            {/* Wheel */}
            <motion.div
              className="w-full h-full rounded-full border-4 border-primary/50 overflow-hidden"
              style={{
                background: `conic-gradient(${PRIZES.map((p, i) => 
                  `${p.color} ${i * (100/PRIZES.length)}% ${(i + 1) * (100/PRIZES.length)}%`
                ).join(', ')})`
              }}
              animate={{ rotate: rotation }}
              transition={{ 
                duration: isSpinning ? 4 : 0,
                ease: [0.2, 0.8, 0.2, 1]
              }}
            >
              {PRIZES.map((prize, index) => {
                const angle = (index * 360 / PRIZES.length) + (180 / PRIZES.length);
                return (
                  <div
                    key={prize.id}
                    className="absolute top-1/2 left-1/2 origin-center"
                    style={{
                      transform: `rotate(${angle}deg) translateY(-80px)`
                    }}
                  >
                    <prize.icon 
                      className="w-6 h-6 text-white drop-shadow-lg"
                      style={{ transform: `rotate(-${angle}deg)` }}
                    />
                  </div>
                );
              })}
            </motion.div>

            {/* Center button */}
            <button
              onClick={spin}
              disabled={isSpinning}
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                "w-16 h-16 rounded-full bg-background border-4 border-primary",
                "flex items-center justify-center text-primary font-bold",
                "hover:bg-primary hover:text-background transition-all",
                "shadow-glow",
                isSpinning && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSpinning ? "..." : "GIRAR"}
            </button>
          </div>

          {/* Result */}
          <AnimatePresence>
            {showResult && selectedPrize && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="text-center p-4 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <selectedPrize.icon className="w-6 h-6 text-primary" />
                  <span className="text-xl font-bold text-foreground">{selectedPrize.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedPrize.description}</p>
                {selectedPrize.rarity !== "common" && (
                  <span className={cn(
                    "inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium",
                    selectedPrize.rarity === "rare" && "bg-blue-500/20 text-blue-400",
                    selectedPrize.rarity === "epic" && "bg-purple-500/20 text-purple-400",
                    selectedPrize.rarity === "legendary" && "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {selectedPrize.rarity.toUpperCase()}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!showResult && (
            <Button
              onClick={spin}
              disabled={isSpinning}
              variant="gradient"
              className="w-full"
              size="lg"
            >
              {isSpinning ? "Girando..." : "Girar a Roda!"}
            </Button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LuckyWheel;
