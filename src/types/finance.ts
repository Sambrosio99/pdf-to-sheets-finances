
export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  paymentMethod: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending';
}

export interface BudgetCategory {
  category: string;
  planned: number;
  actual: number;
  color: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}
