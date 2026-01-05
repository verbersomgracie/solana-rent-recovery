import { useState } from "react";
import { Copy, Check, Users, Gift, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReferralCardProps {
  referralCode: string | null;
  referralCount: number;
  referredBy: string | null;
  onApplyCode: (code: string) => Promise<boolean>;
  className?: string;
}

const ReferralCard = ({
  referralCode,
  referralCount,
  referredBy,
  onApplyCode,
  className
}: ReferralCardProps) => {
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const copyToClipboard = async () => {
    if (!referralCode) return;
    
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!referralCode) return;
    
    const shareUrl = `${window.location.origin}?ref=${referralCode}`;
    const shareText = `Recupere SOL preso nas suas contas Solana! Use meu código de referência: ${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SOL Reclaim',
          text: shareText,
          url: shareUrl
        });
      } catch (e) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado!");
    }
  };

  const handleApplyCode = async () => {
    if (!inputCode.trim()) return;
    
    setIsApplying(true);
    const success = await onApplyCode(inputCode.trim());
    if (success) {
      setInputCode("");
    }
    setIsApplying(false);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Your referral code */}
      <div className="glass rounded-xl p-5 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Seu Código de Referência</h3>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 relative">
            <Input
              value={referralCode || "Carregando..."}
              readOnly
              className="font-mono text-lg tracking-widest text-center bg-muted/50 border-primary/20"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            className="flex-shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={shareReferral}
            className="flex-shrink-0"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Amigos convidados</span>
          </div>
          <span className="text-xl font-bold text-gradient">{referralCount}</span>
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Ganhe XP bônus quando amigos usarem seu código!
        </p>
      </div>

      {/* Apply referral code */}
      {!referredBy && (
        <div className="glass rounded-xl p-5 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-secondary" />
            <h3 className="text-lg font-bold text-foreground">Usar Código de Referência</h3>
          </div>

          <div className="flex gap-2">
            <Input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Digite o código"
              className="font-mono tracking-widest uppercase"
              maxLength={8}
            />
            <Button
              onClick={handleApplyCode}
              disabled={!inputCode.trim() || isApplying}
              variant="gradient"
            >
              Aplicar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Insira o código de um amigo para ganhar bônus!
          </p>
        </div>
      )}

      {/* Already referred */}
      {referredBy && (
        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
          <Check className="w-4 h-4 text-success" />
          <span className="text-sm text-success">
            Você foi indicado pelo código: <span className="font-mono">{referredBy}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default ReferralCard;
