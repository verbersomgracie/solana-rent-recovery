import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (wallet: string) => void;
}

const wallets = [
  {
    name: "Phantom",
    icon: "https://phantom.app/img/phantom-icon-purple.svg",
    detected: true
  },
  {
    name: "Solflare",
    icon: "https://solflare.com/favicon.ico",
    detected: false
  },
  {
    name: "Backpack",
    icon: "https://backpack.app/favicon.ico",
    detected: false
  }
];

const WalletModal = ({ isOpen, onClose, onSelectWallet }: WalletModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-strong rounded-2xl p-6 animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Conectar Wallet</h2>
          <p className="text-sm text-muted-foreground">
            Escolha sua wallet Solana para continuar
          </p>
        </div>

        {/* Wallet list */}
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => onSelectWallet(wallet.name)}
              className="w-full flex items-center gap-4 p-4 rounded-xl glass hover:border-primary/30 hover:bg-muted/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                <img 
                  src={wallet.icon} 
                  alt={wallet.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300d4aa'%3E%3Cpath d='M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1'/%3E%3Cpath d='M10 12h11'/%3E%3Cpath d='M18 15l3-3-3-3'/%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {wallet.name}
                </div>
                {wallet.detected && (
                  <div className="text-xs text-success">Detectado</div>
                )}
              </div>
              <div className="w-2 h-2 rounded-full bg-muted group-hover:bg-primary transition-colors" />
            </button>
          ))}
        </div>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          Ao conectar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
};

export default WalletModal;
