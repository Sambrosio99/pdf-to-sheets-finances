
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface GoogleSheetsExportProps {
  transactions: Transaction[];
}

export const GoogleSheetsExport = ({ transactions }: GoogleSheetsExportProps) => {
  const [loading, setLoading] = useState(false);

  const exportToCSV = async () => {
    setLoading(true);
    
    try {
      // Chamar edge function para gerar CSV
      const { data, error } = await supabase.functions.invoke('export-to-sheets', {
        body: { transactions }
      });

      if (error) throw error;

      // Se retornou dados CSV, fazer download
      if (data) {
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'transacoes_financeiras.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Planilha CSV baixada com sucesso!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar dados. Tente novamente.');
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
          <FileSpreadsheet className="h-5 w-5" />
          Exportar Dados Financeiros
        </CardTitle>
        <CardDescription>
          Exporte todos os seus dados financeiros para uma planilha CSV
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
          <p><strong>A planilha CSV incluirá:</strong></p>
          <ul className="list-disc list-inside mt-2">
            <li>Lista completa de transações</li>
            <li>Data, descrição e categoria</li>
            <li>Valores formatados em reais</li>
            <li>Método de pagamento e status</li>
            <li>Tipo (receita ou despesa)</li>
          </ul>
        </div>

        <Button
          onClick={exportToCSV}
          disabled={loading || transactions.length === 0}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          <Download className="mr-2 h-4 w-4" />
          {loading ? 'Exportando...' : 'Baixar Planilha CSV'}
        </Button>

        {transactions.length === 0 && (
          <p className="text-center text-gray-500 text-sm">
            Adicione algumas transações para poder exportar
          </p>
        )}
      </CardContent>
    </Card>
  );
};
