import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/types/finance";
import { Lock, Zap } from "lucide-react";

interface FixedVsVariableChartProps {
  transactions: Transaction[];
}

export const FixedVsVariableChart = ({ transactions }: FixedVsVariableChartProps) => {
  // Mapear transações para categorias inteligentes
  const mapTransactionToCategory = (description: string, originalCategory: string): string => {
    const desc = description.toLowerCase();
    
    if (desc.includes('puc') || desc.includes('faculdade') || desc.includes('universidade')) {
      return 'Faculdade';
    }
    if (desc.includes('wellhub') || desc.includes('academia') || desc.includes('gym')) {
      return 'Academia';
    }
    if (desc.includes('vivo') || desc.includes('telefone') || desc.includes('celular')) {
      return 'Celular';
    }
    
    return originalCategory;
  };

  // Categorias consideradas fixas
  const fixedCategories = ['Faculdade', 'Celular', 'Academia'];

  // Agrupar gastos por mês
  const monthlyData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const month = transaction.date.slice(0, 7);
      const category = mapTransactionToCategory(transaction.description, transaction.category);
      const amount = Number(transaction.amount);
      
      if (!acc[month]) {
        acc[month] = {
          month,
          fixed: 0,
          variable: 0,
          total: 0
        };
      }
      
      if (fixedCategories.includes(category)) {
        acc[month].fixed += amount;
      } else {
        acc[month].variable += amount;
      }
      
      acc[month].total += amount;
      
      return acc;
    }, {} as Record<string, any>);

  const chartData = Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .map((data: any) => ({
      ...data,
      monthName: new Date(data.month + '-01').toLocaleDateString('pt-BR', { 
        month: 'short',
        year: '2-digit'
      }),
      fixedPercentage: data.total > 0 ? (data.fixed / data.total) * 100 : 0,
      variablePercentage: data.total > 0 ? (data.variable / data.total) * 100 : 0
    }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const latestMonth = chartData[chartData.length - 1];
  const averageFixed = chartData.reduce((sum: number, month: any) => sum + month.fixed, 0) / chartData.length;
  const averageVariable = chartData.reduce((sum: number, month: any) => sum + month.variable, 0) / chartData.length;

  if (chartData.length === 0) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-orange-700 flex items-center gap-2">
            ⚖️ Gastos Fixos vs Variáveis
          </CardTitle>
          <CardDescription>
            Controle da estrutura dos seus gastos
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Dados insuficientes</p>
            <p className="text-sm">Adicione transações para ver a análise</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-orange-700 flex items-center gap-2">
          ⚖️ Gastos Fixos vs Variáveis
        </CardTitle>
        <CardDescription>
          Evolução da estrutura dos seus gastos ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis 
              dataKey="monthName"
              className="text-gray-600"
              fontSize={12}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={(value) => formatCurrency(value).replace('R$', 'R$')}
              className="text-gray-600"
              fontSize={12}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `${value}%`}
              className="text-gray-600"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name.includes('%')) {
                  return [`${value.toFixed(1)}%`, name];
                }
                return [formatCurrency(value), name];
              }}
              labelFormatter={(label) => `Mês: ${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="fixed"
              fill="#8b5cf6"
              name="Gastos Fixos"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="variable"
              fill="#06b6d4"
              name="Gastos Variáveis"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="fixedPercentage"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
              name="% Gastos Fixos"
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Gastos Fixos</span>
            </div>
            <p className="text-lg font-bold text-purple-800">
              {latestMonth ? formatCurrency(latestMonth.fixed) : formatCurrency(0)}
            </p>
            <p className="text-xs text-purple-600">
              Média: {formatCurrency(averageFixed)}
            </p>
            <p className="text-xs text-purple-500 mt-1">
              {latestMonth ? `${latestMonth.fixedPercentage.toFixed(1)}% do total` : '0%'}
            </p>
          </div>
          
          <div className="bg-cyan-50 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-medium text-cyan-700">Gastos Variáveis</span>
            </div>
            <p className="text-lg font-bold text-cyan-800">
              {latestMonth ? formatCurrency(latestMonth.variable) : formatCurrency(0)}
            </p>
            <p className="text-xs text-cyan-600">
              Média: {formatCurrency(averageVariable)}
            </p>
            <p className="text-xs text-cyan-500 mt-1">
              {latestMonth ? `${latestMonth.variablePercentage.toFixed(1)}% do total` : '0%'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">💡 Insight</span>
            </div>
            <p className="text-sm text-gray-600">
              {latestMonth && latestMonth.fixedPercentage > 60 
                ? "Gastos fixos altos. Considere revisar contratos."
                : latestMonth && latestMonth.fixedPercentage < 30
                ? "Boa flexibilidade financeira! Gastos fixos controlados."
                : "Estrutura equilibrada entre fixos e variáveis."
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};