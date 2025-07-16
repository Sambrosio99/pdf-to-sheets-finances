
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ExternalLink } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface GoogleSheetsExportProps {
  transactions: Transaction[];
}

export const GoogleSheetsExport = ({ transactions }: GoogleSheetsExportProps) => {
  const [loading, setLoading] = useState(false);
  const [lastExportUrl, setLastExportUrl] = useState<string | null>(null);

  const exportToGoogleSheets = async () => {
    setLoading(true);
    
    try {
      // Chamar edge function para exportar para Google Sheets
      const { data, error } = await supabase.functions.invoke('export-to-sheets', {
        body: { transactions }
      });

      if (error) throw error;

      if (data?.spreadsheetUrl) {
        setLastExportUrl(data.spreadsheetUrl);
        toast.success('Dados exportados para Google Sheets com sucesso!');
        
        // Abrir a planilha em nova aba
        window.open(data.spreadsheetUrl, '_blank');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar para Google Sheets. Verifique suas configurações.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-green-700 flex items-center gap-2">
          📊 Exportar para Google Sheets
        </CardTitle>
        <CardDescription>
          Exporte todos os seus dados financeiros para uma planilha do Google
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-4 bg-white/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total de Receitas</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total de Despesas</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <p><strong>A planilha incluirá:</strong></p>
          <ul className="list-disc list-inside mt-2">
            <li>Resumo financeiro mensal</li>
            <li>Lista completa de transações</li>
            <li>Análise por categorias</li>
            <li>Gráficos automáticos</li>
          </ul>
        </div>

        <Button
          onClick={exportToGoogleSheets}
          disabled={loading || transactions.length === 0}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          <Download className="mr-2 h-4 w-4" />
          {loading ? 'Exportando...' : 'Exportar para Google Sheets'}
        </Button>

        {lastExportUrl && (
          <Button
            variant="outline"
            onClick={() => window.open(lastExportUrl, '_blank')}
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir Última Planilha Exportada
          </Button>
        )}

        {transactions.length === 0 && (
          <p className="text-center text-gray-500 text-sm">
            Adicione algumas transações para poder exportar
          </p>
        )}
      </CardContent>
    </Card>
  );
};
