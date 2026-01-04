import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Settings, ArrowLeft, Loader2, Save, Percent } from "lucide-react";

interface Profile {
  id: string;
  email: string | null;
  wallet_address: string | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [platformFee, setPlatformFee] = useState("5");
  const [profiles, setProfiles] = useState<Profile[]>([]);

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
        .single();

      if (!settingsError && settings) {
        setPlatformFee(settings.value);
      }

      // Load all profiles - this works because platform_settings has public read access
      // For profiles, we need an edge function to bypass RLS
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!profilesError && profilesData) {
        setProfiles(profilesData);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatAddress = (address: string | null) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Estatísticas
              </CardTitle>
              <CardDescription>
                Resumo da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total de Usuários:</span>
                  <span className="font-bold text-lg">{profiles.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Taxa Atual:</span>
                  <span className="font-bold text-lg text-primary">{platformFee}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                          {formatAddress(profile.wallet_address)}
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
