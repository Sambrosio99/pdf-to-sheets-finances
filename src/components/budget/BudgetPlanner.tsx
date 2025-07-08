
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Transaction } from "@/types/finance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface BudgetPlannerProps {
  transactions: Transaction[];
}

export const BudgetPlanner = ({ transactions }: BudgetPlannerProps) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const currentMonthExpenses = transactions.filter(t => 
    t.type === 'expense' && t.date.startsWith(currentMonth)
  );

  // Orçamento planejado por categoria (valores fictícios para demonstração)
  const budgetPlanned = {
    'Alimentação': 800,
    'Transporte': 400,
    'Moradia': 1200,
    'Saúde': 300,
    'Educação': 200,
    'Lazer': 300,
    'Compras': 250,
    'Serviços': 150,
    'Outros': 200
  };

  // Calcular gastos reais por categoria
  const actualExpenses = currentMonthExpenses.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = 0;
    }
    acc[transaction.category] += transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const budgetData = Object.entries(budgetPlanned).map(([category, planned]) => {
    const actual = actualExpenses[category] || 0;
    const percentage = (actual / planned) * 100;
    const status = percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good';
    
    return {
      category,
      planned,
      actual,
      percentage: Math.min(percentage, 100),
      status,
      remaining: planned - actual
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

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">💰 Resumo do Orçamento - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-90">Orçamento Planejado</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPlanned)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Gasto Atual</p>
              <p className="text-2xl font-bold">{formatCurrency(totalActual)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Restante</p>
              <p className={`text-2xl font-bold ${totalActual > totalPlanned ? 'text-red-200' : 'text-green-200'}`}>
                {formatCurrency(totalPlanned - totalActual)}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso Geral</span>
              <span>{totalPercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(totalPercentage, 100)} 
              className="h-3 bg-white/20" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      <div className="space-y-4">
        {budgetData.filter(item => item.status === 'over').length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Atenção!</strong> Você ultrapassou o orçamento em {budgetData.filter(item => item.status === 'over').length} categoria(s).
            </AlertDescription>
          </Alert>
        )}
        
        {budgetData.filter(item => item.status === 'warning').length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Cuidado!</strong> Você está próximo do limite em {budgetData.filter(item => item.status === 'warning').length} categoria(s).
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Detalhes por Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgetData.map((item) => (
          <Card key={item.category} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg text-gray-800">{item.category}</CardTitle>
                <div className="flex items-center gap-2">
                  {item.status === 'good' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {item.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                  {item.status === 'over' && <AlertTriangle className="h-5 w-5 text-red-500" />}
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
