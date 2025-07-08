
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { YearlyReport } from "@/components/reports/YearlyReport";
import { PDFUploader } from "@/components/upload/PDFUploader";
import { Transaction } from "@/types/finance";

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, updatedTransaction: Partial<Transaction>) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, ...updatedTransaction } : t)
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Controle Financeiro Pessoal
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Organize suas finanças com dashboards inteligentes e análises detalhadas
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-white/50 backdrop-blur-sm">
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
            <TabsTrigger value="upload" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">
              📄 Upload PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOverview transactions={transactions} />
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

          <TabsContent value="upload" className="space-y-6">
            <PDFUploader onDataExtracted={(data) => {
              data.forEach(transaction => addTransaction(transaction));
            }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
