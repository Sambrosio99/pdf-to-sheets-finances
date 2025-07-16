
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types/finance";
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SmartInsightsProps {
  transactions: Transaction[];
}

export const SmartInsights = ({ transactions }: SmartInsightsProps) => {
  const monthlyIncome = 1682;
  const fixedExpenses = { faculdade: 509, celular: 40, academia: 89 };
  const totalFixedExpenses = Object.values(fixedExpenses).reduce((sum, val) => sum + val, 0);
  
  // Análise dos últimos 3 meses
  const last3Months = Array.from({length: 3}, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  const monthlyData = last3Months.map(month => {
    const monthTransactions = transactions.filter(t => t.date.startsWith(month));
    const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    
    return { month, expenses, income, balance: income - expenses };
  });

  // Análise por categoria (últimos 3 meses)
  const categoryData = transactions
    .filter(t => t.type === 'expense' && last3Months.some(month => t.date.startsWith(month)))
    .reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Insights inteligentes
  const averageMonthlyExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length;
  const lastMonthExpenses = monthlyData[0]?.expenses || 0;
  const expensesTrend = ((lastMonthExpenses - averageMonthlyExpenses) / averageMonthlyExpenses) * 100;
  
  const availableAfterFixed = monthlyIncome - totalFixedExpenses;
  const spendingRate = (lastMonthExpenses - totalFixedExpenses) / availableAfterFixed * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      <div className="space-y-4">
        {spendingRate > 80 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Atenção!</strong> Você gastou {spendingRate.toFixed(1)}% da sua renda livre este mês. 
              Considere revisar seus gastos para manter o equilíbrio financeiro.
            </AlertDescription>
          </Alert>
        )}
        
        {expensesTrend > 15 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Gastos em alta!</strong> Suas despesas aumentaram {expensesTrend.toFixed(1)}% 
              comparado à média dos últimos meses.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Insights Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Lightbulb className="h-5 w-5" />
              Análise de Gastos
            </CardTitle>
            <CardDescription>Insights baseados nos últimos 3 meses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-800">Média mensal de gastos</p>
                  <p className="text-sm text-blue-600">{formatCurrency(averageMonthlyExpenses)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Renda livre após gastos fixos</p>
                  <p className="text-sm text-green-600">{formatCurrency(availableAfterFixed)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-purple-800">Taxa de utilização da renda livre</p>
                  <p className="text-sm text-purple-600">{spendingRate.toFixed(1)}%</p>
                </div>
                {spendingRate > 80 ? 
                  <TrendingDown className="h-8 w-8 text-red-500" /> : 
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <TrendingUp className="h-5 w-5" />
              Top Categorias de Gastos
            </CardTitle>
            <CardDescription>Onde você mais gasta (últimos 3 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.map(([category, amount], index) => {
                const percentage = (amount / Object.values(categoryData).reduce((sum, val) => sum + val, 0)) * 100;
                return (
                  <div key={category} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-red-500' : 
                        index === 1 ? 'bg-orange-500' : 
                        index === 2 ? 'bg-yellow-500' : 
                        index === 3 ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <span className="font-medium text-sm">{category}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(amount)}</p>
                      <p className="text-xs text-gray-600">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Mensal */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-indigo-700">📈 Evolução dos Últimos 3 Meses</CardTitle>
          <CardDescription>Acompanhe a tendência dos seus gastos e saldo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {monthlyData.map((data, index) => (
              <div key={data.month} className={`p-4 rounded-lg ${
                index === 0 ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-100'
              }`}>
                <h4 className="font-medium text-gray-800 mb-2">
                  {formatMonth(data.month)} {index === 0 && '(Atual)'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Receitas:</span>
                    <span className="text-green-600 font-medium">{formatCurrency(data.income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Despesas:</span>
                    <span className="text-red-600 font-medium">{formatCurrency(data.expenses)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Saldo:</span>
                    <span className={`font-medium ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.balance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
