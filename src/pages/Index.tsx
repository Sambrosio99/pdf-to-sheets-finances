import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { FileUploader } from "@/components/upload/FileUploader";
import { GoogleSheetsExport } from "@/components/export/GoogleSheetsExport";
import { GoogleSheetsIntegration } from "@/components/export/GoogleSheetsIntegration";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { LogOut, Wallet } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading, addTransaction, addMultipleTransactions, updateTransaction, deleteTransaction } = useTransactions();

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
            <Button onClick={() => window.location.href = '/auth'} className="w-full">
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
            <Button onClick={() => window.location.href = '/auth'} variant="outline">
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-white/50 backdrop-blur-sm">
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
              📤 Exportar CSV
            </TabsTrigger>
            <TabsTrigger value="sheets" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              📊 Google Sheets
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
                  loading={isAddingTransaction}
                />
              </CardContent>
            </Card>

            <TransactionList
              transactions={transactions}
              loading={loading}
              updateTransaction={updateTransaction}
              deleteTransaction={deleteTransaction}
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
                  onUpload={async (transactions) => {
                    setIsUploading(true);
                    await addMultipleTransactions(transactions);
                    setIsUploading(false);
                  }}
                  loading={isUploading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <GoogleSheetsExport transactions={transactions} />
          </TabsContent>

          <TabsContent value="sheets" className="space-y-6">
            <GoogleSheetsIntegration transactions={transactions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
