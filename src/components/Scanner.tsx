import { useState, useCallback, useEffect } from "react";
import { Search, Loader2, CheckCircle2, RefreshCw, ExternalLink, Coins, DollarSign, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountCard from "@/components/AccountCard";
import TransactionSummary from "@/components/TransactionSummary";
import { ScannedAccount } from "@/hooks/useSolana";
import { UserStats } from "@/hooks/useGamification";
import { VIP_TIERS, getVIPTierIndex } from "@/hooks/useVIPTier";
import { useTranslation } from "@/hooks/useTranslation";
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
  onTransactionComplete?: (solRecovered: number, accountsClosed: number) => void;
  vipFeePercent?: number;
  userStats?: UserStats | null;
}

const Scanner = ({ 
  walletConnected, 
  walletAddress, 
  scanAccounts,
  closeAccounts,
  isScanning,
  isProcessing,
  simulationMode = false,
  onTransactionComplete,
  vipFeePercent = 5,
  userStats
}: ScannerProps) => {
  const { t } = useTranslation();
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
  const actualFeePercent = userStats ? vipFeePercent : platformFeePercent;
  const platformFee = totalRecoverable * (actualFeePercent / 100);
  const netAmount = totalRecoverable - platformFee;
  const currentTierIndex = userStats ? getVIPTierIndex(userStats.current_level, userStats.total_sol_recovered) : 0;
  const currentTier = VIP_TIERS[currentTierIndex];

  const handleRecover = useCallback(async () => {
    if (selectedAccounts.length === 0) return;
    
    const accountAddresses = selectedAccounts.map(acc => acc.address);
    const accountsCount = selectedAccounts.length;
    const result = await closeAccounts(accountAddresses);
    
    if (result.success) {
      setRecoveredAmount(netAmount);
      setRecoveryComplete(true);
      setLastTxSignature(result.signature || null);
      setAccounts(prev => prev.filter(acc => !acc.selected));
      // Trigger confetti celebration!
      triggerConfetti();
      // Notify gamification system
      onTransactionComplete?.(netAmount, accountsCount);
    }
  }, [selectedAccounts, closeAccounts, netAmount, onTransactionComplete]);

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
      <div className="max-w-2xl mx-auto text-center glass-strong rounded-2xl p-12">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">{t('scanner.connectWallet')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('scanner.connectDesc')}
        </p>
        
        {/* Simulation Mode */}
        {simulationMode && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">{t('scanner.orTest')}:</p>
            <Button 
              variant="outline" 
              onClick={simulateScan}
              disabled={isSimulating}
              className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t('scanner.simulating')}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  🧪 {t('scanner.simulate')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
          {/* Simulation Mode Banner */}
          {simulationMode && !walletConnected && scanComplete && (
            <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg text-center">
              <span className="text-amber-500 text-sm font-medium">🧪 {t('scanner.simulationMode')}</span>
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
                  {isSimulating ? `🧪 ${t('scanner.simulating')}` : t('scanner.scanning')}
                </h3>
                <p className="text-muted-foreground">{t('scanner.searchingAccounts')}</p>
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
                <p className="text-muted-foreground mt-1">{t('scanner.availableToRecover')}</p>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">{t('scanner.accountsFound')}</span>
                  <span className="font-bold">{accounts.length}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t('scanner.platformFee')}</span>
                    {userStats && actualFeePercent < 5 && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${currentTier.color} text-white`}>
                        <Crown className="w-3 h-3" />
                        {currentTier.name}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {actualFeePercent < 5 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground line-through text-sm">5%</span>
                        <span className="text-green-500 font-bold">{actualFeePercent}%</span>
                      </div>
                    ) : (
                      <span>{actualFeePercent}%</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">{t('scanner.feeCharged')}</span>
                  <span className="text-amber-500">-{platformFee.toFixed(4)} SOL</span>
                </div>
                {actualFeePercent < 5 && (
                  <div className="flex justify-between items-center mb-2 text-green-500">
                    <span className="text-sm">💎 {t('scanner.vipDiscount')}</span>
                    <span className="text-sm font-medium">
                      {t('scanner.saving')} {((totalRecoverable * 0.05) - platformFee).toFixed(4)} SOL
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{t('scanner.youReceive')}</span>
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
                    {isSimulating ? t('scanner.simulating') : t('scanner.processing')}
                  </>
                ) : (
                  <>
                    <Coins className="w-6 h-6 mr-2" />
                    {simulationMode && !walletConnected ? '🧪 ' : ''}{t('scanner.recover')} {netAmount.toFixed(4)} SOL
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                {t('scanner.confirmTx')}
              </p>

              {/* Expandable account details */}
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <span>{t('scanner.viewDetails')} {accounts.length} {t('scanner.accounts')}</span>
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
                    {accounts.every(acc => acc.selected) ? t('scanner.deselectAll') : t('scanner.selectAll')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={simulationMode && !walletConnected ? simulateScan : handleScan}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {t('scanner.rescan')}
                  </Button>
                </div>
              </details>
            </div>
          )}

          {/* No accounts found state */}
          {scanComplete && accounts.length === 0 && !recoveryComplete && (
            <div className="max-w-2xl mx-auto">
              <div className="glass-strong rounded-2xl p-8 text-center animate-fade-in-up">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{t('scanner.allClean')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('scanner.noAccountsFound')}
                </p>
                <Button variant="outline" onClick={simulationMode && !walletConnected ? simulateScan : handleScan}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('scanner.scanAgain')}
                </Button>
              </div>
            </div>
          )}

          {/* Success state */}
          {recoveryComplete && (
            <div className="max-w-2xl mx-auto">
              <div className="glass-strong rounded-2xl p-8 text-center animate-fade-in-up">
                <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                  <CheckCircle2 className="w-12 h-12 text-primary-foreground" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-2">
                  {recoveredAmount.toFixed(4)} {t('scanner.solRecovered')}
                </h3>
                {solPrice && (
                  <p className="text-xl text-green-500 font-semibold mb-4">
                    {formatUSD(recoveredAmount)}
                  </p>
                )}
                <p className="text-muted-foreground mb-6">
                  {t('scanner.successMessage')}
                </p>
                {lastTxSignature && !lastTxSignature.startsWith('Sim') && (
                  <a 
                    href={`https://solscan.io/tx/${lastTxSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
                  >
                    {t('scanner.viewOnExplorer')}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <div className="mt-4">
                  <Button variant="outline" onClick={() => {
                    setRecoveryComplete(false);
                    if (simulationMode && !walletConnected) {
                      simulateScan();
                    } else {
                      handleScan();
                    }
                  }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('scanner.scanAgain')}
                  </Button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default Scanner;
