export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'upi' | 'cash' | 'card' | 'net_banking';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
  date: string;
  created_at: number;
  payment_method?: PaymentMethod;
}

export interface Goal {
  id: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  due_date: string;
  category?: string;
  created_at: number;
  status: 'active' | 'completed';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'goal' | 'budget' | 'statement' | 'upi';
  date: string;
  read: number;
  created_at: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  isAi?: boolean;
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
  orderBy?: 'date' | 'created_at';
}
