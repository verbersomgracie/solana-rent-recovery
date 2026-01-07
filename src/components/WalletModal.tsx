import { X, Loader2, ExternalLink, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (wallet: string) => Promise<boolean>;
  isConnecting?: boolean;
}

interface WalletInfo {
  name: string;
  icon: string;
  detected: boolean;
  deepLink?: string;
}

// Detect if user is on mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detect if iOS
const isIOS = () => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// Get the current app URL for deep linking
const getAppUrl = () => {
  return window.location.origin + window.location.pathname;
};

// Open wallet app with proper deep link handling
const openWalletApp = (walletName: string) => {
  const url = getAppUrl();
  const encodedUrl = encodeURIComponent(url);
  
  // Define app schemes for each wallet - use intent:// for Android
  const walletLinks: Record<string, { androidIntent: string; iosScheme: string; downloadUrl: string }> = {
    "Phantom": {
      androidIntent: `intent://browse/${encodedUrl}#Intent;scheme=phantom;package=app.phantom;end`,
      iosScheme: `phantom://browse/${encodedUrl}`,
      downloadUrl: "https://phantom.app/download"
    },
    "Solflare": {
      androidIntent: `intent://ul/v1/browse/${encodedUrl}#Intent;scheme=solflare;package=com.solflare.mobile;end`,
      iosScheme: `solflare://ul/v1/browse/${encodedUrl}`,
      downloadUrl: "https://solflare.com/download"
    },
    "Backpack": {
      androidIntent: `intent://browse/${encodedUrl}#Intent;scheme=backpack;package=app.backpack.wallet;end`,
      iosScheme: `backpack://browse/${encodedUrl}`,
      downloadUrl: "https://backpack.app/download"
    }
  };
  
  const links = walletLinks[walletName];
  if (!links) return false;
  
  if (isIOS()) {
    // On iOS, use the app scheme directly
    window.location.href = links.iosScheme;
  } else {
    // On Android, use intent:// which handles "app not installed" gracefully
    window.location.href = links.androidIntent;
  }
  
  return true;
};

const WalletModal = ({ isOpen, onClose, onSelectWallet, isConnecting }: WalletModalProps) => {
  const [wallets, setWallets] = useState<WalletInfo[]>([
    {
      name: "Phantom",
      icon: "https://phantom.app/img/phantom-icon-purple.svg",
      detected: false,
    },
    {
      name: "Solflare",
      icon: "https://solflare.com/favicon.ico",
      detected: false,
    },
    {
      name: "Backpack",
      icon: "https://backpack.app/favicon.ico",
      detected: false,
    },
    {
      name: "WalletConnect",
      icon: "https://avatars.githubusercontent.com/u/37784886",
      detected: true // WalletConnect is always available
    }
  ]);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  useEffect(() => {
    // Detect installed wallets
    const detectWallets = () => {
      setWallets(prev => prev.map(wallet => {
        // WalletConnect is always available
        if (wallet.name === "WalletConnect") {
          return { ...wallet, detected: true };
        }
        return {
          ...wallet,
          detected: wallet.name === "Phantom" ? !!window.phantom?.solana :
                    wallet.name === "Solflare" ? !!window.solflare :
                    wallet.name === "Backpack" ? !!window.backpack : false
        };
      }));
    };

    if (isOpen) {
      detectWallets();
      // Re-check after a short delay in case wallets load slowly
      const timeout = setTimeout(detectWallets, 500);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleSelectWallet = async (wallet: WalletInfo) => {
    // If on mobile and wallet not detected, open wallet app via deep link
    if (isMobileDevice && !wallet.detected && wallet.name !== "WalletConnect") {
      openWalletApp(wallet.name);
      return;
    }

    // If wallet not detected on desktop, show install link (except WalletConnect)
    if (!wallet.detected && !isMobileDevice && wallet.name !== "WalletConnect") {
      const installUrls: Record<string, string> = {
        "Phantom": "https://phantom.app/download",
        "Solflare": "https://solflare.com/download",
        "Backpack": "https://backpack.app/download"
      };
      window.open(installUrls[wallet.name], "_blank");
      return;
    }

    setConnectingWallet(wallet.name);
    const success = await onSelectWallet(wallet.name);
    if (success) {
      onClose();
    }
    setConnectingWallet(null);
  };

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

        {/* Mobile info banner */}
        {isMobileDevice && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Smartphone className="w-4 h-4" />
              <span>Toque para abrir o app da wallet</span>
            </div>
          </div>
        )}

        {/* Wallet list */}
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleSelectWallet(wallet)}
              disabled={connectingWallet !== null}
              className="w-full flex items-center gap-4 p-4 rounded-xl glass hover:border-primary/30 hover:bg-muted/50 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                {connectingWallet === wallet.name ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <img 
                    src={wallet.icon} 
                    alt={wallet.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300d4aa'%3E%3Cpath d='M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1'/%3E%3Cpath d='M10 12h11'/%3E%3Cpath d='M18 15l3-3-3-3'/%3E%3C/svg%3E";
                    }}
                  />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {wallet.name}
                </div>
                {wallet.name === "WalletConnect" ? (
                  <div className="text-xs text-primary">Conectar qualquer wallet</div>
                ) : wallet.detected ? (
                  <div className="text-xs text-success">Detectado</div>
                ) : isMobileDevice ? (
                  <div className="text-xs text-primary flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Abrir no app
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Clique para instalar</div>
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
