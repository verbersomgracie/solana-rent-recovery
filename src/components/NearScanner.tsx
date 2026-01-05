import { useState, useCallback, useEffect } from "react";
import { Search, Loader2, CheckCircle2, RefreshCw, Coins, DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNear, NearScannedAccount } from "@/hooks/useNear";
import confetti from "canvas-confetti";

interface NearScannerProps {
  simulationMode?: boolean;
}

interface DisplayAccount extends NearScannedAccount {
  id: string;
  selected: boolean;
}

const NearScanner = ({ simulationMode = false }: NearScannerProps) => {
  const {
    isConnected,
    accountId,
    isConnecting,
    isScanning,
    isProcessing,
    connect,
    disconnect,
    scanNearAccount,
    executeStorageRecovery,
  } = useNear();

  const [accounts, setAccounts] = useState<DisplayAccount[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [recoveryComplete, setRecoveryComplete] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [platformFeePercent, setPlatformFeePercent] = useState(5);
  const [hasAutoScanned, setHasAutoScanned] = useState(false);
  const [nearPrice, setNearPrice] = useState<number | null>(null);
  const [recoveredAmount, setRecoveredAmount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulate scanning with fake accounts
  const simulateScan = useCallback(async () => {
    setIsSimulating(true);
    setScanComplete(false);
    setRecoveryComplete(false);
    setLastTxHash(null);
    setAccounts([]);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const fakeAccounts: DisplayAccount[] = [
      { 
        id: 'sim-1', 
        contractId: 'wrap.near', 
        tokenName: 'Wrapped NEAR', 
        tokenSymbol: 'wNEAR',
        balance: '0',
        storageDeposit: 0.00125, 
        isRecoverable: true,
        supportsUnregister: true,
        selected: true 
      },
      { 
        id: 'sim-2', 
        contractId: 'usdt.tether-token.near', 
        tokenName: 'Tether USD', 
        tokenSymbol: 'USDt',
        balance: '0',
        storageDeposit: 0.00125, 
        isRecoverable: true,
        supportsUnregister: true,
        selected: true 
      },
      { 
        id: 'sim-3', 
        contractId: 'token.paras.near', 
        tokenName: 'PARAS', 
        tokenSymbol: 'PARAS',
        balance: '0',
        storageDeposit: 0.00125, 
        isRecoverable: true,
        supportsUnregister: true,
        selected: true 
      },
      { 
        id: 'sim-4', 
        contractId: 'aurora', 
        tokenName: 'Aurora', 
        tokenSymbol: 'AURORA',
        balance: '1000000',
        storageDeposit: 0.00125, 
        isRecoverable: false,
        supportsUnregister: true,
        selected: false 
      },
    ];

    setAccounts(fakeAccounts);
    setPlatformFeePercent(5);
    setScanComplete(true);
    setIsSimulating(false);
  }, []);

  // Fetch NEAR price
  useEffect(() => {
    const fetchNearPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd');
        const data = await response.json();
        setNearPrice(data.near.usd);
      } catch (error) {
        console.error('Failed to fetch NEAR price:', error);
      }
    };
    fetchNearPrice();
    const interval = setInterval(fetchNearPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00C08B', '#6AD7B9', '#FFD700']
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00C08B', '#6AD7B9', '#FFD700']
      });
    }, 150);
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00C08B', '#6AD7B9', '#FFD700']
      });
    }, 300);
  };

  const formatUSD = (near: number) => {
    if (!nearPrice) return null;
    const usd = near * nearPrice;
    return usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const handleScan = useCallback(async () => {
    setScanComplete(false);
    setRecoveryComplete(false);
    setLastTxHash(null);
    setAccounts([]);
    
    const result = await scanNearAccount();
    
    if (result) {
      const mappedAccounts: DisplayAccount[] = result.accounts.map((acc) => ({
        ...acc,
        id: acc.contractId,
        selected: acc.isRecoverable,
      }));
      
      setAccounts(mappedAccounts);
      setPlatformFeePercent(result.summary.platformFeePercent);
      setScanComplete(true);
    }
  }, [scanNearAccount]);

  // Auto-scan when wallet connects
  useEffect(() => {
    if (isConnected && accountId && !hasAutoScanned && !isScanning) {
      setHasAutoScanned(true);
      handleScan();
    }
    if (!isConnected) {
      setHasAutoScanned(false);
      setAccounts([]);
      setScanComplete(false);
      setRecoveryComplete(false);
    }
  }, [isConnected, accountId, hasAutoScanned, isScanning, handleScan]);

  const handleToggleAccount = (id: string) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === id && acc.isRecoverable ? { ...acc, selected: !acc.selected } : acc
    ));
  };

  const handleSelectAll = () => {
    const recoverableAccounts = accounts.filter(acc => acc.isRecoverable);
    const allSelected = recoverableAccounts.every(acc => acc.selected);
    setAccounts(prev => prev.map(acc => 
      acc.isRecoverable ? { ...acc, selected: !allSelected } : acc
    ));
  };

  const recoverableAccounts = accounts.filter(acc => acc.isRecoverable);
  const selectedAccounts = accounts.filter(acc => acc.selected && acc.isRecoverable);
  const totalRecoverable = selectedAccounts.reduce((sum, acc) => sum + acc.storageDeposit, 0);
  const platformFee = totalRecoverable * (platformFeePercent / 100);
  const netAmount = totalRecoverable - platformFee;

  const handleRecover = useCallback(async () => {
    if (selectedAccounts.length === 0) return;
    
    const contractIds = selectedAccounts.map(acc => acc.contractId);
    const result = await executeStorageRecovery(contractIds);
    
    if (result.success) {
      setRecoveredAmount(netAmount);
      setRecoveryComplete(true);
      setLastTxHash(result.txHash || null);
      setAccounts(prev => prev.filter(acc => !acc.selected || !acc.isRecoverable));
      triggerConfetti();
    }
  }, [selectedAccounts, executeStorageRecovery, netAmount]);

  // Simulate recovery
  const simulateRecover = useCallback(async () => {
    setIsSimulating(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setRecoveredAmount(netAmount);
    setRecoveryComplete(true);
    setLastTxHash('SimTxHash...DemoNEAR123456789');
    setAccounts([]);
    triggerConfetti();
    setIsSimulating(false);
  }, [netAmount]);

  if (!isConnected && !scanComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center glass-strong rounded-2xl p-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C08B] to-[#6AD7B9] flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Conecte sua Wallet NEAR</h2>
        <p className="text-muted-foreground mb-6">
          Conecte sua wallet NEAR para escanear tokens FT e recuperar storage deposits.
        </p>
        <Button 
          variant="gradient" 
          size="lg"
          onClick={connect}
          disabled={isConnecting}
          className="bg-gradient-to-r from-[#00C08B] to-[#6AD7B9]"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Conectando...
            </>
          ) : (
            "Conectar Wallet NEAR"
          )}
        </Button>
        
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
                  🧪 Simular Escaneamento NEAR
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
      {/* Connected Account Display */}
      {isConnected && accountId && (
        <div className="mb-4 flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Conectado:</span>
            <span className="text-sm font-mono text-foreground">{accountId}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={disconnect}>
            Desconectar
          </Button>
        </div>
      )}

      {/* Simulation Mode Banner */}
      {simulationMode && !isConnected && scanComplete && (
        <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg text-center">
          <span className="text-amber-500 text-sm font-medium">🧪 Modo Simulação - Dados fictícios para demonstração</span>
        </div>
      )}

      {/* Scanning Animation */}
      {(isScanning || isSimulating) && !scanComplete && (
        <div className="glass-strong rounded-2xl p-8 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#00C08B]/20" />
            <div className="absolute inset-0 rounded-full border-4 border-[#00C08B] border-t-transparent animate-spin" />
            <div className="absolute inset-4 rounded-full bg-[#00C08B]/10 animate-pulse flex items-center justify-center">
              <Search className="w-8 h-8 text-[#00C08B]" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {isSimulating ? '🧪 Simulando Escaneamento' : 'Escaneando NEAR'}
          </h3>
          <p className="text-muted-foreground">Buscando tokens FT com storage deposits...</p>
          <div className="mt-6 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00C08B] to-[#6AD7B9] animate-shimmer" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      {/* Quick Recovery Card */}
      {scanComplete && recoverableAccounts.length > 0 && !recoveryComplete && (
        <div className="glass-strong rounded-2xl p-8 mb-8 animate-fade-in-up">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#00C08B] to-[#6AD7B9] mb-4">
              <Coins className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-1">
              {totalRecoverable.toFixed(5)} NEAR
            </h2>
            {nearPrice && (
              <p className="text-lg text-green-500 font-semibold flex items-center justify-center gap-1">
                <DollarSign className="w-4 h-4" />
                {formatUSD(totalRecoverable)}
              </p>
            )}
            <p className="text-muted-foreground mt-1">disponível para recuperar</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Tokens encontrados</span>
              <span className="font-bold">{recoverableAccounts.length}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Taxa da plataforma ({platformFeePercent}%)</span>
              <span className="text-amber-500">-{platformFee.toFixed(5)} NEAR</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">Você recebe</span>
                <div className="text-right">
                  <span className="font-bold text-xl text-green-500 block">{netAmount.toFixed(5)} NEAR</span>
                  {nearPrice && (
                    <span className="text-sm text-green-400">{formatUSD(netAmount)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button 
            variant="gradient" 
            size="xl" 
            onClick={simulationMode && !isConnected ? simulateRecover : handleRecover}
            disabled={(isProcessing || isSimulating) || selectedAccounts.length === 0}
            className="w-full text-lg py-6 bg-gradient-to-r from-[#00C08B] to-[#6AD7B9]"
          >
            {(isProcessing || isSimulating) ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                {isSimulating ? 'Simulando...' : 'Processando...'}
              </>
            ) : (
              <>
                <Coins className="w-6 h-6 mr-2" />
                {simulationMode && !isConnected ? '🧪 ' : ''}Recuperar {netAmount.toFixed(5)} NEAR
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Ao clicar, você confirmará a transação na sua wallet NEAR
          </p>

          {/* Account details */}
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
              <span>Ver detalhes dos {accounts.length} tokens</span>
            </summary>
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {accounts.map((account) => (
                <div 
                  key={account.id}
                  onClick={() => handleToggleAccount(account.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    !account.isRecoverable 
                      ? 'bg-muted/20 opacity-50 cursor-not-allowed'
                      : account.selected 
                        ? 'bg-[#00C08B]/10 border border-[#00C08B]/30' 
                        : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={account.selected}
                      disabled={!account.isRecoverable}
                      onChange={() => handleToggleAccount(account.id)}
                      className="rounded"
                    />
                    <div>
                      <span className="text-sm font-medium">{account.tokenName}</span>
                      <span className="text-xs text-muted-foreground ml-2">({account.tokenSymbol})</span>
                      {!account.isRecoverable && (
                        <div className="flex items-center gap-1 text-xs text-amber-500">
                          <AlertTriangle className="w-3 h-3" />
                          {!account.supportsUnregister ? 'Não suporta unregister' : 'Saldo > 0'}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm ${account.isRecoverable ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {account.storageDeposit.toFixed(5)} NEAR
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {recoverableAccounts.every(acc => acc.selected) ? "Desmarcar Todas" : "Selecionar Todas"}
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
      {scanComplete && recoverableAccounts.length === 0 && (
        <div className="text-center glass-strong rounded-2xl p-12 animate-fade-in-up">
          <div className={`w-20 h-20 rounded-full ${recoveryComplete ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-success/20'} flex items-center justify-center mx-auto mb-6`}>
            {recoveryComplete ? (
              <Coins className="w-10 h-10 text-white" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-success" />
            )}
          </div>
          <h3 className="text-3xl font-bold text-foreground mb-2">
            {recoveryComplete ? "🎉 NEAR Recuperado!" : "Tudo Limpo!"}
          </h3>
          {recoveryComplete && recoveredAmount > 0 && (
            <div className="mb-4">
              <p className="text-2xl font-bold text-green-500">{recoveredAmount.toFixed(5)} NEAR</p>
              {nearPrice && (
                <p className="text-lg text-green-400">{formatUSD(recoveredAmount)}</p>
              )}
            </div>
          )}
          <p className="text-muted-foreground mb-6">
            {recoveryComplete 
              ? "Todos os storage deposits foram recuperados com sucesso!"
              : "Não encontramos tokens FT com storage deposits recuperáveis."
            }
          </p>
          
          {lastTxHash && (
            <a
              href={`https://explorer.${import.meta.env.VITE_NEAR_NETWORK || 'testnet'}.near.org/transactions/${lastTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#00C08B] hover:underline mb-6"
            >
              Ver transação no Explorer
            </a>
          )}
          
          <Button variant="outline" onClick={handleScan} disabled={isScanning}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            Escanear Novamente
          </Button>
        </div>
      )}
    </div>
  );
};

export default NearScanner;
