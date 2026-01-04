import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Scanner from "@/components/Scanner";
import HowItWorks from "@/components/HowItWorks";
import FeesSection from "@/components/FeesSection";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import WalletModal from "@/components/WalletModal";
import { useSolana } from "@/hooks/useSolana";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  
  // Fetch simulation mode from database
  useEffect(() => {
    const fetchSimulationMode = async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "simulation_mode_enabled")
        .maybeSingle();
      
      if (!error && data) {
        setSimulationEnabled(data.value === 'true');
      }
    };
    fetchSimulationMode();
  }, []);
  
  const { 
    isConnected, 
    publicKey, 
    isConnecting,
    isScanning,
    isProcessing,
    connect, 
    disconnect,
    scanAccounts,
    closeAccounts
  } = useSolana();

  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  const handleSelectWallet = async (wallet: string): Promise<boolean> => {
    const success = await connect(wallet);
    if (success) {
      setShowWalletModal(false);
    }
    return success;
  };

  const handleDisconnectWallet = () => {
    disconnect();
  };

  return (
    <div className="min-h-screen">
      <Header
        walletConnected={isConnected}
        walletAddress={publicKey}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
      />
      
      <main>
        <HeroSection 
          onConnectWallet={handleConnectWallet}
          walletConnected={isConnected}
        />
        
        <Scanner 
          walletConnected={isConnected}
          walletAddress={publicKey}
          scanAccounts={scanAccounts}
          closeAccounts={closeAccounts}
          isScanning={isScanning}
          isProcessing={isProcessing}
          simulationMode={simulationEnabled}
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
        isConnecting={isConnecting}
      />
    </div>
  );
};

export default Index;
