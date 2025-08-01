import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, TrendingDown, Equal, Calendar, Download,
  ArrowUpRight, ArrowDownRight, Target, BarChart3
} from 'lucide-react';
import { Transaction } from '@/types/finance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

interface PeriodComparisonProps {
  transactions: Transaction[];
}

export const PeriodComparison = ({ transactions }: PeriodComparisonProps) => {
  const [period1, setPeriod1] = useState('2024');
  const [period2, setPeriod2] = useState('2023');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getYearData = (year: string) => {
    const yearTransactions = transactions.filter(t => 
      new Date(t.date).getFullYear() === parseInt(year)
    );

    const income = yearTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    // Análise por categorias
    const expensesByCategory = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    // Dados mensais para gráfico
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthTransactions = yearTransactions.filter(t => 
        new Date(t.date).getMonth() + 1 === month
      );
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month: new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'short' }),
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthIncome - monthExpenses
      };
    });

    return {
      year,
      income,
      expenses,
      balance,
      savingsRate,
      expensesByCategory,
      monthlyData,
      transactionCount: yearTransactions.length
    };
  };

  const data1 = getYearData(period1);
  const data2 = getYearData(period2);

  // Calcular diferenças percentuais
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = calculateChange(data1.income, data2.income);
  const expenseChange = calculateChange(data1.expenses, data2.expenses);
  const balanceChange = calculateChange(data1.balance, data2.balance);
  const savingsRateChange = data1.savingsRate - data2.savingsRate;

  // Preparar dados comparativos para gráficos
  const comparisonData = [
    {
      metric: 'Receitas',
      [period1]: data1.income,
      [period2]: data2.income,
      change: incomeChange
    },
    {
      metric: 'Despesas',
      [period1]: data1.expenses,
      [period2]: data2.expenses,
      change: expenseChange
    },
    {
      metric: 'Saldo',
      [period1]: data1.balance,
      [period2]: data2.balance,
      change: balanceChange
    }
  ];

  // Comparação de categorias principais
  const allCategories = new Set([
    ...Object.keys(data1.expensesByCategory),
    ...Object.keys(data2.expensesByCategory)
  ]);

  const categoryComparison = Array.from(allCategories).map(category => {
    const amount1 = data1.expensesByCategory[category] || 0;
    const amount2 = data2.expensesByCategory[category] || 0;
    const change = calculateChange(amount1, amount2);
    
    return {
      category,
      [period1]: amount1 as number,
      [period2]: amount2 as number,
      change
    };
  }).sort((a, b) => Math.max(a[period1] as number, a[period2] as number) - Math.max(b[period1] as number, b[period2] as number)).slice(0, 8);

  const generateComparisonReport = () => {
    const reportContent = `
RELATÓRIO COMPARATIVO FINANCEIRO
===============================
Período 1: ${period1} vs Período 2: ${period2}

📊 RESUMO COMPARATIVO
====================
                        ${period1}                ${period2}               Variação
Receitas:              ${formatCurrency(data1.income).padEnd(20)} ${formatCurrency(data2.income).padEnd(20)} ${formatPercentage(incomeChange)}
Despesas:              ${formatCurrency(data1.expenses).padEnd(20)} ${formatCurrency(data2.expenses).padEnd(20)} ${formatPercentage(expenseChange)}
Saldo:                 ${formatCurrency(data1.balance).padEnd(20)} ${formatCurrency(data2.balance).padEnd(20)} ${formatPercentage(balanceChange)}
Taxa de Poupança:      ${data1.savingsRate.toFixed(1)}%${' '.repeat(15)} ${data2.savingsRate.toFixed(1)}%${' '.repeat(15)} ${savingsRateChange > 0 ? '+' : ''}${savingsRateChange.toFixed(1)}pp

🔍 ANÁLISE DE PERFORMANCE
=========================
${incomeChange > 0 ? '✅ Receitas aumentaram' : incomeChange < 0 ? '⚠️ Receitas diminuíram' : '➖ Receitas mantiveram-se estáveis'}
${expenseChange < 0 ? '✅ Despesas diminuíram' : expenseChange > 0 ? '⚠️ Despesas aumentaram' : '➖ Despesas mantiveram-se estáveis'}
${balanceChange > 0 ? '✅ Saldo melhorou' : balanceChange < 0 ? '⚠️ Saldo piorou' : '➖ Saldo manteve-se estável'}
${savingsRateChange > 0 ? '✅ Taxa de poupança melhorou' : savingsRateChange < 0 ? '⚠️ Taxa de poupança piorou' : '➖ Taxa de poupança manteve-se estável'}

💰 COMPARAÇÃO POR CATEGORIAS
============================
${categoryComparison.map(cat => 
  `${cat.category}: ${formatCurrency(cat[period1] as number)} vs ${formatCurrency(cat[period2] as number)} (${formatPercentage(cat.change)})`
).join('\n')}

📈 INSIGHTS E RECOMENDAÇÕES
===========================
${incomeChange > 10 ? '🌟 Excelente crescimento de receitas! Continue focando nas fontes que geraram este aumento.' : ''}
${expenseChange > 15 ? '🚨 Aumento significativo nas despesas. Revise onde os gastos cresceram mais.' : ''}
${savingsRateChange > 5 ? '🎯 Ótima melhoria na taxa de poupança!' : savingsRateChange < -5 ? '⚠️ Taxa de poupança diminuiu significativamente.' : ''}

📋 PRÓXIMAS AÇÕES
=================
1. ${incomeChange < 0 ? 'Identifique as causas da redução de receitas' : 'Mantenha as estratégias que aumentaram a receita'}
2. ${expenseChange > 10 ? 'Revise e otimize as categorias de maior crescimento de gastos' : 'Continue controlando os gastos'}
3. ${savingsRateChange < 0 ? 'Estabeleça metas para recuperar a taxa de poupança' : 'Considere aumentar ainda mais a taxa de poupança'}
4. Compare mensalmente para identificar tendências sazonais
5. Estabeleça metas específicas baseadas nesta análise comparativa

Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comparativo-${period1}-vs-${period2}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Relatório comparativo gerado!');
  };

  const availableYears = Array.from(new Set(
    transactions.map(t => new Date(t.date).getFullYear().toString())
  )).sort().reverse();

  if (availableYears.length < 2) {
    return (
      <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            📊 Comparação de Períodos
          </CardTitle>
          <CardDescription className="text-orange-100">
            Compare seu desempenho financeiro entre diferentes períodos
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Dados insuficientes para comparação</p>
          <p className="text-sm opacity-90">
            Você precisa de pelo menos 2 anos de dados para usar esta funcionalidade
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles de Seleção */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            📊 Comparação de Períodos
          </CardTitle>
          <CardDescription className="text-orange-100">
            Compare seu desempenho financeiro entre diferentes períodos
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Select value={period1} onValueChange={setPeriod1}>
              <SelectTrigger className="w-32 bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="mx-2">vs</span>
            <Select value={period2} onValueChange={setPeriod2}>
              <SelectTrigger className="w-32 bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={generateComparisonReport}
            className="bg-white text-orange-700 hover:bg-orange-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Relatório Comparativo
          </Button>
        </CardContent>
      </Card>

      {/* Métricas Comparativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Receitas</p>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-green-600">{formatCurrency(data1.income)}</p>
              <div className="flex items-center gap-2">
                {incomeChange > 0 ? 
                  <TrendingUp className="h-4 w-4 text-green-500" /> :
                  incomeChange < 0 ?
                  <TrendingDown className="h-4 w-4 text-red-500" /> :
                  <Equal className="h-4 w-4 text-gray-500" />
                }
                <span className={`text-sm ${incomeChange > 0 ? 'text-green-500' : incomeChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {formatPercentage(incomeChange)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Despesas</p>
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-red-600">{formatCurrency(data1.expenses)}</p>
              <div className="flex items-center gap-2">
                {expenseChange > 0 ? 
                  <TrendingUp className="h-4 w-4 text-red-500" /> :
                  expenseChange < 0 ?
                  <TrendingDown className="h-4 w-4 text-green-500" /> :
                  <Equal className="h-4 w-4 text-gray-500" />
                }
                <span className={`text-sm ${expenseChange > 0 ? 'text-red-500' : expenseChange < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                  {formatPercentage(expenseChange)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Saldo</p>
              <Target className={`h-4 w-4 ${data1.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="space-y-1">
              <p className={`text-lg font-bold ${data1.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data1.balance)}
              </p>
              <div className="flex items-center gap-2">
                {balanceChange > 0 ? 
                  <TrendingUp className="h-4 w-4 text-green-500" /> :
                  balanceChange < 0 ?
                  <TrendingDown className="h-4 w-4 text-red-500" /> :
                  <Equal className="h-4 w-4 text-gray-500" />
                }
                <span className={`text-sm ${balanceChange > 0 ? 'text-green-500' : balanceChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {formatPercentage(balanceChange)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Taxa de Poupança</p>
              <BarChart3 className={`h-4 w-4 ${data1.savingsRate >= 10 ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
            <div className="space-y-1">
              <p className={`text-lg font-bold ${data1.savingsRate >= 10 ? 'text-green-600' : 'text-orange-600'}`}>
                {data1.savingsRate.toFixed(1)}%
              </p>
              <div className="flex items-center gap-2">
                {savingsRateChange > 0 ? 
                  <TrendingUp className="h-4 w-4 text-green-500" /> :
                  savingsRateChange < 0 ?
                  <TrendingDown className="h-4 w-4 text-red-500" /> :
                  <Equal className="h-4 w-4 text-gray-500" />
                }
                <span className={`text-sm ${savingsRateChange > 0 ? 'text-green-500' : savingsRateChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {savingsRateChange > 0 ? '+' : ''}{savingsRateChange.toFixed(1)}pp
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Comparativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Comparação Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey={period1} fill="#8884d8" name={period1} />
                <Bar dataKey={period2} fill="#82ca9d" name={period2} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Top Categorias - {period1} vs {period2}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {categoryComparison.map((cat, index) => (
                <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{cat.category}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                      <span>{period1}: {formatCurrency(cat[period1] as number)}</span>
                      <span>{period2}: {formatCurrency(cat[period2] as number)}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={cat.change > 0 ? "destructive" : cat.change < 0 ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {formatPercentage(cat.change)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};