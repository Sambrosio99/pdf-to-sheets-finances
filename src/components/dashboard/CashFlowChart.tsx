import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/types/finance";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CashFlowChartProps {
  transactions: Transaction[];
}

export const CashFlowChart = ({ transactions }: CashFlowChartProps) => {
  // Agrupar transações por mês
  const monthlyData = transactions.reduce((acc, transaction) => {
    const month = transaction.date.slice(0, 7);
    
    if (!acc[month]) {
      acc[month] = {
        month,
        income: 0,
        expenses: 0,
        net: 0
      };
    }
    
    if (transaction.type === 'income') {
      acc[month].income += Number(transaction.amount);
    } else {
      acc[month].expenses += Number(transaction.amount);
    }
    
    acc[month].net = acc[month].income - acc[month].expenses;
    
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .map((data: any) => ({
      ...data,
      monthName: new Date(data.month + '-01').toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: '2-digit' 
      })
    }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const latestMonth = chartData[chartData.length - 1];
  const previousMonth = chartData[chartData.length - 2];
  const netTrend = previousMonth ? 
    ((latestMonth?.net - previousMonth.net) / Math.abs(previousMonth.net)) * 100 : 0;

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              📈 Fluxo de Caixa
            </CardTitle>
            <CardDescription>
              Entradas vs Saídas ao longo do tempo
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              {netTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${netTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netTrend >= 0 ? '+' : ''}{netTrend.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-500">vs mês anterior</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis 
              dataKey="monthName" 
              className="text-gray-600"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value).replace('R$', 'R$')}
              className="text-gray-600"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value), 
                name === 'income' ? 'Receitas' : 
                name === 'expenses' ? 'Despesas' : 'Resultado'
              ]}
              labelFormatter={(label) => `Mês: ${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="income"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Receitas"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stackId="2"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
              name="Despesas"
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="#6366f1"
              fill="transparent"
              strokeWidth={3}
              name="Resultado Líquido"
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {latestMonth && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700">Receitas</p>
              <p className="text-lg font-bold text-green-800">{formatCurrency(latestMonth.income)}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-700">Despesas</p>
              <p className="text-lg font-bold text-red-800">{formatCurrency(latestMonth.expenses)}</p>
            </div>
            <div className={`p-3 rounded-lg ${latestMonth.net >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <p className={`text-sm ${latestMonth.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Resultado</p>
              <p className={`text-lg font-bold ${latestMonth.net >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                {formatCurrency(latestMonth.net)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};