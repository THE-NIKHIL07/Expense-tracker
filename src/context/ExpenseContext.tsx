import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Transaction,
  BudgetWithSpending,
  FinancialSummary,
  DailyExpense,
  CategorySpending,
  MonthlyTrendPoint,
  TransactionFilters,
} from '../db/schema';
import {
  TransactionRepository,
  BudgetRepository,
  SettingsRepository,
  WeeklyDaySpending,
} from '../db/repository';
import { getDatabase } from '../db/database';

interface ExpenseContextType {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  summary: FinancialSummary;
  budgets: BudgetWithSpending[];
  dailyExpenses: DailyExpense[];
  weeklySpending: { days: WeeklyDaySpending[]; percentChange: number; currentWeekTotal: number };
  categorySpending: CategorySpending[];
  monthlyTrend: MonthlyTrendPoint[];

  selectedMonth: number;
  selectedYear: number;
  setSelectedPeriod: (month: number, year: number) => void;

  userName: string;
  userHandle: string;
  userPhoto: string | null;
  updateUserProfile: (name: string, handle: string, photoUri: string | null) => void;

  addTransaction: (data: Omit<Transaction, 'created_at'>) => void;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'created_at'>>) => void;
  deleteTransaction: (id: string) => void;
  getFilteredTransactions: (filters: TransactionFilters) => Transaction[];

  setBudget: (category: string, amount: number) => void;
  deleteBudget: (id: string) => void;

  clearPreviousMonthsData: () => number;
  resetAllData: () => void;

  refreshData: () => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [userName, setUserName] = useState<string>('User');
  const [userHandle, setUserHandle] = useState<string>('user');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    monthIncome: 0,
    monthExpenses: 0,
    monthBalance: 0,
  });
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [weeklySpending, setWeeklySpending] = useState<{
    days: WeeklyDaySpending[];
    percentChange: number;
    currentWeekTotal: number;
  }>({
    days: [],
    percentChange: 0,
    currentWeekTotal: 0,
  });
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendPoint[]>([]);

  const refreshData = useCallback(() => {
    try {
      getDatabase();

      const savedName = SettingsRepository.getSetting('user_name', 'User');
      const savedHandle = SettingsRepository.getSetting('user_handle', 'user');
      const savedPhoto = SettingsRepository.getSetting('user_photo', '');
      setUserName(savedName);
      setUserHandle(savedHandle);
      setUserPhoto(savedPhoto || null);

      const allTx = TransactionRepository.getTransactions();
      setTransactions(allTx);

      const recent = TransactionRepository.getTransactions({ limit: 5 });
      setRecentTransactions(recent);

      const sum = TransactionRepository.getFinancialSummary(selectedMonth, selectedYear);
      setSummary(sum);

      const weekly = TransactionRepository.getWeeklySpending();
      setWeeklySpending(weekly);

      const daily = TransactionRepository.getDailySpending(selectedMonth, selectedYear);
      setDailyExpenses(daily);

      const cats = TransactionRepository.getCategorySpending(selectedMonth, selectedYear);
      setCategorySpending(cats);

      const trend = TransactionRepository.getMonthlyTrend(6);
      setMonthlyTrend(trend);

      const bList = BudgetRepository.getBudgets(selectedMonth, selectedYear);
      setBudgets(bList);
    } catch (e) {
      console.error('Error refreshing expense data from SQLite:', e);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const setSelectedPeriod = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const updateUserProfile = (name: string, handle: string, photoUri: string | null) => {
    SettingsRepository.setSetting('user_name', name);
    SettingsRepository.setSetting('user_handle', handle);
    SettingsRepository.setSetting('user_photo', photoUri || '');
    setUserName(name);
    setUserHandle(handle);
    setUserPhoto(photoUri);
  };

  const addTransaction = (data: Omit<Transaction, 'created_at'>) => {
    TransactionRepository.addTransaction(data);
    refreshData();
  };

  const updateTransaction = (id: string, data: Partial<Omit<Transaction, 'id' | 'created_at'>>) => {
    TransactionRepository.updateTransaction(id, data);
    refreshData();
  };

  const deleteTransaction = (id: string) => {
    TransactionRepository.deleteTransaction(id);
    refreshData();
  };

  const getFilteredTransactions = (filters: TransactionFilters) => {
    return TransactionRepository.getTransactions(filters);
  };

  const setBudget = (category: string, amount: number) => {
    BudgetRepository.setBudget(category, amount, selectedMonth, selectedYear);
    refreshData();
  };

  const deleteBudget = (id: string) => {
    BudgetRepository.deleteBudget(id);
    refreshData();
  };

  const clearPreviousMonthsData = () => {
    const deletedCount = TransactionRepository.clearPreviousMonthsData();
    refreshData();
    return deletedCount;
  };

  const resetAllData = () => {
    TransactionRepository.resetAllData();
    refreshData();
  };

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        recentTransactions,
        summary,
        budgets,
        dailyExpenses,
        weeklySpending,
        categorySpending,
        monthlyTrend,
        selectedMonth,
        selectedYear,
        setSelectedPeriod,
        userName,
        userHandle,
        userPhoto,
        updateUserProfile,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getFilteredTransactions,
        setBudget,
        deleteBudget,
        clearPreviousMonthsData,
        resetAllData,
        refreshData,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = (): ExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
