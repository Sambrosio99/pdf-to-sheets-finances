
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { FileUploader } from "@/components/upload/FileUploader";
import { GoogleSheetsIntegration } from "@/components/export/GoogleSheetsIntegration";
import { AdvancedReports } from "@/components/reports/AdvancedReports";
import { PeriodComparison } from "@/components/reports/PeriodComparison";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";
import { NotificationTester } from "@/components/notifications/NotificationTester";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { LogOut, Wallet } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { transactions, loading, addTransaction, addMultipleTransactions, updateTransaction, deleteTransaction, refetch } = useTransactions();

  const navigate = useNavigate();

  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-gray-600">Verificando sua autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="w-96 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Você precisa estar logado</CardTitle>
            <CardDescription>Faça login para acessar o painel</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Ir para a página de login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6 mr-2 text-green-500" />
              Painel Financeiro
            </CardTitle>
            <Button onClick={signOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Gerencie suas finanças de forma fácil e eficiente
            </CardDescription>
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto p-1 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              💰 Transações
            </TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              📋 Orçamento
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              📁 Upload
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              📤 Exportar Dados
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              📄 Relatórios
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              ⚙️ Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOverview transactions={transactions} />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Adicionar Transação</CardTitle>
                <CardDescription>
                  Registre uma nova receita ou despesa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionForm
                  onSubmit={async (transaction) => {
                    setIsAddingTransaction(true);
                    await addTransaction(transaction);
                    setIsAddingTransaction(false);
                  }}
                />
              </CardContent>
            </Card>

            <TransactionList
              transactions={transactions}
              onUpdate={updateTransaction}
              onDelete={deleteTransaction}
            />
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <BudgetPlanner transactions={transactions} />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Importar Transações em Lote</CardTitle>
                <CardDescription>
                  Carregue um arquivo CSV para adicionar várias transações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader
                  onDataExtracted={async (transactions) => {
                    console.log('Index.tsx: Recebendo transações do uploader:', {
                      count: transactions.length,
                      sample: transactions[0]
                    });
                    
                    setIsUploading(true);
                    await addMultipleTransactions(transactions);
                    // Força atualização dos dados
                    await refetch();
                    setIsUploading(false);
                    
                    console.log('Index.tsx: Processo de upload finalizado');
                  }}
                />
              </CardContent>
            </Card>
            
            <NotificationTester />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <GoogleSheetsIntegration transactions={transactions} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <AdvancedReports transactions={transactions} />
            <PeriodComparison transactions={transactions} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <PasswordChangeForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
