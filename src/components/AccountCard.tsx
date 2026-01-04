import { Check, ImageOff, Coins, FileX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Account {
  id: string;
  type: "token" | "nft" | "empty";
  name: string;
  address: string;
  rentSol: number;
  selected: boolean;
}

interface AccountCardProps {
  account: Account;
  onToggle: (id: string) => void;
}

const AccountCard = ({ account, onToggle }: AccountCardProps) => {
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
        "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
        account.selected 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted border border-border group-hover:border-primary/50"
      )}>
        {account.selected && <Check className="w-4 h-4" />}
      </div>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          "bg-muted/50 border border-border",
          getTypeColor()
        )}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
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
