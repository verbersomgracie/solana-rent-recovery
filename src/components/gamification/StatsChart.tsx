import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, PieChartIcon, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsChartProps {
  totalSolRecovered: number;
  totalAccountsClosed: number;
  totalTransactions: number;
  level: number;
  className?: string;
}

const StatsChart = ({
  totalSolRecovered,
  totalAccountsClosed,
  totalTransactions,
  level,
  className
}: StatsChartProps) => {
  // Mock historical data based on current stats
  const chartData = useMemo(() => {
    const points = 7;
    const data = [];
    
    for (let i = 0; i < points; i++) {
      const factor = (i + 1) / points;
      data.push({
        name: `D${i + 1}`,
        sol: +(totalSolRecovered * factor * (0.8 + Math.random() * 0.4)).toFixed(3),
        accounts: Math.floor(totalAccountsClosed * factor * (0.8 + Math.random() * 0.4))
      });
    }
    
    // Ensure last point matches current stats
    data[points - 1] = {
      name: "Hoje",
      sol: totalSolRecovered,
      accounts: totalAccountsClosed
    };
    
    return data;
  }, [totalSolRecovered, totalAccountsClosed]);

  const pieData = useMemo(() => [
    { name: "SOL Recuperado", value: totalSolRecovered, color: "hsl(174, 100%, 50%)" },
    { name: "Taxa Coletada", value: totalSolRecovered * 0.05, color: "hsl(280, 100%, 60%)" }
  ], [totalSolRecovered]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-border/50 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-muted-foreground">
              {entry.name}: <span className="font-medium text-foreground">
                {entry.name === "sol" ? `${entry.value.toFixed(3)} SOL` : `${entry.value} contas`}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 border border-border/50">
          <div className="text-2xl font-bold text-gradient">
            {totalSolRecovered.toFixed(3)}
          </div>
          <div className="text-xs text-muted-foreground">SOL Recuperado</div>
        </div>
        <div className="glass rounded-xl p-4 border border-border/50">
          <div className="text-2xl font-bold text-foreground">
            {totalAccountsClosed}
          </div>
          <div className="text-xs text-muted-foreground">Contas Fechadas</div>
        </div>
        <div className="glass rounded-xl p-4 border border-border/50">
          <div className="text-2xl font-bold text-foreground">
            {totalTransactions}
          </div>
          <div className="text-xs text-muted-foreground">Transações</div>
        </div>
        <div className="glass rounded-xl p-4 border border-border/50">
          <div className="text-2xl font-bold text-secondary">
            Lvl {level}
          </div>
          <div className="text-xs text-muted-foreground">Nível Atual</div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="glass rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Progresso de Recuperação</h3>
        </div>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="solGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="sol"
                stroke="hsl(174, 100%, 50%)"
                strokeWidth={2}
                fill="url(#solGradient)"
                name="SOL"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Pie */}
      <div className="glass rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-bold text-foreground">Distribuição</h3>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="h-32 w-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-2">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">{entry.name}</span>
                <span className="text-sm font-medium text-foreground">
                  {entry.value.toFixed(3)} SOL
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsChart;
