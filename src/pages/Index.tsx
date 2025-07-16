
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { YearlyReport } from "@/components/reports/YearlyReport";
import { FileUploader } from "@/components/upload/FileUploader";
import { GoogleSheetsExport } from "@/components/export/GoogleSheetsExport";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { transactions, loading, addTransaction, addMultipleTransactions, updateTransaction, deleteTransaction } = useTransactions();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Controle Financeiro Pessoal
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Organize suas finanças com dashboards inteligentes e análises detalhadas
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              {user.email}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="bg-white/50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              💰 Lançamentos
            </TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              📋 Orçamento
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              📈 Relatórios
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              📊 Google Sheets
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">
              📄 Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p>Carregando transações...</p>
              </div>
            ) : (
              <DashboardOverview transactions={transactions} />
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-emerald-700">➕ Nova Transação</CardTitle>
                  <CardDescription>
                    Adicione receitas ou despesas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionForm onSubmit={addTransaction} />
                </CardContent>
              </Card>
              
              <div className="lg:col-span-2">
                <TransactionList 
                  transactions={transactions}
                  onUpdate={updateTransaction}
                  onDelete={deleteTransaction}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <BudgetPlanner transactions={transactions} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <YearlyReport transactions={transactions} />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <GoogleSheetsExport transactions={transactions} />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <FileUploader onDataExtracted={(data) => {
              addMultipleTransactions(data);
            }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
