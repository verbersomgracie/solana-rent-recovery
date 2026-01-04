import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, Users, Settings, ArrowLeft, Loader2, Save, Percent, 
  TrendingUp, Wallet, Receipt, Coins, Search, RefreshCw, 
  ExternalLink, Clock, Activity, Calendar, Hash, FlaskConical, Trash2, ToggleLeft, ToggleRight
} from "lucide-react";

interface Profile {
  id: string;
  email: string | null;
  wallet_address: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  wallet_address: string;
  accounts_closed: number;
  sol_recovered: number;
  fee_collected: number;
  fee_percent: number;
  transaction_signature: string | null;
  created_at: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalSolRecovered: number;
  totalFeesCollected: number;
  totalAccountsClosed: number;
}

interface WalletStats {
  wallet_address: string;
  total_transactions: number;
  total_sol_recovered: number;
  total_fees: number;
  total_accounts: number;
  last_transaction: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingTransaction, setIsTestingTransaction] = useState(false);
  const [isDeletingTestTransactions, setIsDeletingTestTransactions] = useState(false);
  const [isTogglingSimulation, setIsTogglingSimulation] = useState(false);
  const [simulationModeEnabled, setSimulationModeEnabled] = useState(false);
  const [platformFee, setPlatformFee] = useState("5");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletStats, setWalletStats] = useState<WalletStats[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalSolRecovered: 0,
    totalFeesCollected: 0,
    totalAccountsClosed: 0
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Load platform settings
      const { data: settings, error: settingsError } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("key", "platform_fee_percent")
        .maybeSingle();

      if (!settingsError && settings) {
        setPlatformFee(settings.value);
      }

      // Load simulation mode setting
      const { data: simSettings, error: simError } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("key", "simulation_mode_enabled")
        .maybeSingle();

      if (!simError && simSettings) {
        setSimulationModeEnabled(simSettings.value === 'true');
      }

      // Load all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!profilesError && profilesData) {
        setProfiles(profilesData);
      }

      // Load all transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!transactionsError && transactionsData) {
        setTransactions(transactionsData);
        
        // Calculate stats
        const totalStats = transactionsData.reduce((acc, tx) => ({
          totalTransactions: acc.totalTransactions + 1,
          totalSolRecovered: acc.totalSolRecovered + Number(tx.sol_recovered),
          totalFeesCollected: acc.totalFeesCollected + Number(tx.fee_collected),
          totalAccountsClosed: acc.totalAccountsClosed + tx.accounts_closed
        }), {
          totalTransactions: 0,
          totalSolRecovered: 0,
          totalFeesCollected: 0,
          totalAccountsClosed: 0
        });
        
        setStats(totalStats);

        // Calculate per-wallet stats
        const walletMap = new Map<string, WalletStats>();
        transactionsData.forEach(tx => {
          const existing = walletMap.get(tx.wallet_address);
          if (existing) {
            existing.total_transactions += 1;
            existing.total_sol_recovered += Number(tx.sol_recovered);
            existing.total_fees += Number(tx.fee_collected);
            existing.total_accounts += tx.accounts_closed;
            if (new Date(tx.created_at) > new Date(existing.last_transaction)) {
              existing.last_transaction = tx.created_at;
            }
          } else {
            walletMap.set(tx.wallet_address, {
              wallet_address: tx.wallet_address,
              total_transactions: 1,
              total_sol_recovered: Number(tx.sol_recovered),
              total_fees: Number(tx.fee_collected),
              total_accounts: tx.accounts_closed,
              last_transaction: tx.created_at
            });
          }
        });
        
        const sortedWalletStats = Array.from(walletMap.values())
          .sort((a, b) => b.total_sol_recovered - a.total_sol_recovered);
        setWalletStats(sortedWalletStats);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAdminData();
    setIsRefreshing(false);
    toast({
      title: "Atualizado",
      description: "Dados atualizados com sucesso.",
    });
  };

  const handleSaveFee = async () => {
    setIsSaving(true);
    try {
      const feeValue = parseFloat(platformFee);
      
      if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
        toast({
          title: "Erro",
          description: "A taxa deve ser um número entre 0 e 100.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from("platform_settings")
        .update({ 
          value: platformFee
        })
        .eq("key", "platform_fee_percent");

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: `Taxa atualizada para ${platformFee}%`,
      });
    } catch (error) {
      console.error("Error saving fee:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a taxa.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestTransaction = async () => {
    setIsTestingTransaction(true);
    try {
      // Generate random test data
      const testWallet = `Test${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`;
      const accountsClosed = Math.floor(Math.random() * 10) + 1;
      const solRecovered = Math.random() * 0.5 + 0.01;
      const feePercent = parseFloat(platformFee) || 5;
      const feeCollected = solRecovered * (feePercent / 100);
      const testSignature = `test_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      const { error } = await supabase
        .from("transactions")
        .insert({
          wallet_address: testWallet,
          accounts_closed: accountsClosed,
          sol_recovered: solRecovered,
          fee_collected: feeCollected,
          fee_percent: feePercent,
          transaction_signature: testSignature
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Transação de Teste Criada",
        description: `${accountsClosed} contas, ${solRecovered.toFixed(4)} SOL recuperado`,
      });

      // Refresh data to show the new transaction
      await loadAdminData();
    } catch (error) {
      console.error("Error creating test transaction:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a transação de teste.",
        variant: "destructive"
      });
    } finally {
      setIsTestingTransaction(false);
    }
  };

  const handleDeleteTestTransactions = async () => {
    setIsDeletingTestTransactions(true);
    try {
      // Delete transactions that have "test" in signature or wallet starts with "Test"
      const { error } = await supabase
        .from("transactions")
        .delete()
        .or('transaction_signature.ilike.%test%,wallet_address.ilike.Test%');

      if (error) {
        throw error;
      }

      toast({
        title: "Transações de Teste Deletadas",
        description: "Todas as transações de teste foram removidas.",
      });

      // Refresh data
      await loadAdminData();
    } catch (error) {
      console.error("Error deleting test transactions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar as transações de teste.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingTestTransactions(false);
    }
  };

  const handleToggleSimulation = async () => {
    setIsTogglingSimulation(true);
    try {
      const newValue = !simulationModeEnabled;
      
      const { error } = await supabase
        .from("platform_settings")
        .update({ value: newValue.toString() })
        .eq("key", "simulation_mode_enabled");

      if (error) {
        throw error;
      }

      setSimulationModeEnabled(newValue);
      toast({
        title: newValue ? "Modo Simulação Ativado" : "Modo Simulação Desativado",
        description: newValue 
          ? "Usuários agora podem testar o sistema sem wallet." 
          : "Modo de simulação foi desativado.",
      });
    } catch (error) {
      console.error("Error toggling simulation mode:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o modo de simulação.",
        variant: "destructive"
      });
    } finally {
      setIsTogglingSimulation(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return formatDate(dateString);
  };

  const formatAddress = (address: string | null, short = true) => {
    if (!address) return "N/A";
    if (short) return `${address.slice(0, 6)}...${address.slice(-4)}`;
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  };

  const formatSol = (value: number) => {
    return value.toFixed(4);
  };

  const openSolscan = (signature: string | null) => {
    if (signature) {
      window.open(`https://solscan.io/tx/${signature}`, '_blank');
    }
  };

  const openWalletSolscan = (address: string) => {
    window.open(`https://solscan.io/account/${address}`, '_blank');
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.transaction_signature?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWalletStats = walletStats.filter(ws =>
    ws.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
            <Badge variant="outline" className="ml-2">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Transaction Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Transações</p>
                  <p className="text-3xl font-bold">{stats.totalTransactions}</p>
                </div>
                <Receipt className="w-10 h-10 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">SOL Recuperado</p>
                  <p className="text-3xl font-bold">{formatSol(stats.totalSolRecovered)}</p>
                </div>
                <Coins className="w-10 h-10 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxas Coletadas</p>
                  <p className="text-3xl font-bold">{formatSol(stats.totalFeesCollected)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-amber-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contas Fechadas</p>
                  <p className="text-3xl font-bold">{stats.totalAccountsClosed}</p>
                </div>
                <Wallet className="w-10 h-10 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Platform Fee Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações da Plataforma
              </CardTitle>
              <CardDescription>
                Configure a taxa cobrada sobre cada SOL recuperado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platformFee">Taxa da Plataforma (%)</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="platformFee"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={platformFee}
                        onChange={(e) => setPlatformFee(e.target.value)}
                        className="pr-10"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                    <Button onClick={handleSaveFee} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span className="ml-2">Salvar</span>
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Esta taxa será cobrada sobre o total de SOL recuperado pelo usuário.
                </p>

                <div className="pt-4 border-t border-border">
                  <Label className="text-sm text-muted-foreground mb-2 block">Testar Registro de Transações</Label>
                  <Button 
                    variant="outline" 
                    onClick={handleTestTransaction} 
                    disabled={isTestingTransaction}
                    className="w-full"
                  >
                    {isTestingTransaction ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <FlaskConical className="w-4 h-4 mr-2" />
                    )}
                    Simular Transação de Teste
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cria uma transação fictícia para verificar o registro no banco.
                  </p>
                  
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteTestTransactions} 
                    disabled={isDeletingTestTransactions}
                    className="w-full mt-3"
                  >
                    {isDeletingTestTransactions ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Deletar Transações de Teste
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Remove todas as transações com "test" na assinatura ou wallet.
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <Label className="text-sm text-muted-foreground mb-2 block">Modo de Simulação</Label>
                  <Button 
                    variant={simulationModeEnabled ? "default" : "outline"} 
                    onClick={handleToggleSimulation} 
                    disabled={isTogglingSimulation}
                    className={`w-full ${simulationModeEnabled ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    {isTogglingSimulation ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : simulationModeEnabled ? (
                      <ToggleRight className="w-4 h-4 mr-2" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 mr-2" />
                    )}
                    {simulationModeEnabled ? 'Simulação Ativada' : 'Simulação Desativada'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Permite que usuários testem o fluxo de recuperação sem conectar uma wallet real.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Métricas
              </CardTitle>
              <CardDescription>
                Indicadores de performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Usuários Registrados:</span>
                  <span className="font-bold text-lg">{profiles.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Wallets Únicas:</span>
                  <span className="font-bold text-lg">{walletStats.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Média SOL/Transação:</span>
                  <span className="font-bold text-lg text-green-500">
                    {stats.totalTransactions > 0 
                      ? formatSol(stats.totalSolRecovered / stats.totalTransactions) 
                      : "0.0000"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Média Contas/Transação:</span>
                  <span className="font-bold text-lg text-blue-500">
                    {stats.totalTransactions > 0 
                      ? (stats.totalAccountsClosed / stats.totalTransactions).toFixed(1)
                      : "0"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mt-6 mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por wallet ou assinatura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Top Wallets */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Top Wallets ({filteredWalletStats.length})
            </CardTitle>
            <CardDescription>
              Ranking de wallets por SOL recuperado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredWalletStats.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma wallet encontrada.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Wallet</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Transações</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">SOL Recuperado</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Taxa Paga</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contas</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Última Atividade</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWalletStats.slice(0, 10).map((ws, index) => (
                      <tr key={ws.wallet_address} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <Badge variant={index < 3 ? "default" : "outline"}>
                            {index + 1}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">
                          {formatAddress(ws.wallet_address, false)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{ws.total_transactions}</Badge>
                        </td>
                        <td className="py-3 px-4 text-green-500 font-bold">
                          {formatSol(ws.total_sol_recovered)} SOL
                        </td>
                        <td className="py-3 px-4 text-amber-500">
                          {formatSol(ws.total_fees)} SOL
                        </td>
                        <td className="py-3 px-4">{ws.total_accounts}</td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(ws.last_transaction)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openWalletSolscan(ws.wallet_address)}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Logs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Logs de Transações ({filteredTransactions.length})
            </CardTitle>
            <CardDescription>
              Histórico completo de todas as transações realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchTerm ? "Nenhuma transação encontrada para esta busca." : "Nenhuma transação realizada ainda."}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.slice(0, 50).map((tx) => (
                  <div 
                    key={tx.id} 
                    className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Left side - Wallet and Signature */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{formatAddress(tx.wallet_address, false)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => openWalletSolscan(tx.wallet_address)}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                        {tx.transaction_signature && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Hash className="w-3 h-3" />
                            <span className="font-mono text-xs">{formatAddress(tx.transaction_signature, false)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => openSolscan(tx.transaction_signature)}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Center - Stats */}
                      <div className="flex flex-wrap gap-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Contas</p>
                          <p className="font-bold text-blue-500">{tx.accounts_closed}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Recuperado</p>
                          <p className="font-bold text-green-500">{formatSol(Number(tx.sol_recovered))} SOL</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Taxa ({tx.fee_percent}%)</p>
                          <p className="font-bold text-amber-500">{formatSol(Number(tx.fee_collected))} SOL</p>
                        </div>
                      </div>

                      {/* Right side - Date */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Calendar className="w-3 h-3" />
                          {formatDate(tx.created_at)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(tx.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTransactions.length > 50 && (
                  <p className="text-center text-muted-foreground text-sm py-2">
                    Mostrando 50 de {filteredTransactions.length} transações
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuários Registrados ({profiles.length})
            </CardTitle>
            <CardDescription>
              Lista de todos os usuários cadastrados na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum usuário registrado ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Wallet</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cadastrado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-4">{profile.email || "N/A"}</td>
                        <td className="py-3 px-4 font-mono text-sm">
                          {profile.wallet_address ? (
                            <div className="flex items-center gap-2">
                              {formatAddress(profile.wallet_address)}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => openWalletSolscan(profile.wallet_address!)}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(profile.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
