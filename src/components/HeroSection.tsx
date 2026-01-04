import { ArrowDown, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Solana Network</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up">
            Recupere o{" "}
            <span className="text-gradient">SOL</span>
            <br />
            Preso nas Suas Contas
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Escaneie sua wallet, identifique contas vazias e NFTs sem utilidade, 
            e recupere o SOL de rent de forma segura e automática.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gradient">50K+</div>
              <div className="text-sm text-muted-foreground">Contas Fechadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gradient">2,500+</div>
              <div className="text-sm text-muted-foreground">SOL Recuperado</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gradient">5%</div>
              <div className="text-sm text-muted-foreground">Taxa Mínima</div>
            </div>
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
            <Button variant="glass" size="xl" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>
              Saiba Mais
            </Button>
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
