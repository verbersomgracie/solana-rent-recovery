import { useState } from "react";
import { Flame, Wallet, Trophy, Star, Users, Gift, TrendingUp, LogOut, Home, Medal, Crown, ChevronLeft, ChevronRight, Copy, Check, Zap } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getVIPTier, getNextVIPTier, VIPTier } from "@/hooks/useVIPTier";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

interface UserStats {
  total_sol_recovered: number;
  total_accounts_closed: number;
  total_transactions: number;
  current_level: number;
  current_xp: number;
  referral_code: string | null;
  referral_count: number;
}

interface ProfileSidebarProps {
  walletAddress: string | null;
  userStats: UserStats | null;
  onDisconnect: () => void;
  onNavigate: (section: string) => void;
}

const ProfileSidebar = ({ walletAddress, userStats, onDisconnect, onNavigate }: ProfileSidebarProps) => {
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [copied, setCopied] = useState(false);
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const vipTier: VIPTier | null = userStats 
    ? getVIPTier(userStats.current_level, userStats.total_sol_recovered)
    : null;

  const nextTier: VIPTier | null = userStats 
    ? getNextVIPTier(userStats.current_level, userStats.total_sol_recovered)
    : null;

  const xpForNextLevel = userStats ? (userStats.current_level + 1) * 100 : 100;
  const xpProgress = userStats ? (userStats.current_xp / xpForNextLevel) * 100 : 0;

  const handleCopyReferralCode = () => {
    if (userStats?.referral_code) {
      navigator.clipboard.writeText(userStats.referral_code);
      setCopied(true);
      toast({
        title: t('referral.copied') || "Copied!",
        description: userStats.referral_code,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const menuItems = [
    { id: "scanner", icon: Home, label: t('nav.scanner') || "Scanner" },
    { id: "achievements", icon: Medal, label: t('gamification.achievements') || "Achievements" },
    { id: "leaderboard", icon: Trophy, label: t('gamification.leaderboard') || "Leaderboard" },
  ];

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-border/50 bg-card/50 backdrop-blur-xl"
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center animate-pulse-glow">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-gradient truncate">SOL Reclaim</h1>
              <p className="text-xs text-muted-foreground truncate">Recover your SOL</p>
            </div>
          )}
        </div>
        
        {/* Collapse toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={`absolute -right-3 top-6 z-50 h-6 w-6 rounded-full border border-border bg-card shadow-md hover:bg-muted ${isCollapsed ? 'hidden md:flex' : ''}`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* User Profile Card */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>{t('profile.title')}</SidebarGroupLabel>}
          <SidebarGroupContent>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center p-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <Wallet className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-mono text-xs">{walletAddress ? formatAddress(walletAddress) : "---"}</p>
                  <p className="text-xs text-muted-foreground">Level {userStats?.current_level || 1} • {vipTier?.name}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-foreground truncate">
                      {walletAddress ? formatAddress(walletAddress) : "---"}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs text-muted-foreground">{t('wallet.connected') || "Connected"}</span>
                    </div>
                  </div>
                </div>

                {/* Level & XP */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning" />
                      <span className="text-sm font-semibold text-foreground">
                        {t('gamification.level')} {userStats?.current_level || 1}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {userStats?.current_xp || 0}/{xpForNextLevel} XP
                    </span>
                  </div>
                  <Progress value={xpProgress} className="h-2" />
                </div>

                {/* VIP Tier */}
                {vipTier && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 mb-2">
                    <Crown className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-foreground">
                      {vipTier.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {vipTier.fee}% {t('vip.fee')}
                    </span>
                  </div>
                )}

                {/* Next tier progress */}
                {nextTier && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" />
                    <span>{t('vip.next')}: {nextTier.name} ({nextTier.fee}%)</span>
                  </div>
                )}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Stats - Only show when expanded */}
        {!isCollapsed && userStats && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>{t('gamification.stats') || "Stats"}</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="grid grid-cols-2 gap-2 px-1">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                    <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold text-foreground">
                      {userStats.total_sol_recovered.toFixed(4)}
                    </p>
                    <p className="text-xs text-muted-foreground">SOL</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                    <Gift className="w-4 h-4 mx-auto mb-1 text-secondary" />
                    <p className="text-lg font-bold text-foreground">
                      {userStats.total_accounts_closed}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('stats.accountsClosed') || "Accounts"}</p>
                  </div>
                </div>
                
                {/* Transactions */}
                <div className="mt-2 px-1">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30">
                    <Zap className="w-4 h-4 text-warning" />
                    <span className="text-sm text-muted-foreground">{t('gamification.transactions') || "Transactions"}</span>
                    <span className="text-sm font-bold text-foreground ml-auto">{userStats.total_transactions}</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Referral Section */}
            <SidebarGroup>
              <SidebarGroupLabel>{t('gamification.referrals') || "Referrals"}</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-1 space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30">
                    <Users className="w-4 h-4 text-accent" />
                    <span className="text-sm text-muted-foreground">{t('referral.invited') || "Invited"}</span>
                    <span className="text-sm font-bold text-foreground ml-auto">{userStats.referral_count}</span>
                  </div>
                  
                  {userStats.referral_code && (
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-xs text-muted-foreground mb-1">{t('referral.yourCode') || "Your code"}</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono text-primary truncate">
                          {userStats.referral_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={handleCopyReferralCode}
                        >
                          {copied ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />
          </>
        )}

        {/* Collapsed Stats Icons */}
        {isCollapsed && userStats && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex flex-col items-center gap-2 py-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/30 cursor-pointer hover:bg-muted/40 transition-colors">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-bold">{userStats.total_sol_recovered.toFixed(4)} SOL</p>
                    <p className="text-xs text-muted-foreground">Recovered</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/30 cursor-pointer hover:bg-muted/40 transition-colors">
                      <Gift className="w-4 h-4 text-secondary" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-bold">{userStats.total_accounts_closed}</p>
                    <p className="text-xs text-muted-foreground">{t('stats.accountsClosed') || "Accounts Closed"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/30 cursor-pointer hover:bg-muted/40 transition-colors">
                      <Users className="w-4 h-4 text-accent" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-bold">{userStats.referral_count}</p>
                    <p className="text-xs text-muted-foreground">{t('gamification.referrals') || "Referrals"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isCollapsed && <SidebarSeparator />}

        {/* Navigation */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>{t('nav.navigation') || "Navigation"}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.id)}
                    tooltip={item.label}
                    className="hover:bg-primary/10"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={isCollapsed ? "p-2" : "p-4"}>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onDisconnect}
                className="w-full text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t('wallet.disconnect')}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDisconnect}
            className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('wallet.disconnect')}</span>
          </Button>
        )}
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
};

export default ProfileSidebar;
