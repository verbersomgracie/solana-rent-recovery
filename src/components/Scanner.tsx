import { useState, useCallback } from "react";
import { Search, Loader2, CheckCircle2, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountCard from "@/components/AccountCard";
import TransactionSummary from "@/components/TransactionSummary";
import { ScannedAccount } from "@/hooks/useSolana";

interface Account {
  id: string;
  type: 'token' | 'nft' | 'empty';
  name: string;
  address: string;
  rentSol: number;
  selected: boolean;
  image?: string;
  mint?: string;
}

interface ScanResult {
  accounts: ScannedAccount[];
  summary: {
    totalAccounts: number;
    totalRentSol: number;
    platformFeeSol: number;
    platformFeePercent: number;
    netAmountSol: number;
    feeWallet: string;
  };
}

interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

interface ScannerProps {
  walletConnected: boolean;
  walletAddress: string | null;
  scanAccounts: () => Promise<ScanResult | null>;
  closeAccounts: (addresses: string[]) => Promise<TransactionResult>;
  isScanning: boolean;
  isProcessing: boolean;
}

const Scanner = ({ 
  walletConnected, 
  walletAddress, 
  scanAccounts,
  closeAccounts,
  isScanning,
  isProcessing
}: ScannerProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [recoveryComplete, setRecoveryComplete] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);
  const [platformFeePercent, setPlatformFeePercent] = useState(5);

  const handleScan = useCallback(async () => {
    setScanComplete(false);
    setRecoveryComplete(false);
    setLastTxSignature(null);
    setAccounts([]);
    
    const result = await scanAccounts();
    
    if (result) {
      const mappedAccounts: Account[] = result.accounts.map((acc, index) => ({
        id: acc.address,
        type: acc.type,
        name: acc.name || (acc.type === 'nft' ? `NFT #${index + 1}` : `Token Account #${index + 1}`),
        address: acc.address,
        rentSol: acc.rentSol,
        selected: false,
        image: acc.image,
        mint: acc.mint
      }));
      
      setAccounts(mappedAccounts);
      setPlatformFeePercent(result.summary.platformFeePercent);
      setScanComplete(true);
    }
  }, [scanAccounts]);

  const handleToggleAccount = (id: string) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === id ? { ...acc, selected: !acc.selected } : acc
    ));
  };

  const handleSelectAll = () => {
    const allSelected = accounts.every(acc => acc.selected);
    setAccounts(prev => prev.map(acc => ({ ...acc, selected: !allSelected })));
  };

  const selectedAccounts = accounts.filter(acc => acc.selected);
  const totalRecoverable = selectedAccounts.reduce((sum, acc) => sum + acc.rentSol, 0);
  const platformFee = totalRecoverable * (platformFeePercent / 100);
  const netAmount = totalRecoverable - platformFee;

  const handleRecover = useCallback(async () => {
    if (selectedAccounts.length === 0) return;
    
    const accountAddresses = selectedAccounts.map(acc => acc.address);
    const result = await closeAccounts(accountAddresses);
    
    if (result.success) {
      setRecoveryComplete(true);
      setLastTxSignature(result.signature || null);
      setAccounts(prev => prev.filter(acc => !acc.selected));
    }
  }, [selectedAccounts, closeAccounts]);

  if (!walletConnected) {
    return (
      <section id="scanner" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center glass-strong rounded-2xl p-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Conecte sua Wallet</h2>
            <p className="text-muted-foreground">
              Conecte sua wallet Solana para escanear suas contas e recuperar SOL preso em rent.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="scanner" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Scanner de <span className="text-gradient">Contas</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Identifique contas SPL vazias, NFTs queimáveis e contas com rent recuperável.
            </p>
          </div>

          {/* Scan Button */}
          {!scanComplete && !isScanning && (
            <div className="flex justify-center mb-12">
              <Button 
                variant="gradient" 
                size="xl" 
                onClick={handleScan}
                disabled={isScanning}
                className="min-w-[200px]"
              >
                <Search className="w-5 h-5" />
                Escanear Wallet
              </Button>
            </div>
          )}

          {/* Scanning Animation */}
          {isScanning && (
            <div className="max-w-2xl mx-auto">
              <div className="glass-strong rounded-2xl p-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <div className="absolute inset-4 rounded-full bg-primary/10 animate-pulse flex items-center justify-center">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Escaneando Blockchain</h3>
                <p className="text-muted-foreground">Buscando contas token e NFTs na Solana...</p>
                <div className="mt-6 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary animate-shimmer" style={{ width: "60%" }} />
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {scanComplete && accounts.length > 0 && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Accounts List */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {accounts.length} Contas Encontradas
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedAccounts.length} selecionadas
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="glass" size="sm" onClick={handleSelectAll}>
                      {accounts.every(acc => acc.selected) ? "Desmarcar Todas" : "Selecionar Todas"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleScan} disabled={isScanning}>
                      <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {accounts.map((account, index) => (
                    <div 
                      key={account.id} 
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <AccountCard 
                        account={account} 
                        onToggle={handleToggleAccount}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <TransactionSummary
                    selectedCount={selectedAccounts.length}
                    totalRecoverable={totalRecoverable}
                    platformFee={platformFee}
                    platformFeePercent={platformFeePercent}
                    netAmount={netAmount}
                    isRecovering={isProcessing}
                    recoveryComplete={recoveryComplete}
                    onRecover={handleRecover}
                    txSignature={lastTxSignature}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {scanComplete && accounts.length === 0 && (
            <div className="max-w-2xl mx-auto text-center glass-strong rounded-2xl p-12">
              <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {recoveryComplete ? "SOL Recuperado!" : "Tudo Limpo!"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {recoveryComplete 
                  ? "Todas as contas selecionadas foram fechadas com sucesso e o SOL foi recuperado!"
                  : "Não encontramos contas vazias ou NFTs queimáveis na sua wallet."
                }
              </p>
              {lastTxSignature && (
                <a
                  href={`https://solscan.io/tx/${lastTxSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
                >
                  Ver transação no Solscan
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <div className="mt-4">
                <Button variant="glass" onClick={handleScan} disabled={isScanning}>
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  Escanear Novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Scanner;
