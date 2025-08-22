
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types/finance";
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertCircle, Target, CheckCircle, Calendar } from "lucide-react";
import { ExpenseChart } from "./ExpenseChart";
import { CategoryChart } from "./CategoryChart";
import { MonthlyEvolutionChart } from "./MonthlyEvolutionChart";
import { FinancialGoals } from "./FinancialGoals";
import { SmartInsights } from "./SmartInsights";
import { AdvancedFilters } from "./AdvancedFilters";
import { CashFlowChart } from "./CashFlowChart";
import { PaymentMethodChart } from "./PaymentMethodChart";
import { CategoryTrendsChart } from "./CategoryTrendsChart";
import { FixedVsVariableChart } from "./FixedVsVariableChart";
import { SpendingPatternsChart } from "./SpendingPatternsChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getValidTransactions } from "@/utils/transactionFilters";

interface EnhancedDashboardOverviewProps {
  transactions: Transaction[];
}

export const EnhancedDashboardOverview = ({ transactions }: EnhancedDashboardOverviewProps) => {
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  
  // Encontrar todos os meses disponíveis
  const availableMonths = transactions.length > 0 
    ? Array.from(new Set(transactions.map(t => t.date.slice(0, 7))))
        .sort()
        .reverse()
    : [new Date().toISOString().slice(0, 7)];
  
  // Mês selecionado (padrão: mais recente)
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || new Date().toISOString().slice(0, 7));
  
  // Atualizar filteredTransactions quando transactions mudarem
  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);
  
  // Atualizar mês selecionado quando novas transações chegarem
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);
  
  // Função para filtrar transações válidas (excluir não concluídas/estornadas)
  const validCurrentTransactions = getValidTransactions(
    filteredTransactions.filter(t => t.date.startsWith(selectedMonth))
  );

  // Calcular mês anterior para comparação
  const previousMonth = (() => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  })();

  const validPreviousTransactions = getValidTransactions(
    filteredTransactions.filter(t => t.date.startsWith(previousMonth))
  );

  const totalIncome = validCurrentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = validCurrentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const previousIncome = validPreviousTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const previousExpenses = validPreviousTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;
  
  // Calcular tendências e projeções
  const incomeVariation = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0;
  const expenseVariation = previousExpenses > 0 ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 : 0;
  
  // Mapear transações para categorias inteligentes
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

  // Calcular progresso das metas
  const monthlyGoalSavings = 336; // 20% da renda para reserva de emergência
  const currentSavings = validCurrentTransactions
    .filter(t => t.type === 'expense')
    .filter(t => {
      const mappedCategory = mapTransactionToCategory(t.description, t.category);
      return mappedCategory.toLowerCase().includes('investimentos');
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsProgress = (currentSavings / monthlyGoalSavings) * 100;
  
  // Calcular gastos fixos baseado nas categorias de despesas recorrentes
  const fixedCategories = ['Faculdade', 'Celular', 'Academia'];
  const fixedExpenses = validCurrentTransactions
    .filter(t => t.type === 'expense')
    .filter(t => {
      const mappedCategory = mapTransactionToCategory(t.description, t.category);
      return fixedCategories.includes(mappedCategory);
    })
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
      {/* Resumo Executivo Estratégico */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">🧠 Análise Estratégica - {(() => {
                const [year, month] = selectedMonth.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              })()}</CardTitle>
              <CardDescription className="text-indigo-100">
                Insights inteligentes e tendências para suas decisões financeiras
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/70" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map(month => {
                    const [year, monthNum] = month.split('-');
                    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                    const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    return (
                      <SelectItem key={month} value={month}>
                        {monthName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tendência de Receita */}
            <div className="text-center bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {incomeVariation >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-300" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-300" />
                )}
                <p className="text-sm opacity-90">Tendência de Receita</p>
              </div>
              <p className={`text-xl font-bold ${incomeVariation >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {incomeVariation >= 0 ? '+' : ''}{incomeVariation.toFixed(1)}%
              </p>
              <p className="text-xs opacity-75 mt-1">vs mês anterior</p>
            </div>

            {/* Controle de Gastos */}
            <div className="text-center bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {expenseVariation <= 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-300" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-orange-300" />
                )}
                <p className="text-sm opacity-90">Controle de Gastos</p>
              </div>
              <p className={`text-xl font-bold ${expenseVariation <= 0 ? 'text-green-200' : 'text-orange-200'}`}>
                {expenseVariation >= 0 ? '+' : ''}{expenseVariation.toFixed(1)}%
              </p>
              <p className="text-xs opacity-75 mt-1">vs mês anterior</p>
            </div>

            {/* Progresso das Metas */}
            <div className="text-center bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-yellow-300" />
                <p className="text-sm opacity-90">Meta de Poupança</p>
              </div>
              <p className={`text-xl font-bold ${savingsProgress >= 100 ? 'text-green-200' : savingsProgress >= 50 ? 'text-yellow-200' : 'text-orange-200'}`}>
                {savingsProgress.toFixed(0)}%
              </p>
              <p className="text-xs opacity-75 mt-1">{formatCurrency(currentSavings)} de {formatCurrency(monthlyGoalSavings)}</p>
            </div>

            {/* Saúde Financeira */}
            <div className="text-center bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {balance > 500 ? (
                  <CheckCircle className="h-5 w-5 text-green-300" />
                ) : balance > 0 ? (
                  <AlertCircle className="h-5 w-5 text-yellow-300" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-300" />
                )}
                <p className="text-sm opacity-90">Saúde Financeira</p>
              </div>
              <p className={`text-xl font-bold ${
                balance > 500 ? 'text-green-200' : balance > 0 ? 'text-yellow-200' : 'text-red-200'
              }`}>
                {balance > 500 ? 'Excelente' : balance > 0 ? 'Boa' : 'Atenção'}
              </p>
              <p className="text-xs opacity-75 mt-1">
                {balance > 0 ? `Sobrou ${formatCurrency(balance)}` : `Déficit ${formatCurrency(Math.abs(balance))}`}
              </p>
            </div>
          </div>

          {/* Alertas e Recomendações */}
          <div className="mt-6 space-y-3">
            {savingsProgress < 50 && (
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3">
                <p className="text-sm">
                  <strong>💡 Oportunidade:</strong> Você está em {savingsProgress.toFixed(0)}% da meta de poupança. 
                  Considere transferir mais {formatCurrency(monthlyGoalSavings - currentSavings)} para investimentos este mês.
                </p>
              </div>
            )}
            {expenseVariation > 20 && (
              <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-3">
                <p className="text-sm">
                  <strong>⚠️ Atenção:</strong> Seus gastos aumentaram {expenseVariation.toFixed(1)}% comparado ao mês passado. 
                  Revise os gastos variáveis para manter o controle.
                </p>
              </div>
            )}
            {balance > 1000 && savingsProgress >= 100 && (
              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                <p className="text-sm">
                  <strong>🎉 Parabéns!</strong> Mês excepcional! Você bateu suas metas e ainda sobrou {formatCurrency(balance)}. 
                  Considere investir esse extra ou acelerar a meta do baixo musical.
                </p>
              </div>
            )}
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
              {validCurrentTransactions.filter(t => t.type === 'income').length} transações
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
              {validCurrentTransactions.filter(t => t.type === 'expense').length} transações
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
            <CashFlowChart transactions={filteredTransactions} />
            <PaymentMethodChart transactions={filteredTransactions} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseChart transactions={filteredTransactions} />
            <CategoryChart transactions={filteredTransactions} />
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <FinancialGoals transactions={filteredTransactions} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <SmartInsights transactions={filteredTransactions} />
          <SpendingPatternsChart transactions={filteredTransactions} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryTrendsChart transactions={filteredTransactions} />
            <FixedVsVariableChart transactions={filteredTransactions} />
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
            <CashFlowChart transactions={filteredTransactions} />
            <PaymentMethodChart transactions={filteredTransactions} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
