import { ArrowDown, Sparkles, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveStatsCounter from "./LiveStatsCounter";

interface HeroSectionProps {
  onConnectWallet: () => void;
  walletConnected: boolean;
}

const HeroSection = ({ onConnectWallet, walletConnected }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-warning/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Solana & NEAR Network</span>
            <Trophy className="w-4 h-4 text-warning" />
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up">
            Recupere o{" "}
            <span className="text-gradient">SOL</span>
            <br />
            Preso nas Suas Contas
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Escaneie sua wallet, identifique contas vazias e NFTs sem utilidade, 
            e recupere o SOL de rent. <span className="text-primary font-medium">Ganhe XP, suba de nível e pague menos taxas!</span>
          </p>

          {/* Live Stats Counter */}
          <div className="mb-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <LiveStatsCounter />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            {!walletConnected ? (
              <Button variant="gradient" size="xl" onClick={onConnectWallet} className="group">
                <Zap className="w-5 h-5 group-hover:animate-pulse" />
                Começar Agora
              </Button>
            ) : (
              <Button variant="gradient" size="xl" onClick={() => document.getElementById('scanner')?.scrollIntoView({ behavior: 'smooth' })}>
                <Zap className="w-5 h-5" />
                Escanear Wallet
              </Button>
            )}
            <Button variant="glass" size="xl" onClick={() => document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' })}>
              <Trophy className="w-5 h-5" />
              Ver Ranking
            </Button>
          </div>

          {/* VIP Benefits teaser */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <span className="text-warning">👑</span>
              <span className="text-muted-foreground">Taxas a partir de <span className="text-success font-medium">3%</span></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <span className="text-primary">🔥</span>
              <span className="text-muted-foreground">Streak diária = <span className="text-primary font-medium">+XP</span></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <span className="text-secondary">🎰</span>
              <span className="text-muted-foreground">Roda da Sorte após transações</span>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ArrowDown className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
