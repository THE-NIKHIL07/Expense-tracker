import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Transaction,
  BudgetWithSpending,
  FinancialSummary,
  DailyExpense,
  CategorySpending,
  MonthlyTrendPoint,
  TransactionFilters,
  Goal,
  AppNotification,
} from '../db/schema';
import {
  TransactionRepository,
  BudgetRepository,
  SettingsRepository,
  WeeklyDaySpending,
  StorageRepository,
  GoalRepository,
  NotificationRepository,
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

  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'created_at'>) => void;
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'created_at'>>) => void;
  deleteGoal: (id: string) => void;

  notifications: AppNotification[];
  unreadCount: number;
  markAllNotificationsRead: () => void;
  addNotification: (title: string, message: string, type: 'goal' | 'budget' | 'statement' | 'upi') => void;

  isBiometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => void;

  isAiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;

  clearPreviousMonthsData: () => number;
  resetAllData: () => void;
  vacuumDatabase: () => void;

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

  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isBiometricEnabled, setIsBiometricEnabledState] = useState<boolean>(false);
  const [isAiEnabled, setIsAiEnabledState] = useState<boolean>(false);

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

      const recent = TransactionRepository.getTransactions({ limit: 5, orderBy: 'created_at' });
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

      const gList = GoalRepository.getGoals();
      setGoals(gList);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      gList.forEach((g) => {
        if (g.status === 'completed') return;
        const due = new Date(g.due_date);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && diffDays >= 0) {
          const notifKey = `goal_due_${g.id}_${diffDays}`;
          if (SettingsRepository.getSetting(notifKey, 'false') !== 'true') {
            NotificationRepository.addNotification(
              'Upcoming Goal Deadline',
              `"${g.title}" is due in ${diffDays === 0 ? 'today' : `${diffDays} day(s)`}. Target remaining: ₹${Math.max(0, g.target_amount - g.saved_amount)}`,
              'goal'
            );
            SettingsRepository.setSetting(notifKey, 'true');
          }
        }
      });

      bList.forEach((b) => {
        if (b.percentage >= 100) {
          const budgetKey = `budget_exceeded_${b.id}_${selectedMonth}_${selectedYear}`;
          if (SettingsRepository.getSetting(budgetKey, 'false') !== 'true') {
            NotificationRepository.addNotification(
              'Budget Exceeded',
              `You have exceeded your ${b.category} budget of ₹${b.amount} (Spent: ₹${b.spent})`,
              'budget'
            );
            SettingsRepository.setSetting(budgetKey, 'true');
          }
        } else if (b.percentage >= 80) {
          const budgetKey = `budget_warning_${b.id}_${selectedMonth}_${selectedYear}`;
          if (SettingsRepository.getSetting(budgetKey, 'false') !== 'true') {
            NotificationRepository.addNotification(
              'Budget Warning (80%)',
              `You have reached ${Math.round(b.percentage)}% of your ${b.category} budget.`,
              'budget'
            );
            SettingsRepository.setSetting(budgetKey, 'true');
          }
        }
      });

      const nList = NotificationRepository.getNotifications();
      setNotifications(nList);
      setUnreadCount(NotificationRepository.getUnreadCount());

      const bio = SettingsRepository.getSetting('biometric_enabled', 'false') === 'true';
      setIsBiometricEnabledState(bio);

      const ai = SettingsRepository.getSetting('ai_enabled', 'false') === 'true';
      setIsAiEnabledState(ai);

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

  const addGoal = (goal: Omit<Goal, 'created_at'>) => {
    GoalRepository.addGoal(goal);
    NotificationRepository.addNotification(
      'Goal Created',
      `Target: ${goal.title} due on ${goal.due_date}`,
      'goal'
    );
    refreshData();
  };

  const updateGoal = (id: string, updates: Partial<Omit<Goal, 'id' | 'created_at'>>) => {
    const existing = GoalRepository.getGoals().find((g) => g.id === id);
    const newSaved = updates.saved_amount !== undefined ? updates.saved_amount : existing?.saved_amount || 0;
    const target = updates.target_amount !== undefined ? updates.target_amount : existing?.target_amount || 0;
    const isCompleted = updates.status === 'completed' || (target > 0 && newSaved >= target);

    if (isCompleted && existing) {
      GoalRepository.deleteGoal(id);
      NotificationRepository.addNotification(
        'Goal Completed 🎉',
        `Congratulations! You completed your goal "${existing.title}"! It has been archived.`,
        'goal'
      );
    } else {
      GoalRepository.updateGoal(id, updates);
    }
    refreshData();
  };

  const deleteGoal = (id: string) => {
    GoalRepository.deleteGoal(id);
    refreshData();
  };

  const markAllNotificationsRead = () => {
    NotificationRepository.markAllAsRead();
    refreshData();
  };

  const addNotification = (title: string, message: string, type: 'goal' | 'budget' | 'statement' | 'upi') => {
    NotificationRepository.addNotification(title, message, type);
    refreshData();
  };

  const setBiometricEnabled = (enabled: boolean) => {
    SettingsRepository.setSetting('biometric_enabled', enabled ? 'true' : 'false');
    setIsBiometricEnabledState(enabled);
  };

  const setAiEnabled = (enabled: boolean) => {
    SettingsRepository.setSetting('ai_enabled', enabled ? 'true' : 'false');
    setIsAiEnabledState(enabled);
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

  const vacuumDatabase = () => {
    StorageRepository.vacuumDatabase();
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
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        notifications,
        unreadCount,
        markAllNotificationsRead,
        addNotification,
        isBiometricEnabled,
        setBiometricEnabled,
        isAiEnabled,
        setAiEnabled,
        clearPreviousMonthsData,
        resetAllData,
        vacuumDatabase,
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
