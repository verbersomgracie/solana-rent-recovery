import { Flame, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  walletConnected: boolean;
  walletAddress: string | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
}

const Header = ({ walletConnected, walletAddress, onConnectWallet, onDisconnectWallet }: HeaderProps) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center animate-pulse-glow">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gradient">SOL Reclaim</h1>
            <p className="text-xs text-muted-foreground">Recupere seu SOL</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Como Funciona
          </a>
          <a href="#profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Perfil
          </a>
          <a href="#taxas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Taxas
          </a>
          <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {walletConnected && walletAddress ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-mono text-foreground">{formatAddress(walletAddress)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={onDisconnectWallet}>
                Desconectar
              </Button>
            </div>
          ) : (
            <Button variant="gradient" onClick={onConnectWallet} className="gap-2">
              <Wallet className="w-4 h-4" />
              Conectar Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
