
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Transaction } from "@/types/finance";
import { Target, TrendingUp, Landmark, Music, ShoppingBag } from "lucide-react";

interface FinancialGoalsProps {
  transactions: Transaction[];
}

export const FinancialGoals = ({ transactions }: FinancialGoalsProps) => {
  const monthlyIncome = 1682; // Salário fixo
  const emergencyGoal = monthlyIncome * 3; // 3 salários para reserva de emergência
  
  // Função para mapear descrições para categorias (mesma lógica do BudgetPlanner)
  const mapTransactionToCategory = (description: string, originalCategory: string): string => {
    const desc = description.toLowerCase();
    
    if (desc.includes('rdb') || desc.includes('investimento') || desc.includes('aplicação') || desc.includes('poupança')) {
      return 'Investimentos';
    }
    if (desc.includes('baixo') || desc.includes('instrumento') || desc.includes('música')) {
      return 'Baixo Musical';
    }
    
    return originalCategory;
  };

  // Calcular total poupado baseado em mapeamento automático das transações
  const totalSaved = transactions
    .filter(t => t.type === 'expense')
    .filter(t => {
      const mappedCategory = mapTransactionToCategory(t.description, t.category);
      return mappedCategory.toLowerCase().includes('investimentos') || 
             mappedCategory.toLowerCase().includes('poupança') ||
             mappedCategory.toLowerCase().includes('reserva');
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Calcular valores específicos para baixo musical
  const bassSaved = transactions
    .filter(t => t.type === 'expense')
    .filter(t => {
      const mappedCategory = mapTransactionToCategory(t.description, t.category);
      return mappedCategory.toLowerCase().includes('baixo musical');
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const emergencyProgress = (totalSaved / emergencyGoal) * 100;
  
  // Meta do baixo (estimativa)
  const bassGoal = 2000;
  const bassProgress = (bassSaved / bassGoal) * 100;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const monthsToEmergencyGoal = Math.ceil((emergencyGoal - totalSaved) / (monthlyIncome * 0.2)); // 20% da renda
  const monthsToBass = Math.ceil((bassGoal - bassSaved) / (monthlyIncome * 0.1)); // 10% da renda

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Financeiras
          </CardTitle>
          <CardDescription className="text-green-100">
            Acompanhe seu progresso rumo aos seus objetivos
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reserva de Emergência */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Landmark className="h-5 w-5" />
              Reserva de Emergência
            </CardTitle>
            <CardDescription>Meta: {formatCurrency(emergencyGoal)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso:</span>
                <span className="font-medium">{emergencyProgress.toFixed(1)}%</span>
              </div>
            <Progress value={Math.min(emergencyProgress, 100)} className="h-3" />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Atual:</span>
                <span className="font-medium text-blue-600">{formatCurrency(totalSaved)}</span>
              </div>
              <div className="flex justify-between">
                <span>Faltam:</span>
                <span className="font-medium text-orange-600">{formatCurrency(emergencyGoal - totalSaved)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tempo estimado:</span>
                <span className="font-medium text-purple-600">{monthsToEmergencyGoal} meses</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meta do Baixo */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Music className="h-5 w-5" />
              Baixo Musical
            </CardTitle>
            <CardDescription>Meta: {formatCurrency(bassGoal)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso:</span>
                <span className="font-medium">{bassProgress.toFixed(1)}%</span>
              </div>
              <Progress value={bassProgress} className="h-3" />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Atual:</span>
                <span className="font-medium text-purple-600">{formatCurrency(bassSaved)}</span>
              </div>
              <div className="flex justify-between">
                <span>Faltam:</span>
                <span className="font-medium text-orange-600">{formatCurrency(bassGoal - bassSaved)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tempo estimado:</span>
                <span className="font-medium text-purple-600">{monthsToBass} meses</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendações */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recomendações Personalizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <p className="font-medium">💰 Para Reserva de Emergência:</p>
              <p className="text-sm opacity-90">
                Guarde {formatCurrency(monthlyIncome * 0.2)} por mês (20% da renda) para atingir sua meta em {monthsToEmergencyGoal} meses
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <p className="font-medium">🎸 Para o Baixo:</p>
              <p className="text-sm opacity-90">
                Reserve {formatCurrency(monthlyIncome * 0.1)} por mês (10% da renda) para comprar seu baixo em {monthsToBass} meses
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <p className="font-medium">📊 Distribuição Sugerida:</p>
              <p className="text-sm opacity-90">
                Gastos fixos: R$ 638 • Reserva: {formatCurrency(monthlyIncome * 0.2)} • Baixo: {formatCurrency(monthlyIncome * 0.1)} • Livre: {formatCurrency(monthlyIncome - 638 - (monthlyIncome * 0.3))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
