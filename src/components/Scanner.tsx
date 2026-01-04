import { useState, useCallback, useEffect } from "react";
import { Search, Loader2, CheckCircle2, RefreshCw, ExternalLink, Coins, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountCard from "@/components/AccountCard";
import TransactionSummary from "@/components/TransactionSummary";
import { ScannedAccount } from "@/hooks/useSolana";
import confetti from "canvas-confetti";

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
  simulationMode?: boolean;
}

const Scanner = ({ 
  walletConnected, 
  walletAddress, 
  scanAccounts,
  closeAccounts,
  isScanning,
  isProcessing,
  simulationMode = false
}: ScannerProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [recoveryComplete, setRecoveryComplete] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);
  const [platformFeePercent, setPlatformFeePercent] = useState(5);
  const [hasAutoScanned, setHasAutoScanned] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [recoveredAmount, setRecoveredAmount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulate scanning with fake accounts
  const simulateScan = useCallback(async () => {
    setIsSimulating(true);
    setScanComplete(false);
    setRecoveryComplete(false);
    setLastTxSignature(null);
    setAccounts([]);

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const fakeAccounts: Account[] = [
      { id: 'sim-1', type: 'token', name: 'USDC Token Account', address: 'Sim1...Demo', rentSol: 0.00203928, selected: true },
      { id: 'sim-2', type: 'token', name: 'BONK Token Account', address: 'Sim2...Demo', rentSol: 0.00203928, selected: true },
      { id: 'sim-3', type: 'nft', name: 'Mad Lads #1234', address: 'Sim3...Demo', rentSol: 0.00203928, selected: true },
      { id: 'sim-4', type: 'nft', name: 'DeGods #5678', address: 'Sim4...Demo', rentSol: 0.00203928, selected: true },
      { id: 'sim-5', type: 'empty', name: 'Empty Account', address: 'Sim5...Demo', rentSol: 0.00089088, selected: true },
    ];

    setAccounts(fakeAccounts);
    setPlatformFeePercent(5);
    setScanComplete(true);
    setIsSimulating(false);
  }, []);


  // Fetch SOL price
  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        setSolPrice(data.solana.usd);
      } catch (error) {
        console.error('Failed to fetch SOL price:', error);
      }
    };
    fetchSolPrice();
    // Refresh price every 60 seconds
    const interval = setInterval(fetchSolPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const triggerConfetti = () => {
    // First burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#14F195', '#9945FF', '#FFD700']
    });
    // Second burst after delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#14F195', '#9945FF', '#FFD700']
      });
    }, 150);
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#14F195', '#9945FF', '#FFD700']
      });
    }, 300);
  };

  const formatUSD = (sol: number) => {
    if (!solPrice) return null;
    const usd = sol * solPrice;
    return usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

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
        selected: true, // Auto-select all accounts
        image: acc.image,
        mint: acc.mint
      }));
      
      setAccounts(mappedAccounts);
      setPlatformFeePercent(result.summary.platformFeePercent);
      setScanComplete(true);
    }
  }, [scanAccounts]);

  // Auto-scan when wallet connects
  useEffect(() => {
    if (walletConnected && walletAddress && !hasAutoScanned && !isScanning) {
      setHasAutoScanned(true);
      handleScan();
    }
    // Reset auto-scan flag when wallet disconnects
    if (!walletConnected) {
      setHasAutoScanned(false);
      setAccounts([]);
      setScanComplete(false);
      setRecoveryComplete(false);
    }
  }, [walletConnected, walletAddress, hasAutoScanned, isScanning, handleScan]);

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
      setRecoveredAmount(netAmount);
      setRecoveryComplete(true);
      setLastTxSignature(result.signature || null);
      setAccounts(prev => prev.filter(acc => !acc.selected));
      // Trigger confetti celebration!
      triggerConfetti();
    }
  }, [selectedAccounts, closeAccounts, netAmount]);

  // Simulate recovery
  const simulateRecover = useCallback(async () => {
    setIsSimulating(true);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setRecoveredAmount(netAmount);
    setRecoveryComplete(true);
    setLastTxSignature('SimTx...DemoSignature123456789');
    setAccounts([]);
    triggerConfetti();
    setIsSimulating(false);
  }, [netAmount]);

  if (!walletConnected && !scanComplete) {
    return (
      <section id="scanner" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center glass-strong rounded-2xl p-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Conecte sua Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Conecte sua wallet Solana para escanear suas contas e recuperar SOL preso em rent.
            </p>
            
            {/* Simulation Mode */}
            {simulationMode && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Ou teste o sistema:</p>
                <Button 
                  variant="outline" 
                  onClick={simulateScan}
                  disabled={isSimulating}
                  className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Simulando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      🧪 Simular Escaneamento
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="scanner" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Simulation Mode Banner */}
          {simulationMode && !walletConnected && scanComplete && (
            <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg text-center">
              <span className="text-amber-500 text-sm font-medium">🧪 Modo Simulação - Dados fictícios para demonstração</span>
            </div>
          )}

          {/* Scanning Animation */}
          {(isScanning || isSimulating) && (
            <div className="max-w-2xl mx-auto">
              <div className="glass-strong rounded-2xl p-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <div className="absolute inset-4 rounded-full bg-primary/10 animate-pulse flex items-center justify-center">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {isSimulating ? '🧪 Simulando Escaneamento' : 'Escaneando Blockchain'}
                </h3>
                <p className="text-muted-foreground">Buscando contas token e NFTs na Solana...</p>
                <div className="mt-6 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary animate-shimmer" style={{ width: "60%" }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick Recovery Card - Main CTA */}
          {scanComplete && accounts.length > 0 && !recoveryComplete && (
            <div className="glass-strong rounded-2xl p-8 mb-8 animate-fade-in-up">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-4">
                  <Coins className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-1">
                  {totalRecoverable.toFixed(4)} SOL
                </h2>
                {solPrice && (
                  <p className="text-lg text-green-500 font-semibold flex items-center justify-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {formatUSD(totalRecoverable)}
                  </p>
                )}
                <p className="text-muted-foreground mt-1">disponível para recuperar</p>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Contas encontradas</span>
                  <span className="font-bold">{accounts.length}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Taxa da plataforma ({platformFeePercent}%)</span>
                  <span className="text-amber-500">-{platformFee.toFixed(4)} SOL</span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">Você recebe</span>
                    <div className="text-right">
                      <span className="font-bold text-xl text-green-500 block">{netAmount.toFixed(4)} SOL</span>
                      {solPrice && (
                        <span className="text-sm text-green-400">{formatUSD(netAmount)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                variant="gradient" 
                size="xl" 
                onClick={simulationMode && !walletConnected ? simulateRecover : handleRecover}
                disabled={(isProcessing || isSimulating) || selectedAccounts.length === 0}
                className="w-full text-lg py-6"
              >
                {(isProcessing || isSimulating) ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    {isSimulating ? 'Simulando...' : 'Processando...'}
                  </>
                ) : (
                  <>
                    <Coins className="w-6 h-6 mr-2" />
                    {simulationMode && !walletConnected ? '🧪 ' : ''}Recuperar {netAmount.toFixed(4)} SOL
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Ao clicar, você confirmará a transação na sua wallet
              </p>

              {/* Expandable account details */}
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <span>Ver detalhes das {accounts.length} contas</span>
                </summary>
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {accounts.map((account) => (
                    <div 
                      key={account.id}
                      onClick={() => handleToggleAccount(account.id)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        account.selected 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={account.selected}
                          onChange={() => handleToggleAccount(account.id)}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">{account.name}</span>
                      </div>
                      <span className="text-sm text-green-500">{account.rentSol.toFixed(4)} SOL</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    {accounts.every(acc => acc.selected) ? "Desmarcar Todas" : "Selecionar Todas"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleScan} disabled={isScanning}>
                    <RefreshCw className={`w-4 h-4 mr-1 ${isScanning ? 'animate-spin' : ''}`} />
                    Re-escanear
                  </Button>
                </div>
              </details>
            </div>
          )}

          {/* Empty State / Success State */}
          {scanComplete && accounts.length === 0 && (
            <div className="max-w-2xl mx-auto text-center glass-strong rounded-2xl p-12 animate-fade-in-up">
              <div className={`w-20 h-20 rounded-full ${recoveryComplete ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-success/20'} flex items-center justify-center mx-auto mb-6`}>
                {recoveryComplete ? (
                  <Coins className="w-10 h-10 text-white" />
                ) : (
                  <CheckCircle2 className="w-10 h-10 text-success" />
                )}
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">
                {recoveryComplete ? "🎉 SOL Recuperado!" : "Tudo Limpo!"}
              </h3>
              {recoveryComplete && recoveredAmount > 0 && (
                <div className="mb-4">
                  <p className="text-2xl font-bold text-green-500">{recoveredAmount.toFixed(4)} SOL</p>
                  {solPrice && (
                    <p className="text-lg text-green-400">{formatUSD(recoveredAmount)}</p>
                  )}
                </div>
              )}
              <p className="text-muted-foreground mb-6">
                {recoveryComplete 
                  ? "Todas as contas foram fechadas com sucesso e o SOL foi enviado para sua wallet!"
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
