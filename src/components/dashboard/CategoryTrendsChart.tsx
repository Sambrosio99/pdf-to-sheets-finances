import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/types/finance";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CategoryTrendsChartProps {
  transactions: Transaction[];
}

export const CategoryTrendsChart = ({ transactions }: CategoryTrendsChartProps) => {
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
    if (desc.includes('uber') || desc.includes('transporte') || desc.includes('taxi') || desc.includes('passagem')) {
      return 'Transporte';
    }
    if (desc.includes('rdb') || desc.includes('investimento') || desc.includes('aplicação') || desc.includes('poupança')) {
      return 'Investimentos';
    }
    if (desc.includes('baixo') || desc.includes('instrumento') || desc.includes('música')) {
      return 'Baixo Musical';
    }
    
    return originalCategory;
  };

  // Agrupar gastos por mês e categoria
  const monthlyDataByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const month = transaction.date.slice(0, 7);
      const category = mapTransactionToCategory(transaction.description, transaction.category);
      
      if (!acc[month]) {
        acc[month] = {};
      }
      
      if (!acc[month][category]) {
        acc[month][category] = 0;
      }
      
      acc[month][category] += Number(transaction.amount);
      
      return acc;
    }, {} as Record<string, Record<string, number>>);

  // Pegar as top 5 categorias por volume
  const topCategories = Object.values(monthlyDataByCategory)
    .reduce((acc, month) => {
      Object.entries(month).forEach(([category, amount]) => {
        if (!acc[category]) acc[category] = 0;
        acc[category] += amount;
      });
      return acc;
    }, {} as Record<string, number>);

  const top5Categories = Object.entries(topCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category]) => category);

  const chartData = Object.entries(monthlyDataByCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, categories]) => ({
      month,
      monthName: new Date(month + '-01').toLocaleDateString('pt-BR', { 
        month: 'short',
        year: '2-digit'
      }),
      ...top5Categories.reduce((acc, category) => ({
        ...acc,
        [category]: categories[category] || 0
      }), {})
    }));

  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Calcular tendências para as categorias
  const calculateTrend = (category: string) => {
    const recentMonths = chartData.slice(-2);
    if (recentMonths.length < 2) return 0;
    
    const current = recentMonths[1][category] || 0;
    const previous = recentMonths[0][category] || 0;
    
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (chartData.length === 0) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-indigo-700 flex items-center gap-2">
            📈 Tendências por Categoria
          </CardTitle>
          <CardDescription>
            Evolução dos gastos por categoria ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Dados insuficientes</p>
            <p className="text-sm">Adicione mais transações para ver tendências</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-indigo-700 flex items-center gap-2">
          📈 Tendências por Categoria
        </CardTitle>
        <CardDescription>
          Como seus gastos estão evoluindo ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
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
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              labelFormatter={(label) => `Mês: ${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            {top5Categories.map((category, index) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={colors[index]}
                strokeWidth={2}
                dot={{ fill: colors[index], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[index], strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {top5Categories.map((category, index) => {
            const trend = calculateTrend(category);
            const latestValue = chartData[chartData.length - 1]?.[category] || 0;
            
            return (
              <div key={category} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{category}</span>
                  <div className="flex items-center gap-1">
                    {trend > 5 ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : trend < -5 ? (
                      <TrendingDown className="h-3 w-3 text-green-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={`text-xs font-medium ${
                      trend > 5 ? 'text-red-500' : 
                      trend < -5 ? 'text-green-500' : 'text-gray-500'
                    }`}>
                      {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm font-bold" style={{ color: colors[index] }}>
                  {formatCurrency(latestValue)}
                </p>
                <p className="text-xs text-gray-500">último mês</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};