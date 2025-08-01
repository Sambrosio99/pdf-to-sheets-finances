
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Transaction } from "@/types/finance";

interface ExpenseChartProps {
  transactions: Transaction[];
}

export const ExpenseChart = ({ transactions }: ExpenseChartProps) => {
  // Se não há transações, mostrar mensagem
  if (transactions.length === 0) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-emerald-700">📊 Receitas vs Despesas</CardTitle>
          <CardDescription>
            Comparação mensal de entradas e saídas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Nenhuma transação encontrada</p>
            <p className="text-sm">Faça upload dos seus extratos para ver o comparativo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar por mês
  const monthlyData = transactions.reduce((acc, transaction) => {
    const month = transaction.date.slice(0, 7);
    if (!acc[month]) {
      acc[month] = { month, income: 0, expenses: 0 };
    }
    
    if (transaction.type === 'income') {
      acc[month].income += Number(transaction.amount);
    } else {
      acc[month].expenses += Number(transaction.amount);
    }
    
    return acc;
  }, {} as Record<string, { month: string; income: number; expenses: number; }>);

  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-emerald-700">📊 Receitas vs Despesas</CardTitle>
        <CardDescription>
          Comparação mensal de entradas e saídas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              tickFormatter={formatMonth}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), '']}
              labelFormatter={(month) => `Mês: ${formatMonth(month as string)}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="income" 
              fill="#10b981" 
              name="Receitas"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="expenses" 
              fill="#ef4444" 
              name="Despesas"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
