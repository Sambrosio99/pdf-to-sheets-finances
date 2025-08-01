import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Transaction } from "@/types/finance";
import { CreditCard, Smartphone, Banknote, Landmark } from "lucide-react";

interface PaymentMethodChartProps {
  transactions: Transaction[];
}

export const PaymentMethodChart = ({ transactions }: PaymentMethodChartProps) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = transactions.filter(t => 
    t.type === 'expense' && t.date.startsWith(currentMonth)
  );

  // Mapear métodos de pagamento para categorias mais claras
  const mapPaymentMethod = (method: string): string => {
    const methodLower = method.toLowerCase();
    
    if (methodLower.includes('pix') || methodLower.includes('transferencia')) {
      return 'PIX/Transferência';
    }
    if (methodLower.includes('cartao') || methodLower.includes('credito') || methodLower.includes('débito')) {
      return 'Cartão';
    }
    if (methodLower.includes('dinheiro') || methodLower.includes('espécie')) {
      return 'Dinheiro';
    }
    if (methodLower.includes('boleto') || methodLower.includes('debito automatico')) {
      return 'Débito Automático';
    }
    
    return method || 'Outros';
  };

  const paymentData = currentMonthTransactions.reduce((acc, transaction) => {
    const method = mapPaymentMethod(transaction.paymentMethod);
    
    if (!acc[method]) {
      acc[method] = {
        method,
        amount: 0,
        count: 0
      };
    }
    
    acc[method].amount += Number(transaction.amount);
    acc[method].count += 1;
    
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(paymentData)
    .sort((a: any, b: any) => b.amount - a.amount)
    .map((data: any) => ({
      ...data,
      percentage: (data.amount / Object.values(paymentData).reduce((sum: number, item: any) => sum + item.amount, 0)) * 100
    }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'PIX/Transferência':
        return <Smartphone className="h-4 w-4" />;
      case 'Cartão':
        return <CreditCard className="h-4 w-4" />;
      case 'Dinheiro':
        return <Banknote className="h-4 w-4" />;
      case 'Débito Automático':
        return <Landmark className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'PIX/Transferência':
        return '#10b981';
      case 'Cartão':
        return '#6366f1';
      case 'Dinheiro':
        return '#f59e0b';
      case 'Débito Automático':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  };

  if (chartData.length === 0) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-purple-700 flex items-center gap-2">
            💳 Gastos por Método de Pagamento
          </CardTitle>
          <CardDescription>
            Distribuição dos seus gastos por forma de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Nenhuma despesa encontrada</p>
            <p className="text-sm">Adicione transações para ver a distribuição</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-purple-700 flex items-center gap-2">
          💳 Gastos por Método de Pagamento
        </CardTitle>
        <CardDescription>
          Como você está gastando seu dinheiro este mês
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis 
              type="number"
              tickFormatter={(value) => formatCurrency(value).replace('R$', 'R$')}
              className="text-gray-600"
              fontSize={12}
            />
            <YAxis 
              type="category"
              dataKey="method"
              className="text-gray-600"
              fontSize={12}
              width={120}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Valor']}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="amount" 
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getMethodColor(entry.method)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 space-y-2">
          {chartData.map((item: any) => (
            <div key={item.method} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div style={{ color: getMethodColor(item.method) }}>
                  {getMethodIcon(item.method)}
                </div>
                <span className="font-medium">{item.method}</span>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatCurrency(item.amount)}</p>
                <p className="text-xs text-gray-500">
                  {item.percentage.toFixed(1)}% • {item.count} transações
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};