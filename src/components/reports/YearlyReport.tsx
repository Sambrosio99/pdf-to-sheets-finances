import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, AlertTriangle, Target, PieChart } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { toast } from 'sonner';

interface YearlyReportProps {
  transactions: Transaction[];
}

export const YearlyReport = ({ transactions }: YearlyReportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const currentYear = new Date().getFullYear();
  const yearTransactions = transactions.filter(t => 
    new Date(t.date).getFullYear() === currentYear
  );

  // Análises principais
  const totalIncome = yearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = yearTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  // Análise por categorias
  const expensesByCategory = yearTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const monthlyIncome = 1682;
  const annualIncome = monthlyIncome * 12;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Criar conteúdo do relatório
      const reportContent = `
RELATÓRIO FINANCEIRO ANUAL ${currentYear}
=====================================

📊 RESUMO EXECUTIVO
==================
• Total de Receitas: ${formatCurrency(totalIncome)}
• Total de Despesas: ${formatCurrency(totalExpenses)}
• Saldo Final: ${formatCurrency(balance)}
• Taxa de Poupança: ${savingsRate.toFixed(1)}%

🎯 ANÁLISE DE DESEMPENHO
========================
${balance > 0 ? '✅ Você teve um ano positivo! Parabéns pelo controle financeiro.' : '⚠️ Você gastou mais do que ganhou este ano. É importante revisar seus gastos.'}

${savingsRate >= 20 ? '🌟 Excelente taxa de poupança! Você está no caminho certo.' : 
  savingsRate >= 10 ? '👍 Boa taxa de poupança, mas pode melhorar.' : 
  '🚨 Taxa de poupança baixa. Recomenda-se economizar pelo menos 10% da renda.'}

💰 PRINCIPAIS CATEGORIAS DE GASTOS
=================================
${topCategories.map(([category, amount], index) => 
  `${index + 1}. ${category}: ${formatCurrency(amount)} (${((amount / totalExpenses) * 100).toFixed(1)}%)`
).join('\n')}

📈 RECOMENDAÇÕES PARA MELHORIA
==============================
${savingsRate < 10 ? '• Foque em reduzir gastos nas categorias principais listadas acima' : ''}
${topCategories.length > 0 ? `• Considere reduzir gastos em "${topCategories[0][0]}" - sua maior categoria de despesa` : ''}
• Estabeleça metas mensais de economia
• Use a regra 50/30/20: 50% necessidades, 30% desejos, 20% poupança
${balance < 0 ? '• Crie um plano de pagamento de dívidas' : ''}
• Considere investir parte da sua poupança

💡 INSIGHTS IMPORTANTES
=======================
• Gasto médio mensal: ${formatCurrency(totalExpenses / 12)}
• Receita média mensal: ${formatCurrency(totalIncome / 12)}
• Maior categoria de gasto: ${topCategories[0] ? topCategories[0][0] : 'N/A'}
• Percentual da maior categoria: ${topCategories[0] ? ((topCategories[0][1] / totalExpenses) * 100).toFixed(1) + '%' : 'N/A'}

⚡ AÇÕES RECOMENDADAS
====================
1. Revise mensalmente seus gastos
2. Estabeleça um orçamento para cada categoria
3. Automatize suas economias
4. Monitore regularmente suas metas financeiras
5. Considere fontes de renda extra

Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}
      `;

      // Criar e baixar arquivo
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-financeiro-${currentYear}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Relatório gerado e baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Se não há transações, mostrar estado vazio
  if (yearTransactions.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-purple-600 to-blue-700 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            📄 Relatório Financeiro Anual {currentYear}
          </CardTitle>
          <CardDescription className="text-purple-100">
            Análise completa dos seus gastos e recomendações personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Nenhuma transação encontrada para {currentYear}</p>
          <p className="text-sm opacity-90">
            Faça upload dos seus extratos para gerar o relatório completo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-700 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            📄 Relatório Financeiro Anual {currentYear}
          </CardTitle>
          <CardDescription className="text-purple-100">
            Análise completa dos seus gastos e recomendações personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateReport}
            disabled={isGenerating}
            className="bg-white text-purple-700 hover:bg-purple-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Baixar Relatório Completo'}
          </Button>
        </CardContent>
      </Card>

      {/* Preview do Relatório */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Resumo Financeiro */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Receitas:</span>
              <span className="font-bold text-green-600">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span>Despesas:</span>
              <span className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Saldo:</span>
              <span className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Poupança */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Taxa de Poupança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-3xl font-bold ${savingsRate >= 10 ? 'text-green-600' : 'text-orange-600'}`}>
                {savingsRate.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {savingsRate >= 20 ? 'Excelente!' : 
                 savingsRate >= 10 ? 'Bom, mas pode melhorar' : 
                 'Abaixo do recomendado (10%)'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Principais Categorias */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-500" />
              Top 3 Categorias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topCategories.slice(0, 3).map(([category, amount], index) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm">{index + 1}. {category}</span>
                <span className="font-bold text-sm">{formatCurrency(amount)}</span>
              </div>
            ))}
            {topCategories.length === 0 && (
              <p className="text-sm text-gray-500">Nenhuma categoria encontrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recomendações */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Recomendações Principais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {savingsRate < 10 && (
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                <span>Aumente sua taxa de poupança para pelo menos 10% da renda</span>
              </li>
            )}
            {topCategories.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Revise gastos em "{topCategories[0][0]}" - sua maior categoria de despesa</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Estabeleça metas mensais de economia específicas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              <span>Use a regra 50/30/20 para dividir sua renda</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};