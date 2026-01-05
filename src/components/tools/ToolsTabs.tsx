import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Send, ArrowLeftRight, Trash2 } from "lucide-react";
import StuckTokens from "./StuckTokens";
import MassSend from "./MassSend";
import TokenSwap from "./TokenSwap";

interface ToolsTabsProps {
  walletAddress: string | null;
  isConnected: boolean;
  getProvider: () => any;
  walletName: string | null;
}

const ToolsTabs = ({ walletAddress, isConnected, getProvider, walletName }: ToolsTabsProps) => {
  const [activeTab, setActiveTab] = useState("stuck");

  if (!isConnected) {
    return (
      <div className="glass-strong rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Conecte sua wallet para acessar as ferramentas</p>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/30 p-1 rounded-xl">
        <TabsTrigger 
          value="stuck" 
          className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
        >
          <Flame className="w-4 h-4" />
          <span className="hidden sm:inline">Stuck Tokens</span>
        </TabsTrigger>
        <TabsTrigger 
          value="send" 
          className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Mass Send</span>
        </TabsTrigger>
        <TabsTrigger 
          value="swap" 
          className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span className="hidden sm:inline">Swap</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stuck" className="mt-0">
        <StuckTokens 
          walletAddress={walletAddress} 
          getProvider={getProvider}
          walletName={walletName}
        />
      </TabsContent>

      <TabsContent value="send" className="mt-0">
        <MassSend 
          walletAddress={walletAddress}
          getProvider={getProvider}
          walletName={walletName}
        />
      </TabsContent>

      <TabsContent value="swap" className="mt-0">
        <TokenSwap 
          walletAddress={walletAddress}
          getProvider={getProvider}
          walletName={walletName}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ToolsTabs;
