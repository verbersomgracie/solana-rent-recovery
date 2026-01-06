import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Send, Search, AlertCircle } from "lucide-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const MAX_TOKENS_PER_TX = 10; // Limit per transaction to avoid size issues

interface TokenAccount {
  address: string;
  mint: string;
  balance: number;
  decimals: number;
  name?: string;
  selected: boolean;
}

interface MassSendProps {
  walletAddress: string | null;
  getProvider: () => any;
  walletName: string | null;
}

const MassSend = ({ walletAddress, getProvider, walletName }: MassSendProps) => {
  const [destinationAddress, setDestinationAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokens, setTokens] = useState<TokenAccount[]>([]);
  const [scanned, setScanned] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const scanTokens = useCallback(async () => {
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

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPubkey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const tokenList: TokenAccount[] = [];

      for (const account of tokenAccounts.value) {
        const parsedInfo = account.account.data.parsed.info;
        const balance = parsedInfo.tokenAmount.uiAmount;
        
        if (balance > 0) {
          tokenList.push({
            address: account.pubkey.toString(),
            mint: parsedInfo.mint,
            balance,
            decimals: parsedInfo.tokenAmount.decimals,
            name: `Token ${parsedInfo.mint.slice(0, 8)}...`,
            selected: false,
          });
        }
      }

      setTokens(tokenList);
      setScanned(true);

      if (tokenList.length === 0) {
        toast.info("Nenhum token com saldo encontrado");
      } else {
        toast.success(`${tokenList.length} tokens encontrados`);
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

  const isValidAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const sendSelectedTokens = useCallback(async () => {
    const selectedTokens = tokens.filter((t) => t.selected);
    if (selectedTokens.length === 0) {
      toast.error("Selecione pelo menos um token");
      return;
    }

    if (!destinationAddress || !isValidAddress(destinationAddress)) {
      toast.error("Endereço de destino inválido");
      return;
    }

    if (!walletAddress) {
      toast.error("Wallet não conectada");
      return;
    }

    if (destinationAddress === walletAddress) {
      toast.error("Endereço de destino não pode ser a própria carteira");
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: selectedTokens.length });

    try {
      const connection = new Connection(RPC_ENDPOINT);
      const ownerPubkey = new PublicKey(walletAddress);
      const destinationPubkey = new PublicKey(destinationAddress);

      // Split into batches
      const batches: TokenAccount[][] = [];
      for (let i = 0; i < selectedTokens.length; i += MAX_TOKENS_PER_TX) {
        batches.push(selectedTokens.slice(i, i + MAX_TOKENS_PER_TX));
      }

      let successCount = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const transaction = new Transaction();

        for (const token of batch) {
          const mintPubkey = new PublicKey(token.mint);
          const sourceTokenAccount = new PublicKey(token.address);

          // Get or create destination ATA
          const destinationAta = await getAssociatedTokenAddress(
            mintPubkey,
            destinationPubkey
          );

          // Check if destination ATA exists
          const ataInfo = await connection.getAccountInfo(destinationAta);
          
          if (!ataInfo) {
            // Create ATA instruction
            const createAtaIx = createAssociatedTokenAccountInstruction(
              ownerPubkey,
              destinationAta,
              destinationPubkey,
              mintPubkey
            );
            transaction.add(createAtaIx);
          }

          // Calculate raw amount
          const rawAmount = BigInt(Math.floor(token.balance * Math.pow(10, token.decimals)));

          // Transfer instruction
          const transferIx = createTransferInstruction(
            sourceTokenAccount,
            destinationAta,
            ownerPubkey,
            rawAmount
          );
          transaction.add(transferIx);
        }

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = ownerPubkey;

        // Sign and send
        toast.info(`Confirme a transação ${batchIndex + 1}/${batches.length} na sua wallet...`);
        
        const provider = getProvider();
        if (!provider) {
          throw new Error("Provider não encontrado");
        }

        try {
          await provider.signAndSendTransaction(transaction);
          successCount += batch.length;
          setProgress({ current: successCount, total: selectedTokens.length });
        } catch (batchError: any) {
          if (batchError.message?.includes("rejected")) {
            toast.error(`Transação ${batchIndex + 1} cancelada`);
            break;
          }
          throw batchError;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} tokens enviados com sucesso!`);
        await scanTokens();
      }
    } catch (error: any) {
      console.error("Send error:", error);
      toast.error("Erro ao enviar tokens", {
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  }, [tokens, destinationAddress, walletAddress, getProvider, scanTokens]);

  const selectedCount = tokens.filter((t) => t.selected).length;

  return (
    <Card className="glass-strong border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          Mass Send - Envio em Lote
        </CardTitle>
        <CardDescription>
          Envie múltiplos tokens de uma só vez para outro endereço
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="destination">Endereço de Destino</Label>
          <Input
            id="destination"
            placeholder="Endereço Solana de destino"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            className="font-mono"
          />
          {destinationAddress && !isValidAddress(destinationAddress) && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Endereço inválido
            </p>
          )}
        </div>

        <Button
          onClick={scanTokens}
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
              Escanear Meus Tokens
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

            {isProcessing && progress.total > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Progresso: {progress.current}/{progress.total} tokens
              </div>
            )}

            <Button
              onClick={sendSelectedTokens}
              disabled={isProcessing || selectedCount === 0 || !isValidAddress(destinationAddress)}
              className="w-full bg-gradient-primary text-primary-foreground"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar {selectedCount} Token{selectedCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </>
        )}

        {scanned && tokens.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum token com saldo encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MassSend;
