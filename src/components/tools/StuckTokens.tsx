import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Flame, Search, AlertTriangle, Trash2 } from "lucide-react";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createCloseAccountInstruction, createBurnInstruction } from "@solana/spl-token";

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const INCINERATOR_ADDRESS = "1nc1nerator11111111111111111111111111111111";

interface TokenAccount {
  address: string;
  mint: string;
  balance: number;
  decimals: number;
  name?: string;
  selected: boolean;
}

interface StuckTokensProps {
  walletAddress: string | null;
  getProvider: () => any;
  walletName: string | null;
}

const StuckTokens = ({ walletAddress, getProvider, walletName }: StuckTokensProps) => {
  const [targetAddress, setTargetAddress] = useState(INCINERATOR_ADDRESS);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokens, setTokens] = useState<TokenAccount[]>([]);
  const [scanned, setScanned] = useState(false);

  const scanStuckTokens = useCallback(async () => {
    if (!walletAddress) {
      toast.error("Conecte sua wallet primeiro");
      return;
    }

    setIsScanning(true);
    setTokens([]);
    setScanned(false);

    try {
      const connection = new Connection(RPC_ENDPOINT);
      const ownerPubkey = new PublicKey(walletAddress);

      // Get all token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPubkey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const stuckTokens: TokenAccount[] = [];

      for (const account of tokenAccounts.value) {
        const parsedInfo = account.account.data.parsed.info;
        const balance = parsedInfo.tokenAmount.uiAmount;
        
        // Only include accounts with balance > 0 (stuck tokens have balance)
        if (balance > 0) {
          stuckTokens.push({
            address: account.pubkey.toString(),
            mint: parsedInfo.mint,
            balance,
            decimals: parsedInfo.tokenAmount.decimals,
            name: `Token ${parsedInfo.mint.slice(0, 8)}...`,
            selected: false,
          });
        }
      }

      setTokens(stuckTokens);
      setScanned(true);

      if (stuckTokens.length === 0) {
        toast.info("Nenhum token com saldo encontrado");
      } else {
        toast.success(`${stuckTokens.length} tokens encontrados`);
      }
    } catch (error: any) {
      console.error("Scan error:", error);
      toast.error("Erro ao escanear tokens", {
        description: error.message,
      });
    } finally {
      setIsScanning(false);
    }
  }, [walletAddress]);

  const toggleToken = (address: string) => {
    setTokens((prev) =>
      prev.map((t) => (t.address === address ? { ...t, selected: !t.selected } : t))
    );
  };

  const selectAll = () => {
    setTokens((prev) => prev.map((t) => ({ ...t, selected: true })));
  };

  const deselectAll = () => {
    setTokens((prev) => prev.map((t) => ({ ...t, selected: false })));
  };

  const burnSelectedTokens = useCallback(async () => {
    const selectedTokens = tokens.filter((t) => t.selected);
    if (selectedTokens.length === 0) {
      toast.error("Selecione pelo menos um token");
      return;
    }

    if (!walletAddress) {
      toast.error("Wallet não conectada");
      return;
    }

    setIsProcessing(true);

    try {
      const connection = new Connection(RPC_ENDPOINT);
      const ownerPubkey = new PublicKey(walletAddress);

      // Build transaction with burn instructions
      const transaction = new Transaction();

      for (const token of selectedTokens) {
        const tokenAccountPubkey = new PublicKey(token.address);
        const mintPubkey = new PublicKey(token.mint);
        
        // Calculate raw amount
        const rawAmount = BigInt(Math.floor(token.balance * Math.pow(10, token.decimals)));

        // Burn instruction
        const burnIx = createBurnInstruction(
          tokenAccountPubkey,
          mintPubkey,
          ownerPubkey,
          rawAmount
        );
        transaction.add(burnIx);

        // Close account to recover rent
        const closeIx = createCloseAccountInstruction(
          tokenAccountPubkey,
          ownerPubkey,
          ownerPubkey
        );
        transaction.add(closeIx);
      }

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPubkey;

      // Sign and send
      toast.info("Confirme a transação na sua wallet...");
      
      const provider = getProvider();
      if (!provider) {
        throw new Error("Provider não encontrado");
      }

      const result = await provider.signAndSendTransaction(transaction);
      
      toast.success(`${selectedTokens.length} tokens queimados!`, {
        description: `Signature: ${result.signature.slice(0, 16)}...`,
      });

      // Refresh list
      await scanStuckTokens();
    } catch (error: any) {
      console.error("Burn error:", error);
      if (error.message?.includes("rejected")) {
        toast.error("Transação cancelada");
      } else {
        toast.error("Erro ao queimar tokens", {
          description: error.message,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [tokens, walletAddress, getProvider, scanStuckTokens]);

  const selectedCount = tokens.filter((t) => t.selected).length;

  return (
    <Card className="glass-strong border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-destructive" />
          Stuck Tokens - Burn & Recover
        </CardTitle>
        <CardDescription>
          Queime tokens indesejados e recupere o SOL do rent das contas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Atenção</p>
              <p className="text-muted-foreground mt-1">
                Esta ação é irreversível. Os tokens serão permanentemente queimados e você
                receberá o SOL do rent das contas fechadas.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={scanStuckTokens}
          disabled={isScanning || !walletAddress}
          className="w-full bg-gradient-primary text-primary-foreground"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Escaneando...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Escanear Tokens com Saldo
            </>
          )}
        </Button>

        {scanned && tokens.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {tokens.length} tokens encontrados
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Selecionar Todos
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Limpar
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tokens.map((token) => (
                <div
                  key={token.address}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    token.selected
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/30 border-border hover:border-primary/50"
                  }`}
                  onClick={() => toggleToken(token.address)}
                >
                  <Checkbox checked={token.selected} />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate">{token.mint}</p>
                    <p className="text-xs text-muted-foreground">
                      Balance: {token.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={burnSelectedTokens}
              disabled={isProcessing || selectedCount === 0}
              variant="destructive"
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Queimando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Queimar {selectedCount} Token{selectedCount !== 1 ? "s" : ""} Selecionado
                  {selectedCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </>
        )}

        {scanned && tokens.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Flame className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum token com saldo encontrado na sua carteira</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StuckTokens;
