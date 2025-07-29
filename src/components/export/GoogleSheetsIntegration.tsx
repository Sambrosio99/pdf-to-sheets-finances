
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  Rocket, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle,
  Settings,
  TrendingUp,
  Target,
  BarChart3
} from 'lucide-react';
import { Transaction } from '@/types/finance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface GoogleSheetsIntegrationProps {
  transactions: Transaction[];
}

export const GoogleSheetsIntegration = ({ transactions }: GoogleSheetsIntegrationProps) => {
  const [loading, setLoading] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [targetSpreadsheetId, setTargetSpreadsheetId] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const createCompleteDashboard = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-integration', {
        body: { 
          action: 'create_complete_dashboard',
          transactions,
          spreadsheetId: targetSpreadsheetId 
        }
      });

      if (error) throw error;

      setSpreadsheetId(data.spreadsheetId);
      setSpreadsheetUrl(data.url);
      setIsConfigured(true);
      
      toast.success('Dashboard completo criado no Google Sheets!', {
        description: 'Todas as análises, gráficos e dados foram exportados com sucesso.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Erro ao criar dashboard:', error);
      toast.error('Erro ao criar dashboard no Google Sheets. Verifique se a API key está configurada.');
    } finally {
      setLoading(false);
    }
  };

  const updateExistingSheets = async () => {
    if (!spreadsheetId) {
      toast.error('Por favor, configure primeiro o ID da planilha.');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-integration', {
        body: { 
          action: 'update_sheets',
          transactions,
          sheetsId: spreadsheetId
        }
      });

      if (error) throw error;
      
      toast.success('Planilha atualizada com sucesso!', {
        description: 'Todos os dados foram sincronizados automaticamente.',
      });
    } catch (error) {
      console.error('Erro ao atualizar planilha:', error);
      toast.error('Erro ao atualizar planilha. Tente novamente.');
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

  const totalTransactions = transactions.length;
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header explicativo */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Dashboard Completo no Google Sheets
          </CardTitle>
          <CardDescription className="text-green-100">
            Transforme todos os seus dados financeiros em uma planilha interativa e automatizada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm opacity-90">Transações</p>
              <p className="text-xl font-bold">{totalTransactions}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90">Receitas Totais</p>
              <p className="text-xl font-bold">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90">Despesas Totais</p>
              <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90">Saldo</p>
              <p className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-100' : 'text-red-200'}`}>
                {formatCurrency(totalIncome - totalExpenses)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades incluídas */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-indigo-700 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            O que será incluído na sua planilha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">📊 Análises e Gráficos</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Dashboard executivo com resumo mensal
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Gráficos de gastos por categoria
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Evolução mensal de receitas vs despesas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Análise de saldo acumulado
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">🎯 Metas e Orçamento</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Progresso da reserva de emergência
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Meta do baixo musical
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Orçamento mensal planejado vs realizado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Alertas automáticos de gastos
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🚀 Abas que serão criadas:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant="secondary">Dashboard</Badge>
              <Badge variant="secondary">Transações</Badge>
              <Badge variant="secondary">Orçamento Mensal</Badge>
              <Badge variant="secondary">Metas Financeiras</Badge>
              <Badge variant="secondary">Análises</Badge>
              <Badge variant="secondary">Projeções</Badge>
              <Badge variant="secondary">Configurações</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Criar nova planilha */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Criar Dashboard Completo
            </CardTitle>
            <CardDescription>
              Crie uma nova planilha com todas as análises e gráficos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetSpreadsheetId">ID da sua planilha (opcional)</Label>
              <Input
                id="targetSpreadsheetId"
                placeholder="Cole o ID da planilha onde criar o dashboard"
                value={targetSpreadsheetId}
                onChange={(e) => setTargetSpreadsheetId(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                Deixe vazio para criar uma nova planilha ou cole o ID da planilha existente
              </p>
            </div>

            <Button
              onClick={createCompleteDashboard}
              disabled={loading || transactions.length === 0}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Rocket className="mr-2 h-4 w-4" />
              {loading ? 'Criando Dashboard...' : 'Criar Dashboard Completo'}
            </Button>

            {spreadsheetUrl && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium mb-2">✅ Dashboard criado com sucesso!</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(spreadsheetUrl, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Planilha
                </Button>
              </div>
            )}

            {transactions.length === 0 && (
              <p className="text-center text-gray-500 text-sm">
                Adicione algumas transações primeiro
              </p>
            )}
          </CardContent>
        </Card>

        {/* Atualizar planilha existente */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Atualizar Planilha Existente
            </CardTitle>
            <CardDescription>
              Sincronize dados com uma planilha já criada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spreadsheetId">ID da Planilha do Google Sheets</Label>
              <Input
                id="spreadsheetId"
                placeholder="Exemplo: 1abc...xyz"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                Encontre o ID na URL da planilha: docs.google.com/spreadsheets/d/<strong>ID_AQUI</strong>/edit
              </p>
            </div>

            <Button
              onClick={updateExistingSheets}
              disabled={loading || !spreadsheetId}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {loading ? 'Atualizando...' : 'Atualizar Dados'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instruções de uso */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-purple-700 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Como usar sua planilha automatizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">📋 Primeiros passos:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Clique em "Criar Dashboard Completo"</li>
                  <li>Aguarde a criação da planilha</li>
                  <li>Acesse o link gerado</li>
                  <li>Faça uma cópia para sua conta Google</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🔄 Para manter atualizado:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Copie o ID da sua planilha</li>
                  <li>Cole no campo "ID da Planilha"</li>
                  <li>Clique em "Atualizar Dados"</li>
                  <li>Todos os gráficos se atualizarão automaticamente</li>
                </ol>
              </div>
            </div>

            <Separator />

            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">⚡ Funcionalidades automáticas:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• <strong>Gráficos dinâmicos:</strong> Atualizados automaticamente quando você adicionar dados</li>
                <li>• <strong>Fórmulas inteligentes:</strong> Calculam metas, projeções e alertas em tempo real</li>
                <li>• <strong>Formatação condicional:</strong> Cores que mudam baseadas no seu desempenho</li>
                <li>• <strong>Análises personalizadas:</strong> Baseadas nos seus R$ 1.682 de salário e metas específicas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
