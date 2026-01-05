import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaderboardEntry } from "@/hooks/useGamification";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentWallet?: string | null;
  className?: string;
}

const formatWallet = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
};

const getRankBg = (rank: number) => {
  if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30";
  if (rank === 2) return "bg-gradient-to-r from-gray-300/20 to-gray-400/10 border-gray-400/30";
  if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-orange-500/10 border-amber-600/30";
  return "bg-muted/30 border-border/50";
};

const Leaderboard = ({ entries, currentWallet, className }: LeaderboardProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Top Recuperadores</h3>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Nenhum dado ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isCurrentUser = currentWallet === entry.wallet_address;
            
            return (
              <div
                key={entry.wallet_address}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  getRankBg(entry.rank),
                  isCurrentUser && "ring-2 ring-primary/50"
                )}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Wallet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-mono text-sm",
                      isCurrentUser ? "text-primary font-bold" : "text-foreground"
                    )}>
                      {formatWallet(entry.wallet_address)}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                        Você
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Nível {entry.current_level} • {entry.total_accounts_closed} contas
                  </div>
                </div>

                {/* SOL Recovered */}
                <div className="text-right">
                  <div className="text-gradient font-bold">
                    {Number(entry.total_sol_recovered).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">SOL</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
