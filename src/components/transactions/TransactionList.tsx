
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/types/finance";
import { Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TransactionListProps {
  transactions: Transaction[];
  onUpdate: (id: string, transaction: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

export const TransactionList = ({ transactions, onUpdate, onDelete }: TransactionListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const categories = [...new Set(transactions.map(t => t.category))];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;
    const matchesType = filterType === "all" || transaction.type === filterType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const handleDelete = (id: string, description: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${description}"?`)) {
      onDelete(id);
      toast.success("Transação excluída com sucesso!");
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-700">📋 Lista de Transações</CardTitle>
        <CardDescription>
          Gerencie todas as suas transações financeiras
        </CardDescription>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/50"
            />
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="sm:w-48 bg-white/50">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="sm:w-32 bg-white/50">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {transactions.length === 0 
                ? "Nenhuma transação encontrada. Adicione sua primeira transação!" 
                : "Nenhuma transação corresponde aos filtros aplicados."
              }
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-gray-200/50 hover:bg-white/70 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">
                      {formatDate(transaction.date)}
                    </span>
                    <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                      {transaction.type === 'income' ? '📈 Receita' : '📉 Despesa'}
                    </Badge>
                    <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                      {transaction.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900">{transaction.description}</h3>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>📂 {transaction.category}</span>
                    {transaction.paymentMethod && (
                      <span>💳 {transaction.paymentMethod}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`text-lg font-bold ${
                    transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Aqui você pode implementar um modal de edição
                        toast.info("Funcionalidade de edição em breve!");
                      }}
                      className="bg-white/50 hover:bg-white/70"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(transaction.id, transaction.description)}
                      className="bg-white/50 hover:bg-red-50 text-red-600 border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
