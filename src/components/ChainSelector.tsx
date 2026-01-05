import { useState } from "react";
import { cn } from "@/lib/utils";

export type Chain = "solana" | "near";

interface ChainSelectorProps {
  selectedChain: Chain;
  onChainChange: (chain: Chain) => void;
}

const chains = [
  {
    id: "solana" as Chain,
    name: "Solana",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    description: "Recover SOL from token accounts",
    color: "from-[#9945FF] to-[#14F195]",
  },
  {
    id: "near" as Chain,
    name: "NEAR",
    icon: "https://cryptologos.cc/logos/near-protocol-near-logo.png",
    description: "Recover storage deposits",
    color: "from-[#00C08B] to-[#6AD7B9]",
  },
];

const ChainSelector = ({ selectedChain, onChainChange }: ChainSelectorProps) => {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {chains.map((chain) => (
        <button
          key={chain.id}
          onClick={() => onChainChange(chain.id)}
          className={cn(
            "relative flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300",
            "border-2",
            selectedChain === chain.id
              ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center overflow-hidden",
            selectedChain === chain.id ? `bg-gradient-to-br ${chain.color}` : "bg-muted"
          )}>
            <img
              src={chain.icon}
              alt={chain.name}
              className="w-6 h-6 object-contain"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300d4aa'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E";
              }}
            />
          </div>
          <div className="text-left">
            <div className={cn(
              "font-bold transition-colors",
              selectedChain === chain.id ? "text-primary" : "text-foreground"
            )}>
              {chain.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {chain.description}
            </div>
          </div>
          {selectedChain === chain.id && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
};

export default ChainSelector;
