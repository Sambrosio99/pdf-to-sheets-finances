import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Transaction } from "@/types/finance";
import { getValidTransactions } from "@/utils/transactionFilters";

interface MonthlyEvolutionChartProps {
  transactions: Transaction[];
}

export const MonthlyEvolutionChart = ({ transactions }: MonthlyEvolutionChartProps) => {
  // Filtrar apenas transações válidas do último ano
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const recentTransactions = getValidTransactions(transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= oneYearAgo;
  }));

  // Se não há transações, mostrar mensagem
  if (recentTransactions.length === 0) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-700">📈 Evolução do Saldo</CardTitle>
          <CardDescription>
            Acompanhe a evolução do seu saldo ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Nenhuma transação encontrada</p>
            <p className="text-sm">Faça upload dos seus extratos para ver a evolução</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar por mês e calcular saldo acumulado
  const monthlyData = recentTransactions.reduce((acc, transaction) => {
    const month = transaction.date.slice(0, 7);
    if (!acc[month]) {
      acc[month] = { month, income: 0, expenses: 0, balance: 0 };
    }
    
    if (transaction.type === 'income') {
      acc[month].income += Number(transaction.amount);
    } else {
      acc[month].expenses += Number(transaction.amount);
    }
    
    return acc;
  }, {} as Record<string, { month: string; income: number; expenses: number; balance: number; }>);

  // Calcular saldo de cada mês e acumulado
  const sortedData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((data, index, array) => {
      const monthlyBalance = data.income - data.expenses;
      const accumulatedBalance = array
        .slice(0, index + 1)
        .reduce((sum, item) => sum + (item.income - item.expenses), 0);
      
      return {
        ...data,
        balance: monthlyBalance,
        accumulated: accumulatedBalance
      };
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatMonth = (month: string) => {
    // Garantir que a data seja interpretada corretamente 
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-700">📈 Evolução do Saldo</CardTitle>
        <CardDescription>
          Acompanhe a evolução do seu saldo ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={sortedData}>
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
              formatter={(value: number, name: string) => [
                formatCurrency(value), 
                name === 'balance' ? 'Saldo Mensal' : 'Saldo Acumulado'
              ]}
              labelFormatter={(month) => `Mês: ${formatMonth(month as string)}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="accumulated" 
              stroke="#10b981" 
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};