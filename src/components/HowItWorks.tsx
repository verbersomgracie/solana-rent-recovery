import { Wallet, Search, Flame, Coins } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    title: "Conecte sua Wallet",
    description: "Conecte sua wallet Solana (Phantom, Solflare, Backpack) de forma segura.",
    color: "text-primary"
  },
  {
    icon: Search,
    title: "Escaneie suas Contas",
    description: "Nosso scanner identifica automaticamente contas vazias, NFTs queimáveis e rent recuperável.",
    color: "text-secondary"
  },
  {
    icon: Flame,
    title: "Selecione e Queime",
    description: "Escolha as contas que deseja fechar. Você tem controle total sobre o que será processado.",
    color: "text-warning"
  },
  {
    icon: Coins,
    title: "Recupere seu SOL",
    description: "O SOL de rent é recuperado e enviado para sua wallet, menos a taxa da plataforma.",
    color: "text-success"
  }
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Como <span className="text-gradient">Funciona</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Recuperar SOL preso em rent nunca foi tão simples. Siga estes 4 passos.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
                )}

                <div className="glass-strong rounded-2xl p-6 h-full relative z-10 group hover:border-primary/30 transition-all duration-300">
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                    <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-muted/50 border border-border flex items-center justify-center mb-4 ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
