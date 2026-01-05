import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Achievement } from "@/hooks/useGamification";
import AchievementCard from "./AchievementCard";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface AchievementUnlockModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

const AchievementUnlockModal = ({ achievements, onClose }: AchievementUnlockModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    // Fire confetti on mount
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ffff', '#bf00ff', '#ffd700']
    });
  }, []);

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  if (achievements.length === 0) return null;

  const current = achievements[currentIndex];

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
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20 }}
          className="relative w-full max-w-md glass-strong rounded-2xl p-6 border border-primary/30 shadow-glow"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4"
            >
              <Trophy className="w-8 h-8 text-background" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gradient">
              Conquista Desbloqueada!
            </h2>
            <p className="text-muted-foreground mt-1">
              {achievements.length > 1 
                ? `${currentIndex + 1} de ${achievements.length} conquistas`
                : "Parabéns pelo progresso!"
              }
            </p>
          </div>

          {/* Achievement Card */}
          <motion.div
            key={current.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="mb-6"
          >
            <AchievementCard 
              achievement={{ ...current, unlocked: true }} 
              size="md"
            />
          </motion.div>

          {/* XP Reward */}
          <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-primary/10 rounded-lg">
            <Star className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-lg font-bold text-primary">
              +{current.xp_reward} XP
            </span>
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>

          {/* Action Button */}
          <Button
            onClick={handleNext}
            variant="gradient"
            className="w-full"
            size="lg"
          >
            {currentIndex < achievements.length - 1 ? "Próxima Conquista" : "Incrível!"}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementUnlockModal;
