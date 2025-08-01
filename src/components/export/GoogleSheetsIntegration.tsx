
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  CheckCircle,
  BarChart3,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Transaction } from '@/types/finance';
import { toast } from 'sonner';

interface TransactionExportProps {
  transactions: Transaction[];
}

export const GoogleSheetsIntegration = ({ transactions }: TransactionExportProps) => {
  const [loading, setLoading] = useState(false);

  const exportToTXT = () => {
    setLoading(true);
    
    try {
      const content = generateTXTContent();
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transacoes_completas_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Relatório TXT exportado com sucesso!', {
        description: `${transactions.length} transações exportadas`,
      });
    } catch (error) {
      console.error('Erro ao exportar TXT:', error);
      toast.error('Erro ao exportar arquivo TXT');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    setLoading(true);
    
    try {
      const content = generateExcelContent();
      
      const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transacoes_completas_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Planilha Excel exportada com sucesso!', {
        description: `${transactions.length} transações exportadas`,
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar planilha Excel');
    } finally {
      setLoading(false);
    }
  };

  const generateTXTContent = () => {
    const header = `RELATÓRIO COMPLETO DE TRANSAÇÕES FINANCEIRAS
=====================================================
Período: ${getDateRange()}
Total de transações: ${transactions.length}
Gerado em: ${new Date().toLocaleString('pt-BR')}
=====================================================

`;

    const summary = `RESUMO FINANCEIRO:
- Total de Receitas: ${formatCurrency(totalIncome)}
- Total de Despesas: ${formatCurrency(totalExpenses)}
- Saldo: ${formatCurrency(totalIncome - totalExpenses)}

`;

    const transactionsContent = `DETALHAMENTO DAS TRANSAÇÕES:
${'='.repeat(50)}

${transactions
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .map(t => 
    `Data: ${new Date(t.date).toLocaleDateString('pt-BR')}
Descrição: ${t.description}
Categoria: ${t.category}
Método: ${t.paymentMethod}
Valor: ${formatCurrency(t.amount)}
Tipo: ${t.type === 'income' ? 'Receita' : 'Despesa'}
Status: ${t.status === 'paid' ? 'Pago' : 'Pendente'}
${'─'.repeat(30)}`
  ).join('\n\n')}
`;

    return header + summary + transactionsContent;
  };

  const generateExcelContent = () => {
    const headers = [
      'Data',
      'Descrição', 
      'Categoria',
      'Método de Pagamento',
      'Valor (R$)',
      'Tipo',
      'Status'
    ];

    const rows = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(t => [
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.description,
        t.category,
        t.paymentMethod,
        t.amount.toFixed(2).replace('.', ','),
        t.type === 'income' ? 'Receita' : 'Despesa',
        t.status === 'paid' ? 'Pago' : 'Pendente'
      ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join('\t'))
      .join('\n');

    return csvContent;
  };

  const getDateRange = () => {
    if (transactions.length === 0) return 'Nenhuma transação';
    
    const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
    const startDate = dates[0].toLocaleDateString('pt-BR');
    const endDate = dates[dates.length - 1].toLocaleDateString('pt-BR');
    
    return startDate === endDate ? startDate : `${startDate} até ${endDate}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalTransactions = transactions.length;
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header explicativo */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Download className="h-6 w-6" />
            Exportar Transações Completas
          </CardTitle>
          <CardDescription className="text-blue-100">
            Exporte todas as suas transações financeiras em formato TXT ou Excel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm opacity-90">Transações</p>
              <p className="text-xl font-bold">{totalTransactions}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90">Período</p>
              <p className="text-lg font-bold">{getDateRange()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90">Receitas Totais</p>
              <p className="text-xl font-bold">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90">Despesas Totais</p>
              <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formatos de exportação */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-indigo-700 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dados incluídos na exportação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">📊 Informações por transação</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Data da transação
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Descrição detalhada
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Categoria e subcategoria
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Método de pagamento
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Valor e tipo (receita/despesa)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Status (pago/pendente)
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">📈 Resumo financeiro</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Total de receitas do período
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Total de despesas do período
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Saldo final calculado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Período de análise completo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Data de geração do relatório
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📄 Formatos disponíveis:</h4>
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Arquivo TXT (relatório completo)
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileSpreadsheet className="h-3 w-3" />
                Planilha Excel (dados tabulados)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar TXT */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exportar Relatório TXT
            </CardTitle>
            <CardDescription>
              Gere um relatório completo em formato texto com resumo e detalhamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Incluído no arquivo TXT:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Resumo financeiro completo</li>
                <li>• Período de análise</li>
                <li>• Detalhamento de cada transação</li>
                <li>• Formatação organizada para leitura</li>
              </ul>
            </div>

            <Button
              onClick={exportToTXT}
              disabled={loading || transactions.length === 0}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              {loading ? 'Gerando TXT...' : 'Baixar Relatório TXT'}
            </Button>

            {transactions.length === 0 && (
              <p className="text-center text-gray-500 text-sm">
                Adicione algumas transações primeiro
              </p>
            )}
          </CardContent>
        </Card>

        {/* Exportar Excel */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Exportar Planilha Excel
            </CardTitle>
            <CardDescription>
              Exporte dados estruturados em planilha Excel para análises avançadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Incluído na planilha Excel:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Dados tabulados por colunas</li>
                <li>• Ordenação cronológica</li>
                <li>• Formatação para análise</li>
                <li>• Compatível com filtros e gráficos</li>
              </ul>
            </div>

            <Button
              onClick={exportToExcel}
              disabled={loading || transactions.length === 0}
              variant="outline"
              className="w-full border-blue-500 text-blue-700 hover:bg-blue-50"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {loading ? 'Gerando Excel...' : 'Baixar Planilha Excel'}
            </Button>

            {transactions.length === 0 && (
              <p className="text-center text-gray-500 text-sm">
                Adicione algumas transações primeiro
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instruções de uso */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-purple-700 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Como usar os arquivos exportados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">📄 Arquivo TXT:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ideal para backup e arquivamento</li>
                  <li>• Pode ser aberto em qualquer editor de texto</li>
                  <li>• Formato de relatório para impressão</li>
                  <li>• Inclui resumo e detalhamento completo</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">📊 Planilha Excel:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Permite análises avançadas com filtros</li>
                  <li>• Compatível com Excel, LibreOffice, Google Sheets</li>
                  <li>• Dados estruturados para criar gráficos</li>
                  <li>• Ordenação cronológica reversa (mais recentes primeiro)</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dicas importantes:
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• <strong>Dados atualizados:</strong> Os arquivos incluem todas as transações cadastradas até o momento da exportação</li>
                <li>• <strong>Backup regular:</strong> Exporte periodicamente para manter um histórico completo</li>
                <li>• <strong>Análise externa:</strong> Use os dados em outras ferramentas de análise financeira</li>
                <li>• <strong>Controle total:</strong> Seus dados ficam disponíveis mesmo offline</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
