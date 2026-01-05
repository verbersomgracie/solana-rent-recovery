import { Wallet, Search, Flame, Coins } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const HowItWorks = () => {
  const { t } = useTranslation();
  
  const steps = [
    {
      icon: Wallet,
      titleKey: 'how.step1.title',
      descKey: 'how.step1.desc',
      color: "text-primary"
    },
    {
      icon: Search,
      titleKey: 'how.step2.title',
      descKey: 'how.step2.desc',
      color: "text-secondary"
    },
    {
      icon: Flame,
      titleKey: 'how.step3.title',
      descKey: 'how.step3.desc',
      color: "text-warning"
    },
    {
      icon: Coins,
      titleKey: 'how.step4.title',
      descKey: 'how.step4.desc',
      color: "text-success"
    }
  ];

  return (
    <section id="como-funciona" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('how.title')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('how.subtitle')}
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
                  <h3 className="text-lg font-bold text-foreground mb-2">{t(step.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(step.descKey)}</p>
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
