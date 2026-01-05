import { useState, useEffect, lazy, Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Scanner from "@/components/Scanner";
import ChainSelector, { Chain } from "@/components/ChainSelector";
import HowItWorks from "@/components/HowItWorks";
import VIPBanner from "@/components/VIPBanner";
import FeesSection from "@/components/FeesSection";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import WalletModal from "@/components/WalletModal";
import GamificationDashboard from "@/components/gamification/GamificationDashboard";
import AchievementUnlockModal from "@/components/gamification/AchievementUnlockModal";
import { useSolana } from "@/hooks/useSolana";
import { useGamification } from "@/hooks/useGamification";
import { getVIPFee } from "@/hooks/useVIPTier";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Lazy load NearScanner to avoid loading NEAR dependencies when not needed
const NearScanner = lazy(() => import("@/components/NearScanner"));

const Index = () => {
  const { t } = useTranslation();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const [selectedChain, setSelectedChain] = useState<Chain>("solana");
  
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

  const {
    userStats,
    achievements,
    leaderboard,
    isLoading: isGamificationLoading,
    newlyUnlocked,
    updateStatsAfterTransaction,
    applyReferralCode,
    clearNewlyUnlocked
  } = useGamification(publicKey);

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
        
        {/* Profile Section - Shows at top when wallet connected */}
        {isConnected && (
          <section id="profile" className="py-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">{t('profile.title')}</h2>
                <p className="text-muted-foreground">{t('profile.subtitle')}</p>
              </div>
              
              <GamificationDashboard
                userStats={userStats}
                achievements={achievements}
                leaderboard={leaderboard}
                walletAddress={publicKey}
                onApplyReferralCode={applyReferralCode}
                isLoading={isGamificationLoading}
              />
            </div>
          </section>
        )}
        
        {/* Chain Selector Section */}
        <section id="scanner" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">{t('scanner.chooseChain')}</h2>
              <p className="text-muted-foreground">{t('scanner.selectNetwork')}</p>
            </div>
            
            <ChainSelector 
              selectedChain={selectedChain}
              onChainChange={setSelectedChain}
            />
            
            {/* Conditional Scanner based on selected chain */}
            {selectedChain === "solana" ? (
              <Scanner 
                walletConnected={isConnected}
                walletAddress={publicKey}
                scanAccounts={scanAccounts}
                closeAccounts={closeAccounts}
                isScanning={isScanning}
                isProcessing={isProcessing}
                simulationMode={simulationEnabled}
                onTransactionComplete={updateStatsAfterTransaction}
                vipFeePercent={userStats ? getVIPFee(userStats.current_level, userStats.total_sol_recovered) : 5}
                userStats={userStats}
              />
            ) : (
              <Suspense fallback={
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              }>
                <NearScanner simulationMode={simulationEnabled} />
              </Suspense>
            )}
          </div>
        </section>
        
        <HowItWorks />
        
        <VIPBanner />
        
        {/* Profile Section - Shows at bottom when wallet NOT connected */}
        {!isConnected && (
          <section id="profile" className="py-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">{t('profile.title')}</h2>
                <p className="text-muted-foreground">{t('profile.subtitle')}</p>
              </div>
              
              <GamificationDashboard
                userStats={userStats}
                achievements={achievements}
                leaderboard={leaderboard}
                walletAddress={publicKey}
                onApplyReferralCode={applyReferralCode}
                isLoading={isGamificationLoading}
              />
            </div>
          </section>
        )}
        
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

      {/* Achievement unlock modal */}
      {newlyUnlocked.length > 0 && (
        <AchievementUnlockModal
          achievements={newlyUnlocked}
          onClose={clearNewlyUnlocked}
        />
      )}
    </div>
  );
};

export default Index;
