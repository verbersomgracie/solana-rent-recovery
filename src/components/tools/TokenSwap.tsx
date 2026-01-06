import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeftRight, ArrowDown, RefreshCw, ExternalLink } from "lucide-react";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { supabase } from "@/integrations/supabase/client";

const RPC_ENDPOINT = "https://solana-mainnet.g.alchemy.com/v2/demo";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

const POPULAR_TOKENS: Token[] = [
  { address: SOL_MINT, symbol: "SOL", name: "Solana", decimals: 9, logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" },
  { address: USDC_MINT, symbol: "USDC", name: "USD Coin", decimals: 6, logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png" },
  { address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", symbol: "USDT", name: "Tether USD", decimals: 6 },
  { address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", symbol: "JUP", name: "Jupiter", decimals: 6 },
  { address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", symbol: "BONK", name: "Bonk", decimals: 5 },
];

interface TokenSwapProps {
  walletAddress: string | null;
  getProvider: () => any;
  walletName: string | null;
}

interface Quote {
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  routePlan: any[];
}

const TokenSwap = ({ walletAddress, getProvider, walletName }: TokenSwapProps) => {
  const [inputToken, setInputToken] = useState<Token>(POPULAR_TOKENS[0]);
  const [outputToken, setOutputToken] = useState<Token>(POPULAR_TOKENS[1]);
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [customInputMint, setCustomInputMint] = useState("");
  const [customOutputMint, setCustomOutputMint] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showCustomOutput, setShowCustomOutput] = useState(false);

  const getQuote = useCallback(async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setOutputAmount("");
      setQuote(null);
      return;
    }

    setIsQuoting(true);
    try {
      const inputMint = showCustomInput && customInputMint ? customInputMint : inputToken.address;
      const outputMint = showCustomOutput && customOutputMint ? customOutputMint : outputToken.address;
      
      const amount = Math.floor(parseFloat(inputAmount) * Math.pow(10, inputToken.decimals));
      
      const { data, error } = await supabase.functions.invoke('jupiter-proxy', {
        body: {
          action: 'quote',
          inputMint,
          outputMint,
          amount,
          slippageBps: 50,
        },
      });
      
      if (error) {
        throw new Error(error.message || "Falha ao obter cotação");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const outAmountFormatted = (
        parseInt(data.outAmount) / Math.pow(10, outputToken.decimals)
      ).toFixed(outputToken.decimals);

      setOutputAmount(outAmountFormatted);
      setQuote({
        inAmount: data.inAmount,
        outAmount: data.outAmount,
        priceImpactPct: parseFloat(data.priceImpactPct || "0"),
        routePlan: data.routePlan || [],
      });
    } catch (error: any) {
      console.error("Quote error:", error);
      setOutputAmount("");
      setQuote(null);
      if (inputAmount && parseFloat(inputAmount) > 0) {
        toast.error("Erro ao obter cotação", {
          description: error.message,
        });
      }
    } finally {
      setIsQuoting(false);
    }
  }, [inputAmount, inputToken, outputToken, customInputMint, customOutputMint, showCustomInput, showCustomOutput]);

  // Debounce quote fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputAmount) {
        getQuote();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [inputAmount, getQuote]);

  const swapTokens = () => {
    const tempToken = inputToken;
    setInputToken(outputToken);
    setOutputToken(tempToken);
    setInputAmount(outputAmount);
    setOutputAmount("");
    setQuote(null);
    
    // Swap custom mints too
    const tempCustom = customInputMint;
    setCustomInputMint(customOutputMint);
    setCustomOutputMint(tempCustom);
    const tempShow = showCustomInput;
    setShowCustomInput(showCustomOutput);
    setShowCustomOutput(tempShow);
  };

  const executeSwap = useCallback(async () => {
    if (!quote || !walletAddress) {
      toast.error("Obtenha uma cotação primeiro");
      return;
    }

    setIsSwapping(true);
    try {
      const inputMint = showCustomInput && customInputMint ? customInputMint : inputToken.address;
      const outputMint = showCustomOutput && customOutputMint ? customOutputMint : outputToken.address;
      
      const amount = Math.floor(parseFloat(inputAmount) * Math.pow(10, inputToken.decimals));

      // Get swap transaction from Jupiter via edge function
      const { data: swapData, error } = await supabase.functions.invoke('jupiter-proxy', {
        body: {
          action: 'swap',
          quoteResponse: {
            inputMint,
            outputMint,
            inAmount: String(amount),
            outAmount: quote.outAmount,
            otherAmountThreshold: quote.outAmount,
            swapMode: "ExactIn",
            slippageBps: 50,
            priceImpactPct: String(quote.priceImpactPct),
            routePlan: quote.routePlan,
          },
          userPublicKey: walletAddress,
        },
      });

      if (error) {
        throw new Error(error.message || "Falha ao criar transação de swap");
      }

      if (swapData.error) {
        throw new Error(swapData.error);
      }

      // Deserialize and sign transaction
      const swapTransactionBuf = Uint8Array.from(atob(swapData.swapTransaction), c => c.charCodeAt(0));
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      toast.info("Confirme a transação na sua wallet...");

      const provider = getProvider();
      if (!provider) {
        throw new Error("Provider não encontrado");
      }

      // Sign the transaction
      const signedTx = await provider.signTransaction(transaction);
      
      // Send transaction
      const connection = new Connection(RPC_ENDPOINT);
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true,
        maxRetries: 3,
      });

      // Confirm transaction
      await connection.confirmTransaction(signature, "confirmed");

      toast.success("Swap realizado com sucesso!", {
        description: `Signature: ${signature.slice(0, 16)}...`,
      });

      // Reset form
      setInputAmount("");
      setOutputAmount("");
      setQuote(null);
    } catch (error: any) {
      console.error("Swap error:", error);
      if (error.message?.includes("rejected")) {
        toast.error("Transação cancelada");
      } else {
        toast.error("Erro ao realizar swap", {
          description: error.message,
        });
      }
    } finally {
      setIsSwapping(false);
    }
  }, [quote, walletAddress, inputAmount, inputToken, outputToken, customInputMint, customOutputMint, showCustomInput, showCustomOutput, getProvider]);

  return (
    <Card className="glass-strong border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary" />
          Token Swap - Jupiter
        </CardTitle>
        <CardDescription>
          Troque tokens usando o agregador Jupiter para os melhores preços
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Token */}
        <div className="space-y-3">
          <Label>De</Label>
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
            <div className="flex gap-2 flex-wrap">
              {POPULAR_TOKENS.map((token) => (
                <Button
                  key={token.address}
                  variant={inputToken.address === token.address && !showCustomInput ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setInputToken(token);
                    setShowCustomInput(false);
                    setQuote(null);
                    setOutputAmount("");
                  }}
                  className="flex items-center gap-1"
                >
                  {token.logoURI && (
                    <img src={token.logoURI} alt={token.symbol} className="w-4 h-4 rounded-full" />
                  )}
                  {token.symbol}
                </Button>
              ))}
              <Button
                variant={showCustomInput ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCustomInput(!showCustomInput)}
              >
                Custom
              </Button>
            </div>
            
            {showCustomInput && (
              <Input
                placeholder="Cole o endereço do token"
                value={customInputMint}
                onChange={(e) => setCustomInputMint(e.target.value)}
                className="font-mono text-sm"
              />
            )}

            <Input
              type="number"
              placeholder="0.00"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="text-xl font-bold bg-transparent border-0 p-0 focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={swapTokens}
            className="rounded-full h-10 w-10"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Output Token */}
        <div className="space-y-3">
          <Label>Para</Label>
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
            <div className="flex gap-2 flex-wrap">
              {POPULAR_TOKENS.map((token) => (
                <Button
                  key={token.address}
                  variant={outputToken.address === token.address && !showCustomOutput ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setOutputToken(token);
                    setShowCustomOutput(false);
                    setQuote(null);
                    setOutputAmount("");
                  }}
                  className="flex items-center gap-1"
                >
                  {token.logoURI && (
                    <img src={token.logoURI} alt={token.symbol} className="w-4 h-4 rounded-full" />
                  )}
                  {token.symbol}
                </Button>
              ))}
              <Button
                variant={showCustomOutput ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCustomOutput(!showCustomOutput)}
              >
                Custom
              </Button>
            </div>

            {showCustomOutput && (
              <Input
                placeholder="Cole o endereço do token"
                value={customOutputMint}
                onChange={(e) => setCustomOutputMint(e.target.value)}
                className="font-mono text-sm"
              />
            )}

            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="0.00"
                value={outputAmount}
                readOnly
                className="text-xl font-bold bg-transparent border-0 p-0 focus-visible:ring-0"
              />
              {isQuoting && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
        </div>

        {/* Quote Info */}
        {quote && (
          <div className="p-3 rounded-lg bg-muted/20 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price Impact</span>
              <span className={quote.priceImpactPct > 1 ? "text-warning" : "text-foreground"}>
                {quote.priceImpactPct.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage</span>
              <span>0.5%</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={executeSwap}
          disabled={isSwapping || !quote || !walletAddress}
          className="w-full bg-gradient-primary text-primary-foreground"
        >
          {isSwapping ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando Swap...
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              {quote ? "Realizar Swap" : "Insira um valor"}
            </>
          )}
        </Button>

        {/* Jupiter Link */}
        <a
          href="https://jup.ag"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Powered by Jupiter <ExternalLink className="w-3 h-3" />
        </a>
      </CardContent>
    </Card>
  );
};

export default TokenSwap;
