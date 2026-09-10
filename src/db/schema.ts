export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
  date: string; 
  created_at: number; 
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: number; 
  year: number;
}

export interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  monthIncome: number;
  monthExpenses: number;
  monthBalance: number;
}

export interface DailyExpense {
  day: number; 
  date: string; 
  amount: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrendPoint {
  month: number;
  year: number;
  label: string; 
  income: number;
  expense: number;
}

export interface TransactionFilters {
  search?: string;
  category?: string;
  type?: 'all' | 'income' | 'expense';
  month?: number; 
  year?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
