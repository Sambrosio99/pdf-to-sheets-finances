
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types/finance";
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertCircle, Target } from "lucide-react";
import { ExpenseChart } from "./ExpenseChart";
import { CategoryChart } from "./CategoryChart";
import { MonthlyEvolutionChart } from "./MonthlyEvolutionChart";
import { FinancialGoals } from "./FinancialGoals";
import { SmartInsights } from "./SmartInsights";
import { AdvancedFilters } from "./AdvancedFilters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EnhancedDashboardOverviewProps {
  transactions: Transaction[];
}

export const EnhancedDashboardOverview = ({ transactions }: EnhancedDashboardOverviewProps) => {
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  
  // Atualizar filteredTransactions quando transactions mudarem
  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);
  // Encontrar o mês mais recente nas transações
  const latestMonth = filteredTransactions.length > 0 
    ? filteredTransactions
        .map(t => t.date.slice(0, 7))
        .sort()
        .reverse()[0]
    : new Date().toISOString().slice(0, 7);
  
  const currentMonthTransactions = filteredTransactions.filter(t => 
    t.date.startsWith(latestMonth)
  );

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;
  
  // Calcular gastos fixos baseado nas categorias de despesas recorrentes
  const fixedCategories = ['Educação', 'Telefone/Internet', 'Academias/Esportes'];
  const fixedExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense' && fixedCategories.includes(t.category))
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const availableIncome = totalIncome - fixedExpenses;
  const variableExpenses = totalExpenses - fixedExpenses;
  const spendingRate = availableIncome > 0 ? (variableExpenses / availableIncome) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Resumo Executivo */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">💼 Resumo Executivo - {new Date(latestMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</CardTitle>
          <CardDescription className="text-indigo-100">
            Visão geral da sua situação financeira atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm opacity-90">Receita Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90">Gastos Fixos</p>
              <p className="text-2xl font-bold text-orange-200">{formatCurrency(fixedExpenses)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90">Renda Livre</p>
              <p className="text-2xl font-bold text-green-200">{formatCurrency(availableIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90">Taxa de Uso</p>
              <p className={`text-2xl font-bold ${spendingRate > 80 ? 'text-red-200' : 'text-green-200'}`}>
                {spendingRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principais atualizadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Receitas do Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            <p className="text-xs opacity-90 mt-1">
              {currentMonthTransactions.filter(t => t.type === 'income').length} transações
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Despesas do Mês
            </CardTitle>
            <TrendingDown className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs opacity-90 mt-1">
              {currentMonthTransactions.filter(t => t.type === 'expense').length} transações
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600'} text-white border-0 shadow-lg`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Saldo do Mês
            </CardTitle>
            <DollarSign className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
            <p className="text-xs opacity-90 mt-1">
              {balance >= 0 ? 'Positivo' : 'Negativo'}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${spendingRate > 80 ? 'from-red-500 to-orange-600' : 'from-purple-500 to-violet-600'} text-white border-0 shadow-lg`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Uso da Renda Livre
            </CardTitle>
            {spendingRate > 80 ? <AlertCircle className="h-4 w-4 opacity-90" /> : <Target className="h-4 w-4 opacity-90" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spendingRate.toFixed(1)}%</div>
            <p className="text-xs opacity-90 mt-1">
              de {formatCurrency(availableIncome)} disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas do Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-white/50 backdrop-blur-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
            📊 Visão Geral
          </TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            🎯 Metas
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            💡 Insights
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            📈 Análises
          </TabsTrigger>
          <TabsTrigger value="filters" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            🔍 Filtros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseChart transactions={filteredTransactions} />
            <CategoryChart transactions={filteredTransactions} />
          </div>
          <div className="grid grid-cols-1 gap-6">
            <MonthlyEvolutionChart transactions={filteredTransactions} />
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <FinancialGoals transactions={filteredTransactions} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <SmartInsights transactions={filteredTransactions} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseChart transactions={filteredTransactions} />
            <CategoryChart transactions={filteredTransactions} />
          </div>
          <div className="grid grid-cols-1 gap-6">
            <MonthlyEvolutionChart transactions={filteredTransactions} />
          </div>
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <AdvancedFilters 
            transactions={transactions} 
            onFilterChange={setFilteredTransactions}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseChart transactions={filteredTransactions} />
            <CategoryChart transactions={filteredTransactions} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
