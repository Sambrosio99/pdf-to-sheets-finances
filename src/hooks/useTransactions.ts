
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Transaction } from '@/types/finance';
import { toast } from 'sonner';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedTransactions: Transaction[] = data.map(item => ({
        id: item.id,
        date: item.date,
        description: item.description,
        category: item.category,
        paymentMethod: item.payment_method,
        amount: parseFloat(item.amount.toString()), // Corrigido: converter para string primeiro
        type: item.type as 'income' | 'expense',
        status: item.status as 'paid' | 'pending'
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          date: transaction.date,
          description: transaction.description,
          category: transaction.category,
          payment_method: transaction.paymentMethod,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status
        });

      if (error) throw error;

      await fetchTransactions();
      toast.success('Transação adicionada com sucesso!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Erro ao adicionar transação');
    }
  };

  const addMultipleTransactions = async (transactionList: Omit<Transaction, 'id'>[]) => {
    try {
      console.log('useTransactions: Iniciando adição de múltiplas transações:', {
        count: transactionList.length,
        user: user?.id,
        firstTransaction: transactionList[0]
      });

      const transactionsToInsert = transactionList.map(transaction => ({
        user_id: user?.id,
        date: transaction.date,
        description: transaction.description,
        category: transaction.category,
        payment_method: transaction.paymentMethod,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status
      }));

      console.log('useTransactions: Dados preparados para inserção:', {
        sampleData: transactionsToInsert[0],
        totalCount: transactionsToInsert.length
      });

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)
        .select();

      if (error) {
        console.error('useTransactions: Erro do Supabase:', error);
        throw error;
      }

      console.log('useTransactions: Inserção bem-sucedida:', {
        insertedCount: data?.length || 0,
        data: data
      });

      await fetchTransactions();
      toast.success(`${transactionList.length} transações adicionadas com sucesso!`);
    } catch (error) {
      console.error('useTransactions: Erro ao adicionar múltiplas transações:', error);
      toast.error(`Erro ao adicionar transações em lote: ${error.message}`);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          date: updates.date,
          description: updates.description,
          category: updates.category,
          payment_method: updates.paymentMethod,
          amount: updates.amount,
          type: updates.type,
          status: updates.status
        })
        .eq('id', id);

      if (error) throw error;

      await fetchTransactions();
      toast.success('Transação atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar transação');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTransactions();
      toast.success('Transação excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  return {
    transactions,
    loading,
    addTransaction,
    addMultipleTransactions,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions
  };
};
