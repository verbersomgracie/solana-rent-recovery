import { Shield, Zap, Lock, Eye } from "lucide-react";

const FeesSection = () => {
  return (
    <section id="taxas" className="py-20 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Taxas <span className="text-gradient">Transparentes</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Cobramos apenas uma pequena taxa sobre o SOL recuperado. Sem custos ocultos.
            </p>
          </div>

          {/* Fee Card */}
          <div className="glass-strong rounded-3xl p-8 sm:p-12 mb-12 text-center animate-scale-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Taxa da Plataforma</span>
            </div>
            
            <div className="text-6xl sm:text-7xl font-bold text-gradient mb-4">5%</div>
            
            <p className="text-lg text-muted-foreground mb-8">
              sobre cada SOL recuperado
            </p>

            <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="text-2xl font-bold text-foreground mb-1">0.1 SOL</div>
                <div className="text-sm text-muted-foreground">Recuperado</div>
                <div className="text-xs text-primary mt-2">Taxa: 0.005 SOL</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="text-2xl font-bold text-foreground mb-1">0.5 SOL</div>
                <div className="text-sm text-muted-foreground">Recuperado</div>
                <div className="text-xs text-primary mt-2">Taxa: 0.025 SOL</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="text-2xl font-bold text-foreground mb-1">1.0 SOL</div>
                <div className="text-sm text-muted-foreground">Recuperado</div>
                <div className="text-xs text-primary mt-2">Taxa: 0.05 SOL</div>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="glass rounded-xl p-6 text-center animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-bold text-foreground mb-2">100% Seguro</h3>
              <p className="text-sm text-muted-foreground">
                Nunca solicitamos chaves privadas. Tudo é assinado pela sua wallet.
              </p>
            </div>

            <div className="glass rounded-xl p-6 text-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Transparente</h3>
              <p className="text-sm text-muted-foreground">
                Todas as transações são verificáveis na blockchain Solana.
              </p>
            </div>

            <div className="glass rounded-xl p-6 text-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Non-Custodial</h3>
              <p className="text-sm text-muted-foreground">
                Você mantém controle total dos seus fundos durante todo o processo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeesSection;
