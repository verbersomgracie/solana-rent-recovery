import { Flame, Wallet, Trophy, Star, Users, Gift, TrendingUp, LogOut, Home, BarChart3, Medal, Crown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getVIPTier, VIPTier } from "@/hooks/useVIPTier";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const vipTier: VIPTier | null = userStats 
    ? getVIPTier(userStats.current_level, userStats.total_sol_recovered)
    : null;

  const xpForNextLevel = userStats ? (userStats.current_level + 1) * 100 : 100;
  const xpProgress = userStats ? (userStats.current_xp / xpForNextLevel) * 100 : 0;

  const menuItems = [
    { id: "scanner", icon: Home, label: t('nav.scanner') || "Scanner" },
    { id: "profile", icon: BarChart3, label: t('profile.title') },
    { id: "achievements", icon: Medal, label: t('gamification.achievements') },
    { id: "leaderboard", icon: Trophy, label: t('gamification.leaderboard') },
  ];

  return (
    <Sidebar className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center animate-pulse-glow">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-gradient">SOL Reclaim</h1>
              <p className="text-xs text-muted-foreground">Recover your SOL</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* User Profile Card */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>{t('profile.title')}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <div className={`p-3 rounded-xl bg-muted/30 border border-border/50 ${isCollapsed ? 'flex justify-center' : ''}`}>
              {isCollapsed ? (
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
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
                    <div 
                      className="flex items-center gap-2 p-2 rounded-lg border"
                      style={{ 
                        backgroundColor: `${vipTier.color}15`,
                        borderColor: `${vipTier.color}40`
                      }}
                    >
                      <Crown className="w-4 h-4" style={{ color: vipTier.color }} />
                      <span className="text-sm font-medium" style={{ color: vipTier.color }}>
                        {vipTier.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {vipTier.fee}% {t('fees.title') || "Fee"}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Stats */}
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
                    <p className="text-xs text-muted-foreground">{t('stats.accountsClosed')}</p>
                  </div>
                </div>
                
                <div className="mt-2 px-1">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30">
                    <Users className="w-4 h-4 text-accent" />
                    <span className="text-sm text-muted-foreground">{t('gamification.referrals')}</span>
                    <span className="text-sm font-bold text-foreground ml-auto">{userStats.referral_count}</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />
          </>
        )}

        {/* Navigation */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>{t('nav.navigation') || "Navigation"}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.id)}
                    tooltip={isCollapsed ? item.label : undefined}
                    className="hover:bg-primary/10"
                  >
                    <item.icon className="w-4 h-4" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDisconnect}
          className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>{t('wallet.disconnect')}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ProfileSidebar;
