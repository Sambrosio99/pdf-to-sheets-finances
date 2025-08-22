import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Download, TrendingUp, TrendingDown, AlertTriangle, Target, PieChart,
  Calendar, DollarSign, CreditCard, BarChart3, Wallet, ArrowUpRight,
  ArrowDownRight, TrendingUp as Growth, Zap, Brain, Eye
} from 'lucide-react';
import { Transaction } from '@/types/finance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { toast } from 'sonner';
import { getValidTransactions, getMonthlyTotalsCorrection, consolidateCategories, calculateSavingsRate, calculateAverageExpense, validateMonthlyTotals } from '@/utils/transactionFilters';

interface AdvancedReportsProps {
  transactions: Transaction[];
}

export const AdvancedReports = ({ transactions }: AdvancedReportsProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('year');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Filtrar transações por período
  const getFilteredTransactions = () => {
    const year = parseInt(selectedYear);
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === year;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Análises avançadas com dados corrigidos
  const getFinancialAnalysis = () => {
    const validTransactions = getValidTransactions(filteredTransactions);
    
    // Calcular totais mensais usando correções
    const monthlyData: any[] = [];
    const months = Array.from(new Set(validTransactions.map(t => t.date.slice(0, 7)))).sort();
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    for (const month of months) {
      const corrected = getMonthlyTotalsCorrection(month, validTransactions);
      totalIncome += corrected.income;
      totalExpenses += corrected.expense;
      
      monthlyData.push({
        month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
        income: corrected.income,
        expenses: corrected.expense,
        balance: corrected.balance
      });
    }

    const totalBalance = totalIncome - totalExpenses;
    const savingsRate = calculateSavingsRate(totalIncome, totalBalance);
    const averageExpense = calculateAverageExpense(monthlyData);

    // Validar categorização para cada mês
    const insights: any[] = [];
    let allCategoriesValid = true;
    
    for (const month of months) {
      const monthTransactions = validTransactions.filter(t => t.date.startsWith(month));
      const corrected = getMonthlyTotalsCorrection(month, validTransactions);
      
      const categorizedIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const categorizedExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const isValid = validateMonthlyTotals(
        corrected.income, 
        corrected.expense, 
        categorizedIncome, 
        categorizedExpense, 
        month
      );
      
      if (!isValid) allCategoriesValid = false;
    }

    // Análise de despesas por categoria
    const expensesByCategory: Record<string, number> = {};
    const expensesByPayment: Record<string, number> = {};
    
    for (const tx of validTransactions) {
      if (tx.type === 'expense') {
        const consolidatedCategory = consolidateCategories(tx.category, tx.description);
        expensesByCategory[consolidatedCategory] = (expensesByCategory[consolidatedCategory] || 0) + tx.amount;
        expensesByPayment[tx.paymentMethod] = (expensesByPayment[tx.paymentMethod] || 0) + tx.amount;
      }
    }

    // Insights inteligentes
    if (savingsRate > 0.2) {
      insights.push({
        type: 'success',
        icon: Target,
        title: 'Excelente Taxa de Poupança',
        description: `Sua taxa de poupança de ${(savingsRate * 100).toFixed(1)}% está acima da meta.`,
        action: 'Continue assim e considere investir o excedente.'
      });
    } else if (savingsRate < 0) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Taxa de Poupança Negativa',
        description: `Sua taxa de poupança é de ${(savingsRate * 100).toFixed(1)}%. Recomenda-se revisar gastos.`,
        action: 'Analise suas despesas e corte gastos desnecessários.'
      });
    }
    
    if (averageExpense > 2000) {
      insights.push({
        type: 'info',
        icon: TrendingUp,
        title: 'Gasto Médio Elevado',
        description: `Gasto médio mensal: R$ ${averageExpense.toFixed(2)}`,
        action: 'Considere criar um orçamento mais restritivo.'
      });
    }
    
    if (!allCategoriesValid) {
      insights.push({
        type: 'warning',
        icon: Eye,
        title: 'Inconsistências Detectadas',
        description: 'Detectadas inconsistências na categorização. Verifique os logs para detalhes.',
        action: 'Revise a categorização das transações.'
      });
    }

    const biggestExpenseCategory = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (biggestExpenseCategory) {
      insights.push({
        type: 'info',
        icon: PieChart,
        title: 'Maior Categoria de Gasto',
        description: `${biggestExpenseCategory[0]}: R$ ${biggestExpenseCategory[1].toFixed(2)}`,
        action: 'Monitore esta categoria de perto para otimizar gastos.'
      });
    }

    return {
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalBalance,
      savingsRate: savingsRate * 100,
      averageMonthlyExpense: averageExpense,
      expensesByCategory,
      expensesByPayment,
      monthlyData,
      insights,
      topCategory: biggestExpenseCategory
    };
  };

  const analysis = getFinancialAnalysis();

  // Dados para gráficos
  const categoryChartData = Object.entries(analysis.expensesByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / analysis.expenses) * 100
    }));

  const paymentMethodData = Object.entries(analysis.expensesByPayment)
    .map(([method, amount]) => ({
      method,
      amount,
      percentage: (amount / analysis.expenses) * 100
    }));

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
    '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
  ];

  // Gerar relatório avançado
  const generateAdvancedReport = async () => {
    setIsGenerating(true);
    
    try {
      const reportContent = `
RELATÓRIO FINANCEIRO AVANÇADO ${selectedYear}
============================================

📊 RESUMO EXECUTIVO
==================
• Total de Receitas: ${formatCurrency(analysis.income)}
• Total de Despesas: ${formatCurrency(analysis.expenses)}
• Saldo Final: ${formatCurrency(analysis.balance)}
• Taxa de Poupança: ${formatPercentage(analysis.savingsRate)}
• Gasto Médio Mensal: ${formatCurrency(analysis.averageMonthlyExpense)}

${analysis.balance > 0 ? '✅ ANO POSITIVO - Parabéns pelo controle financeiro!' : '⚠️ DÉFICIT - Gastos superaram receitas'}

💰 ANÁLISE DETALHADA POR CATEGORIAS
===================================
${categoryChartData.map((item, index) => 
  `${index + 1}. ${item.category}: ${formatCurrency(item.amount)} (${formatPercentage(item.percentage)})`
).join('\n')}

💳 ANÁLISE POR MÉTODO DE PAGAMENTO
==================================
${paymentMethodData.map((item, index) => 
  `${index + 1}. ${item.method}: ${formatCurrency(item.amount)} (${formatPercentage(item.percentage)})`
).join('\n')}

📈 EVOLUÇÃO MENSAL
==================
${analysis.monthlyData.map(month => 
  `${month.month}: Receitas ${formatCurrency(month.income)} | Gastos ${formatCurrency(month.expenses)} | Saldo ${formatCurrency(month.balance)}`
).join('\n')}

🧠 INSIGHTS INTELIGENTES
========================
${analysis.insights.map((insight, index) => 
  `${index + 1}. ${insight.title}: ${insight.description} Ação: ${insight.action}`
).join('\n\n')}

🎯 RECOMENDAÇÕES ESTRATÉGICAS
=============================
• Meta de Poupança: ${analysis.savingsRate < 10 ? 'Aumente para pelo menos 10%' : analysis.savingsRate < 20 ? 'Tente chegar aos 20%' : 'Mantenha o excelente nível atual'}
• Categoria Principal: ${analysis.topCategory ? `Otimize gastos em "${analysis.topCategory[0]}"` : 'Continue diversificando gastos'}
• Planejamento: Crie orçamentos específicos por categoria
• Automação: Configure transferências automáticas para poupança
• Investimentos: ${analysis.savingsRate > 15 ? 'Considere diversificar com investimentos' : 'Foque primeiro em aumentar a reserva de emergência'}

💡 PRÓXIMOS PASSOS
==================
1. Revisar gastos da categoria principal mensalmente
2. Estabelecer metas específicas por categoria
3. Automatizar pelo menos 10% da renda para poupança
4. Criar alertas para gastos acima da média
5. Revisar este relatório trimestralmente

Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
Período analisado: ${selectedYear}
Total de transações: ${filteredTransactions.length}
      `;

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-avancado-${selectedYear}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Relatório avançado gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (filteredTransactions.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-blue-600 to-purple-700 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            📊 Relatórios Financeiros Avançados
          </CardTitle>
          <CardDescription className="text-blue-100">
            Análises detalhadas e insights inteligentes sobre suas finanças
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Nenhuma transação encontrada para o período selecionado</p>
          <p className="text-sm opacity-90">
            Faça upload dos seus extratos para gerar relatórios completos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Controles */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-700 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            📊 Relatórios Financeiros Avançados
          </CardTitle>
          <CardDescription className="text-blue-100">
            Análises detalhadas e insights inteligentes sobre suas finanças
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={generateAdvancedReport}
            disabled={isGenerating}
            className="bg-white text-purple-700 hover:bg-purple-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Baixar Relatório Completo'}
          </Button>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receitas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(analysis.income)}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Despesas</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(analysis.expenses)}</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo</p>
                <p className={`text-2xl font-bold ${analysis.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(analysis.balance)}
                </p>
              </div>
              <Wallet className={`h-8 w-8 ${analysis.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Poupança</p>
                <p className={`text-2xl font-bold ${analysis.savingsRate >= 10 ? 'text-green-600' : 'text-orange-600'}`}>
                  {formatPercentage(analysis.savingsRate)}
                </p>
              </div>
              <Target className={`h-8 w-8 ${analysis.savingsRate >= 10 ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Inteligentes */}
      {analysis.insights.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Insights Inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <insight.icon className={`h-5 w-5 mt-0.5 ${
                  insight.type === 'success' ? 'text-green-500' :
                  insight.type === 'warning' ? 'text-yellow-500' :
                  'text-blue-500'
                }`} />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  <p className="text-sm text-gray-500 mt-1 italic">{insight.action}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Análises Visuais */}
      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">Evolução Mensal</TabsTrigger>
          <TabsTrigger value="categories">Por Categorias</TabsTrigger>
          <TabsTrigger value="payments">Métodos de Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Evolução Mensal das Finanças</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analysis.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Receitas" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Despesas" />
                  <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} name="Saldo" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Distribuição por Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ method, percentage }) => `${method} (${formatPercentage(percentage)})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Detalhamento dos Métodos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethodData.map((item, index) => (
                    <div key={item.method} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="font-medium">{item.method}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(item.amount)}</div>
                        <div className="text-sm text-gray-500">{formatPercentage(item.percentage)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};