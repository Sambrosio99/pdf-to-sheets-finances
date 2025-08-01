
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Transaction } from "@/types/finance";

interface CategoryChartProps {
  transactions: Transaction[];
}

export const CategoryChart = ({ transactions }: CategoryChartProps) => {
  // Função para mapear descrições para categorias (mesma lógica dos outros componentes)
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

  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  // Se não há despesas, mostrar mensagem
  if (expenseTransactions.length === 0) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-purple-700">🥧 Gastos por Categoria</CardTitle>
          <CardDescription>
            Distribuição das suas despesas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Nenhuma despesa encontrada</p>
            <p className="text-sm">Faça upload dos seus extratos para ver a distribuição</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const categoryData = expenseTransactions.reduce((acc, transaction) => {
    const mappedCategory = mapTransactionToCategory(transaction.description, transaction.category);
    
    if (!acc[mappedCategory]) {
      acc[mappedCategory] = 0;
    }
    acc[mappedCategory] += Number(transaction.amount);
    return acc;
  }, {} as Record<string, number>);

  const colors = [
    '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', 
    '#ef4444', '#ec4899', '#84cc16', '#6366f1'
  ];

  const chartData = Object.entries(categoryData).map(([category, amount], index) => ({
    name: category,
    value: amount,
    color: colors[index % colors.length]
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-purple-700">🥧 Gastos por Categoria</CardTitle>
        <CardDescription>
          Distribuição das suas despesas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), '']}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
