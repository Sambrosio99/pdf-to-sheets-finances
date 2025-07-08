
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Transaction } from "@/types/finance";

interface YearlyReportProps {
  transactions: Transaction[];
}

export const YearlyReport = ({ transactions }: YearlyReportProps) => {
  const currentYear = new Date().getFullYear();
  
  // Filtrar transações do ano atual
  const yearTransactions = transactions.filter(t => 
    t.date.startsWith(currentYear.toString())
  );

  // Dados mensais
  const monthlyData = Array.from({ length: 12 }, (_, index) => {
    const month = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
    const monthTransactions = yearTransactions.filter(t => t.date.startsWith(month));
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: new Date(currentYear, index).toLocaleDateString('pt-BR', { month: 'short' }),
      income,
      expenses,
      balance: income - expenses
    };
  });

  // Saldo acumulado
  let accumulatedBalance = 0;
  const accumulatedData = monthlyData.map(data => {
    accumulatedBalance += data.balance;
    return {
      ...data,
      accumulated: accumulatedBalance
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalIncome = yearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = yearTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const yearBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Resumo Anual */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">📊 Relatório Anual - {currentYear}</CardTitle>
          <CardDescription className="text-indigo-100">
            Visão completa das suas finanças no ano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm opacity-90">Total de Receitas</p>
              <p className="text-2xl font-bold text-green-200">{formatCurrency(totalIncome)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Total de Despesas</p>
              <p className="text-2xl font-bold text-red-200">{formatCurrency(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Saldo do Ano</p>
              <p className={`text-2xl font-bold ${yearBalance >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {formatCurrency(yearBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90">Total de Transações</p>
              <p className="text-2xl font-bold">{yearTransactions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Mensal */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-emerald-700">📈 Receitas vs Despesas por Mês</CardTitle>
          <CardDescription>
            Comparação mensal detalhada do ano {currentYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis 
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="income" fill="#10b981" name="Receitas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Despesas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Evolução do Saldo Acumulado */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-700">💰 Evolução do Saldo Acumulado</CardTitle>
          <CardDescription>
            Acompanhe como seu patrimônio evoluiu durante o ano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={accumulatedData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis 
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Saldo Acumulado']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="accumulated" 
                stroke="#3b82f6" 
                strokeWidth={4}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela de Resumo Mensal */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-purple-700">📋 Resumo Mensal Detalhado</CardTitle>
          <CardDescription>
            Tabela com todos os dados mês a mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Mês</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Receitas</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Despesas</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Saldo Mensal</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {accumulatedData.map((data, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{data.month}</td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">
                      {formatCurrency(data.income)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600 font-medium">
                      {formatCurrency(data.expenses)}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      data.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(data.balance)}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${
                      data.accumulated >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(data.accumulated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
