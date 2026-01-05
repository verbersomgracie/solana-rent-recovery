import { Crown, TrendingDown, Star, Zap } from "lucide-react";
import { VIP_TIERS } from "@/hooks/useVIPTier";
import { useTranslation } from "@/hooks/useTranslation";

const VIPBanner = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-warning/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Crown className="w-5 h-5 text-warning" />
            <span className="text-sm font-medium text-warning">{t('vipBanner.badge')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('vipBanner.title')} <span className="text-gradient">{t('vipBanner.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('vipBanner.subtitle')}
          </p>
        </div>

        {/* VIP Tiers showcase */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {VIP_TIERS.map((tier, index) => (
            <div 
              key={tier.name}
              className={`glass rounded-xl p-4 text-center transition-all hover:scale-105 hover:shadow-lg ${
                index === 0 ? 'opacity-70' : ''
              }`}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-foreground mb-1">{tier.name}</h3>
              <div className="flex items-center justify-center gap-1 mb-2">
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="text-xl font-bold text-green-500">{tier.fee}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('vipBanner.level')} {tier.minLevel}+ • {tier.minSol}+ SOL
              </p>
            </div>
          ))}
        </div>

        {/* Benefits highlight */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass rounded-xl p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingDown className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{t('vipBanner.feesFrom')}</h3>
            <p className="text-3xl font-bold text-green-500 mb-2">3%</p>
            <p className="text-sm text-muted-foreground">{t('vipBanner.feesDesc')}</p>
          </div>

          <div className="glass rounded-xl p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{t('vipBanner.automatic')}</h3>
            <p className="text-3xl font-bold text-primary mb-2">+XP</p>
            <p className="text-sm text-muted-foreground">{t('vipBanner.automaticDesc')}</p>
          </div>

          <div className="glass rounded-xl p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-warning/20 flex items-center justify-center">
              <Crown className="w-7 h-7 text-warning" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{t('vipBanner.exclusive')}</h3>
            <p className="text-3xl font-bold text-warning mb-2">VIP</p>
            <p className="text-sm text-muted-foreground">{t('vipBanner.exclusiveDesc')}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <p className="text-muted-foreground">
            {t('vipBanner.cta')} <span className="text-primary font-semibold">{t('vipBanner.ctaHighlight')}</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default VIPBanner;
