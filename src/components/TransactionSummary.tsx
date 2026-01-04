import { Flame, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransactionSummaryProps {
  selectedCount: number;
  totalRecoverable: number;
  platformFee: number;
  platformFeePercent: number;
  netAmount: number;
  isRecovering: boolean;
  recoveryComplete: boolean;
  onRecover: () => void;
}

const TransactionSummary = ({
  selectedCount,
  totalRecoverable,
  platformFee,
  platformFeePercent,
  netAmount,
  isRecovering,
  recoveryComplete,
  onRecover
}: TransactionSummaryProps) => {
  return (
    <div className="glass-strong rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          Resumo da Transação
        </h3>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Accounts Selected */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Contas Selecionadas</span>
          <span className="font-bold text-foreground">{selectedCount}</span>
        </div>

        {/* Divider */}
        <div className="glow-line" />

        {/* Total Recoverable */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">SOL Total Encontrado</span>
          <span className="font-bold text-foreground">{totalRecoverable.toFixed(6)} SOL</span>
        </div>

        {/* Platform Fee */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Taxa da Plataforma</span>
            <span className="text-xs text-muted-foreground">({platformFeePercent}%)</span>
          </div>
          <span className="font-bold text-destructive">-{platformFee.toFixed(6)} SOL</span>
        </div>

        {/* Divider */}
        <div className="glow-line" />

        {/* Net Amount */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground">Você Receberá</span>
          <span className="text-2xl font-bold text-gradient">{netAmount.toFixed(6)} SOL</span>
        </div>

        {/* Warning */}
        {selectedCount > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning/90">
              Esta ação é irreversível. As contas selecionadas serão fechadas permanentemente.
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button
          variant={recoveryComplete ? "success" : "gradient"}
          size="xl"
          className="w-full"
          disabled={selectedCount === 0 || isRecovering}
          onClick={onRecover}
        >
          {isRecovering ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : recoveryComplete ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Recuperado com Sucesso!
            </>
          ) : (
            <>
              <Flame className="w-5 h-5" />
              Recuperar SOL
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          A transação será assinada pela sua wallet. Nunca solicitamos chaves privadas.
        </p>
      </div>
    </div>
  );
};

export default TransactionSummary;
