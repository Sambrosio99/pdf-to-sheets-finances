
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Transaction } from "@/types/finance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Target, TrendingUp } from "lucide-react";

interface BudgetPlannerProps {
  transactions: Transaction[];
}

export const BudgetPlanner = ({ transactions }: BudgetPlannerProps) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyIncome = 1682; // Seu salário líquido
  
  const currentMonthExpenses = transactions.filter(t => 
    t.type === 'expense' && t.date.startsWith(currentMonth)
  );

  // Orçamento personalizado baseado na sua situação
  const budgetPlanned = {
    'Faculdade': 509, // Gasto fixo conhecido
    'Celular': 40,    // Gasto fixo conhecido
    'Academia': 89,   // Gasto fixo conhecido
    'Transporte': 200,
    'Investimentos': 300, // 20% da renda para reserva + investimentos
    'Baixo Musical': 150, // Valor mensal para a meta do baixo
    'Compras Pessoais': 150, // Roupas, fones, bonés etc
    'Outros': 100
  };

  // Função para mapear descrições para categorias
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
    
    // Se não encontrar correspondência, usar a categoria original
    return originalCategory;
  };

  // Calcular gastos reais por categoria com mapeamento automático
  const actualExpenses = currentMonthExpenses.reduce((acc, transaction) => {
    const mappedCategory = mapTransactionToCategory(transaction.description, transaction.category);
    
    if (!acc[mappedCategory]) {
      acc[mappedCategory] = 0;
    }
    acc[mappedCategory] += transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  // Incluir categorias que existem nos gastos reais mas não no planejado
  const allCategories = new Set([...Object.keys(budgetPlanned), ...Object.keys(actualExpenses)]);
  
  const budgetData = Array.from(allCategories).map(category => {
    const planned = budgetPlanned[category] || 100; // Valor padrão se não planejado
    const actual = actualExpenses[category] || 0;
    const percentage = (actual / planned) * 100;
    const status = percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good';
    
    return {
      category,
      planned,
      actual,
      percentage: Math.min(percentage, 100),
      realPercentage: percentage,
      status,
      remaining: planned - actual,
      isFixed: ['Faculdade', 'Celular', 'Academia'].includes(category)
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalPlanned = Object.values(budgetPlanned).reduce((sum, value) => sum + value, 0);
  const totalActual = Object.values(actualExpenses).reduce((sum, value) => sum + value, 0);
  const totalPercentage = (totalActual / totalPlanned) * 100;
  const remainingBudget = monthlyIncome - totalActual;
  const savingsPotential = monthlyIncome - totalPlanned;

  return (
    <div className="space-y-6">
      {/* Resumo Personalizado */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="h-6 w-6" />
            💰 Orçamento Personalizado - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Baseado no seu salário de {formatCurrency(monthlyIncome)} e seus objetivos financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm opacity-90">Orçamento Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPlanned)}</p>
              <p className="text-xs opacity-75">{((totalPlanned/monthlyIncome)*100).toFixed(1)}% da renda</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Gasto Atual</p>
              <p className="text-2xl font-bold">{formatCurrency(totalActual)}</p>
              <p className="text-xs opacity-75">{((totalActual/monthlyIncome)*100).toFixed(1)}% da renda</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Disponível</p>
              <p className={`text-2xl font-bold ${remainingBudget > 0 ? 'text-green-200' : 'text-red-200'}`}>
                {formatCurrency(remainingBudget)}
              </p>
              <p className="text-xs opacity-75">
                {remainingBudget > 0 ? 'Sobrou' : 'Excedeu'}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90">Potencial de Economia</p>
              <p className="text-2xl font-bold text-yellow-200">{formatCurrency(savingsPotential)}</p>
              <p className="text-xs opacity-75">Se seguir o orçamento</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso Geral do Orçamento</span>
              <span>{totalPercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(totalPercentage, 100)} 
              className="h-3 bg-white/20" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Alertas Personalizados */}
      <div className="space-y-4">
        {remainingBudget < 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>⚠️ Orçamento Ultrapassado!</strong> Você gastou {formatCurrency(Math.abs(remainingBudget))} a mais que o planejado. 
              Considere revisar os gastos variáveis para os próximos meses.
            </AlertDescription>
          </Alert>
        )}
        
        {budgetData.filter(item => item.status === 'over').length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>📊 Categorias no Vermelho:</strong> {budgetData.filter(item => item.status === 'over').length} categoria(s) 
              ultrapassaram o orçamento planejado.
            </AlertDescription>
          </Alert>
        )}

        {savingsPotential > 200 && remainingBudget > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>🎉 Parabéns!</strong> Você tem potencial para economizar {formatCurrency(savingsPotential)} por mês 
              se seguir este orçamento. Isso te ajudará a atingir suas metas mais rapidamente!
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Recomendações para suas Metas */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            🎯 Estratégia para suas Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">💰 Reserva de Emergência (3 salários)</h4>
              <p className="text-sm opacity-90 mb-2">Meta: {formatCurrency(monthlyIncome * 3)}</p>
              <p className="text-sm">
                💡 <strong>Estratégia:</strong> Reserve {formatCurrency(336)} por mês (20% da renda) 
                para atingir a meta em 15 meses.
              </p>
            </div>
            
            <div className="bg-white/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🎸 Baixo Musical</h4>
              <p className="text-sm opacity-90 mb-2">Meta estimada: R$ 2.000</p>
              <p className="text-sm">
                💡 <strong>Estratégia:</strong> Guarde {formatCurrency(150)} por mês 
                e compre seu baixo em 13 meses.
              </p>
            </div>
            
            <div className="bg-white/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">📈 Investimentos Triplos</h4>
              <p className="text-sm opacity-90 mb-2">Renda fixa + Igreja + Ações</p>
              <p className="text-sm">
                💡 <strong>Estratégia:</strong> Destine {formatCurrency(200)} para investimentos 
                diversificados após consolidar a reserva.
              </p>
            </div>
            
            <div className="bg-white/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🛍️ Compras Pessoais</h4>
              <p className="text-sm opacity-90 mb-2">Roupas, acessórios, etc.</p>
              <p className="text-sm">
                💡 <strong>Estratégia:</strong> Mantenha {formatCurrency(150)} mensais 
                para compras sem comprometer as metas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes por Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetData
          .sort((a, b) => b.realPercentage - a.realPercentage) // Ordenar por % real (maiores primeiro)
          .map((item) => (
          <Card key={item.category} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                  {item.isFixed && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">FIXO</span>}
                  {item.category}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {item.status === 'good' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {item.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  {item.status === 'over' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Planejado: {formatCurrency(item.planned)}</span>
                  <span>Gasto: {formatCurrency(item.actual)}</span>
                </div>
                
                <Progress 
                  value={item.percentage} 
                  className={`h-2 ${
                    item.status === 'good' ? 'bg-green-100' : 
                    item.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}
                />
                
                <div className="text-center">
                  <span className={`text-sm font-medium ${
                    item.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.remaining >= 0 
                      ? `Restam ${formatCurrency(item.remaining)}` 
                      : `Ultrapassou em ${formatCurrency(Math.abs(item.remaining))}`
                    }
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.realPercentage.toFixed(1)}% do orçamento
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
