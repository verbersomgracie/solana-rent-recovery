import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Scanner from "@/components/Scanner";
import HowItWorks from "@/components/HowItWorks";
import FeesSection from "@/components/FeesSection";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import WalletModal from "@/components/WalletModal";

const Index = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  const handleSelectWallet = (wallet: string) => {
    // Simulate wallet connection
    const mockAddress = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
    setWalletAddress(mockAddress);
    setWalletConnected(true);
    setShowWalletModal(false);
    toast.success(`${wallet} conectada com sucesso!`, {
      description: `Endereço: ${mockAddress.slice(0, 8)}...${mockAddress.slice(-8)}`
    });
  };

  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress(null);
    toast.info("Wallet desconectada");
  };

  return (
    <div className="min-h-screen">
      <Header
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
      />
      
      <main>
        <HeroSection 
          onConnectWallet={handleConnectWallet}
          walletConnected={walletConnected}
        />
        
        <Scanner 
          walletConnected={walletConnected}
          walletAddress={walletAddress}
        />
        
        <HowItWorks />
        
        <FeesSection />
        
        <FAQ />
      </main>
      
      <Footer />

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSelectWallet={handleSelectWallet}
      />
    </div>
  );
};

export default Index;
