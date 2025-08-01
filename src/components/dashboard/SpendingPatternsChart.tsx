import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Transaction } from "@/types/finance";
import { Calendar, Clock, MapPin } from "lucide-react";

interface SpendingPatternsChartProps {
  transactions: Transaction[];
}

export const SpendingPatternsChart = ({ transactions }: SpendingPatternsChartProps) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = transactions.filter(t => 
    t.type === 'expense' && t.date.startsWith(currentMonth)
  );

  // Análise por dia da semana
  const weekdayData = currentMonthTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const weekday = date.getDay(); // 0 = domingo, 1 = segunda, etc.
    const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekdayName = weekdayNames[weekday];
    
    if (!acc[weekdayName]) {
      acc[weekdayName] = {
        weekday: weekdayName,
        amount: 0,
        count: 0,
        averageAmount: 0
      };
    }
    
    acc[weekdayName].amount += Number(transaction.amount);
    acc[weekdayName].count += 1;
    acc[weekdayName].averageAmount = acc[weekdayName].amount / acc[weekdayName].count;
    
    return acc;
  }, {} as Record<string, any>);

  const weekdayChart = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => 
    weekdayData[day] || { weekday: day, amount: 0, count: 0, averageAmount: 0 }
  );

  // Análise por período do mês
  const monthPeriods = currentMonthTransactions.reduce((acc, transaction) => {
    const day = parseInt(transaction.date.split('-')[2]);
    let period;
    
    if (day <= 10) period = 'Início (1-10)';
    else if (day <= 20) period = 'Meio (11-20)';
    else period = 'Final (21-31)';
    
    if (!acc[period]) {
      acc[period] = {
        period,
        amount: 0,
        count: 0,
        averageAmount: 0
      };
    }
    
    acc[period].amount += Number(transaction.amount);
    acc[period].count += 1;
    acc[period].averageAmount = acc[period].amount / acc[period].count;
    
    return acc;
  }, {} as Record<string, any>);

  const periodChart = ['Início (1-10)', 'Meio (11-20)', 'Final (21-31)'].map(period => 
    monthPeriods[period] || { period, amount: 0, count: 0, averageAmount: 0 }
  );

  // Análise de gastos por faixa de valor
  const valueRanges = currentMonthTransactions.reduce((acc, transaction) => {
    const amount = Number(transaction.amount);
    let range;
    
    if (amount <= 20) range = 'Até R$ 20';
    else if (amount <= 50) range = 'R$ 21-50';
    else if (amount <= 100) range = 'R$ 51-100';
    else if (amount <= 200) range = 'R$ 101-200';
    else range = 'Acima R$ 200';
    
    if (!acc[range]) {
      acc[range] = {
        range,
        count: 0,
        totalAmount: 0
      };
    }
    
    acc[range].count += 1;
    acc[range].totalAmount += amount;
    
    return acc;
  }, {} as Record<string, any>);

  const valueRangeChart = ['Até R$ 20', 'R$ 21-50', 'R$ 51-100', 'R$ 101-200', 'Acima R$ 200']
    .map(range => valueRanges[range] || { range, count: 0, totalAmount: 0 });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const totalSpent = currentMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const averageDaily = totalSpent / new Date().getDate();
  const mostActiveDay = weekdayChart.reduce((max, day) => day.amount > max.amount ? day : max, weekdayChart[0]);
  const mostActiveWeek = periodChart.reduce((max, period) => period.amount > max.amount ? period : max, periodChart[0]);

  return (
    <div className="space-y-6">
      {/* Card principal com resumo */}
      <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🕒 Padrões de Gastos
          </CardTitle>
          <CardDescription className="text-cyan-100">
            Quando e como você costuma gastar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 p-3 rounded-lg text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm opacity-90">Dia mais ativo</p>
              <p className="text-lg font-bold">{mostActiveDay?.weekday || 'N/A'}</p>
              <p className="text-xs opacity-75">{formatCurrency(mostActiveDay?.amount || 0)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg text-center">
              <Clock className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm opacity-90">Período mais ativo</p>
              <p className="text-lg font-bold">{mostActiveWeek?.period.split(' ')[0] || 'N/A'}</p>
              <p className="text-xs opacity-75">{formatCurrency(mostActiveWeek?.amount || 0)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg text-center">
              <MapPin className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm opacity-90">Média diária</p>
              <p className="text-lg font-bold">{formatCurrency(averageDaily)}</p>
              <p className="text-xs opacity-75">baseado no mês atual</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por dia da semana */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700">📅 Gastos por Dia da Semana</CardTitle>
            <CardDescription>
              Em que dias você gasta mais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekdayChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="weekday"
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
                    name === 'amount' ? formatCurrency(value) : value,
                    name === 'amount' ? 'Total gasto' : 'Transações'
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gastos por período do mês */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-700">📊 Gastos por Período do Mês</CardTitle>
            <CardDescription>
              Distribuição temporal dos gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={periodChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="period"
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
                    name === 'amount' ? formatCurrency(value) : value,
                    name === 'amount' ? 'Total gasto' : 'Transações'
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por faixa de valor */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-purple-700">💰 Distribuição por Faixa de Valor</CardTitle>
          <CardDescription>
            Perfil dos seus gastos por valor das transações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={valueRangeChart}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="range"
                className="text-gray-600"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                className="text-gray-600"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value,
                  name === 'count' ? 'Quantidade' : 'Total gasto'
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {valueRangeChart.map((item, index) => (
              <div key={item.range} className="bg-gray-50 p-2 rounded-lg text-center">
                <p className="text-xs font-medium text-gray-700">{item.range}</p>
                <p className="text-sm font-bold text-purple-600">{item.count} transações</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.totalAmount)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};