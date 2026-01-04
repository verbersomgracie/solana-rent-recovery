import { useState } from "react";
import { Check, ImageOff, Coins, FileX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Account {
  id: string;
  type: "token" | "nft" | "empty";
  name: string;
  address: string;
  rentSol: number;
  selected: boolean;
  image?: string;
  mint?: string;
}

interface AccountCardProps {
  account: Account;
  onToggle: (id: string) => void;
}

const AccountCard = ({ account, onToggle }: AccountCardProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const getIcon = () => {
    switch (account.type) {
      case "nft":
        return <ImageOff className="w-5 h-5" />;
      case "token":
        return <Coins className="w-5 h-5" />;
      default:
        return <FileX className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (account.type) {
      case "nft":
        return "NFT Queimável";
      case "token":
        return "Token SPL Vazio";
      default:
        return "Conta Vazia";
    }
  };

  const getTypeColor = () => {
    switch (account.type) {
      case "nft":
        return "text-secondary";
      case "token":
        return "text-primary";
      default:
        return "text-warning";
    }
  };

  const hasValidImage = account.type === "nft" && account.image && !imageError;

  return (
    <div
      onClick={() => onToggle(account.id)}
      className={cn(
        "relative p-4 rounded-xl cursor-pointer transition-all duration-300 group",
        "border hover:border-primary/50",
        account.selected 
          ? "glass-strong border-primary/50 shadow-glow" 
          : "glass border-border"
      )}
    >
      {/* Selection indicator */}
      <div className={cn(
        "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 z-10",
        account.selected 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted border border-border group-hover:border-primary/50"
      )}>
        {account.selected && <Check className="w-4 h-4" />}
      </div>

      {/* NFT Image Preview */}
      {account.type === "nft" && account.image && (
        <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          )}
          <img
            src={account.image}
            alt={account.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              imageLoading ? "opacity-0" : "opacity-100",
              account.selected && "ring-2 ring-primary"
            )}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
          {/* Burn overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-background/80 to-transparent",
            "flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity"
          )}>
            <span className="text-xs font-medium text-destructive">🔥 Queimar</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon - only show if no image or image failed */}
        {(!hasValidImage) && (
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            "bg-muted/50 border border-border",
            getTypeColor()
          )}>
            {getIcon()}
          </div>
        )}

        {/* Content */}
        <div className={cn("flex-1 min-w-0", hasValidImage && "w-full")}>
          <div className={cn("text-xs font-medium mb-1", getTypeColor())}>
            {getTypeLabel()}
          </div>
          <div className="text-sm font-semibold text-foreground truncate mb-1">
            {account.name}
          </div>
          <div className="text-xs font-mono text-muted-foreground truncate">
            {account.address.slice(0, 8)}...{account.address.slice(-8)}
          </div>
        </div>
      </div>

      {/* Rent amount */}
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Rent Recuperável</span>
        <span className="text-sm font-bold text-gradient">{account.rentSol.toFixed(4)} SOL</span>
      </div>
    </div>
  );
};

export default AccountCard;
