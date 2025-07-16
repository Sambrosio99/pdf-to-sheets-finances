import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Transaction } from "@/types/finance";
import { toast } from "sonner";

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
}

export const TransactionForm = ({ onSubmit }: TransactionFormProps) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    paymentMethod: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    status: 'paid' as 'paid' | 'pending'
  });

  const categories = [
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
    'Lazer', 'Compras', 'Serviços', 'Investimentos', 'Outros'
  ];

  const paymentMethods = [
    'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 
    'PIX', 'Transferência', 'Boleto', 'Outros'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.category || !formData.amount) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    await onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: '',
      paymentMethod: '',
      amount: '',
      type: 'expense',
      status: 'paid'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="bg-white/50"
          />
        </div>
        
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => 
            setFormData(prev => ({ ...prev, type: value }))
          }>
            <SelectTrigger className="bg-white/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">💸 Despesa</SelectItem>
              <SelectItem value="income">💰 Receita</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição*</Label>
        <Input
          id="description"
          placeholder="Ex: Compra no supermercado"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="bg-white/50"
        />
      </div>

      <div>
        <Label htmlFor="category">Categoria*</Label>
        <Select value={formData.category} onValueChange={(value) => 
          setFormData(prev => ({ ...prev, category: value }))
        }>
          <SelectTrigger className="bg-white/50">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
        <Select value={formData.paymentMethod} onValueChange={(value) => 
          setFormData(prev => ({ ...prev, paymentMethod: value }))
        }>
          <SelectTrigger className="bg-white/50">
            <SelectValue placeholder="Selecione a forma de pagamento" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map(method => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Valor*</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className="bg-white/50"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: 'paid' | 'pending') => 
            setFormData(prev => ({ ...prev, status: value }))
          }>
            <SelectTrigger className="bg-white/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">✅ Pago</SelectItem>
              <SelectItem value="pending">⏳ Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
      >
        ➕ Adicionar Transação
      </Button>
    </form>
  );
};
