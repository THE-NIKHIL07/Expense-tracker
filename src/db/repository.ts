import { getDatabase } from './database';
import {
  Transaction,
  Budget,
  BudgetWithSpending,
  FinancialSummary,
  DailyExpense,
  CategorySpending,
  MonthlyTrendPoint,
  TransactionFilters,
} from './schema';
import { getDaysInMonth, MONTH_NAMES_SHORT, formatDateISO } from '../utils/date';

export interface WeeklyDaySpending {
  day: string;
  date: string;
  amount: number;
}

export const TransactionRepository = {
  addTransaction(transaction: Omit<Transaction, 'created_at'>): Transaction {
    const db = getDatabase();
    const created_at = Date.now();
    const newTx: Transaction = {
      ...transaction,
      created_at,
    };

    db.runSync(
      `INSERT INTO transactions (id, amount, type, category, note, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newTx.id,
        newTx.amount,
        newTx.type,
        newTx.category,
        newTx.note || null,
        newTx.date,
        newTx.created_at,
      ]
    );

    return newTx;
  },

  updateTransaction(id: string, transaction: Partial<Omit<Transaction, 'id' | 'created_at'>>) {
    const db = getDatabase();
    const current = db.getFirstSync<Transaction>(`SELECT * FROM transactions WHERE id = ?`, [id]);
    if (!current) throw new Error(`Transaction with id ${id} not found`);

    const updated = {
      amount: transaction.amount !== undefined ? transaction.amount : current.amount,
      type: transaction.type !== undefined ? transaction.type : current.type,
      category: transaction.category !== undefined ? transaction.category : current.category,
      note: transaction.note !== undefined ? transaction.note : current.note,
      date: transaction.date !== undefined ? transaction.date : current.date,
    };

    db.runSync(
      `UPDATE transactions
       SET amount = ?, type = ?, category = ?, note = ?, date = ?
       WHERE id = ?`,
      [updated.amount, updated.type, updated.category, updated.note || null, updated.date, id]
    );
  },

  deleteTransaction(id: string) {
    const db = getDatabase();
    db.runSync(`DELETE FROM transactions WHERE id = ?`, [id]);
  },

  clearPreviousMonthsData(): number {
    const db = getDatabase();
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const startOfMonth = `${now.getFullYear()}-${m}-01`;
    const result = db.runSync(`DELETE FROM transactions WHERE date < ?`, [startOfMonth]);
    return result.changes;
  },

  resetAllData() {
    const db = getDatabase();
    db.runSync(`DELETE FROM transactions`);
    db.runSync(`DELETE FROM budgets`);
  },

  getTransactions(filters: TransactionFilters = {}): Transaction[] {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.search && filters.search.trim() !== '') {
      conditions.push(`(category LIKE ? OR note LIKE ?)`);
      params.push(`%${filters.search.trim()}%`, `%${filters.search.trim()}%`);
    }

    if (filters.category && filters.category !== 'all') {
      conditions.push(`category = ?`);
      params.push(filters.category);
    }

    if (filters.type && filters.type !== 'all') {
      conditions.push(`type = ?`);
      params.push(filters.type);
    }

    if (filters.startDate && filters.endDate) {
      conditions.push(`date BETWEEN ? AND ?`);
      params.push(filters.startDate, filters.endDate);
    } else if (filters.month && filters.year) {
      const m = String(filters.month).padStart(2, '0');
      const start = `${filters.year}-${m}-01`;
      const days = getDaysInMonth(filters.month, filters.year);
      const end = `${filters.year}-${m}-${String(days).padStart(2, '0')}`;
      conditions.push(`date BETWEEN ? AND ?`);
      params.push(start, end);
    }

    let query = `SELECT * FROM transactions`;
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY date DESC, created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ${filters.limit}`;
      if (filters.offset) {
        query += ` OFFSET ${filters.offset}`;
      }
    }

    return db.getAllSync<Transaction>(query, params);
  },

  getFinancialSummary(month: number, year: number): FinancialSummary {
    const db = getDatabase();

    const allTime = db.getFirstSync<{ totalIncome: number | null; totalExpenses: number | null }>(
      `SELECT
         SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses
       FROM transactions`
    );

    const totalIncome = allTime?.totalIncome || 0;
    const totalExpenses = allTime?.totalExpenses || 0;
    const totalBalance = totalIncome - totalExpenses;

    const m = String(month).padStart(2, '0');
    const start = `${year}-${m}-01`;
    const days = getDaysInMonth(month, year);
    const end = `${year}-${m}-${String(days).padStart(2, '0')}`;

    const monthTime = db.getFirstSync<{ monthIncome: number | null; monthExpenses: number | null }>(
      `SELECT
         SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as monthIncome,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as monthExpenses
       FROM transactions
       WHERE date BETWEEN ? AND ?`,
      [start, end]
    );

    const monthIncome = monthTime?.monthIncome || 0;
    const monthExpenses = monthTime?.monthExpenses || 0;
    const monthBalance = monthIncome - monthExpenses;

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      monthIncome,
      monthExpenses,
      monthBalance,
    };
  },

  getWeeklySpending(): { days: WeeklyDaySpending[]; percentChange: number; currentWeekTotal: number } {
    const db = getDatabase();
    const now = new Date();
    const currentDayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek);

    const daysName = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const days: WeeklyDaySpending[] = [];
    let currentWeekTotal = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const iso = formatDateISO(d);

      const row = db.getFirstSync<{ total: number | null }>(
        `SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date = ?`,
        [iso]
      );
      const amount = row?.total || 0;
      currentWeekTotal += amount;

      days.push({
        day: daysName[i],
        date: iso,
        amount,
      });
    }

    const prevWeekStart = new Date(startOfWeek);
    prevWeekStart.setDate(startOfWeek.getDate() - 7);
    const prevWeekEnd = new Date(startOfWeek);
    prevWeekEnd.setDate(startOfWeek.getDate() - 1);

    const prevRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date BETWEEN ? AND ?`,
      [formatDateISO(prevWeekStart), formatDateISO(prevWeekEnd)]
    );
    const prevTotal = prevRow?.total || 0;

    let percentChange = 0;
    if (prevTotal > 0) {
      percentChange = Math.round(((currentWeekTotal - prevTotal) / prevTotal) * 100);
    } else if (currentWeekTotal > 0) {
      percentChange = 20;
    }

    return { days, percentChange, currentWeekTotal };
  },

  getDailySpending(month: number, year: number): DailyExpense[] {
    const db = getDatabase();
    const m = String(month).padStart(2, '0');
    const daysCount = getDaysInMonth(month, year);
    const start = `${year}-${m}-01`;
    const end = `${year}-${m}-${String(daysCount).padStart(2, '0')}`;

    const rows = db.getAllSync<{ dayDate: string; total: number }>(
      `SELECT date as dayDate, SUM(amount) as total
       FROM transactions
       WHERE type = 'expense' AND date BETWEEN ? AND ?
       GROUP BY date
       ORDER BY date ASC`,
      [start, end]
    );

    const map = new Map<string, number>();
    rows.forEach((r) => {
      map.set(r.dayDate, r.total);
    });

    const result: DailyExpense[] = [];
    for (let d = 1; d <= daysCount; d++) {
      const dayStr = String(d).padStart(2, '0');
      const fullDate = `${year}-${m}-${dayStr}`;
      result.push({
        day: d,
        date: fullDate,
        amount: map.get(fullDate) || 0,
      });
    }

    return result;
  },

  getCategorySpending(month: number, year: number): CategorySpending[] {
    const db = getDatabase();
    const m = String(month).padStart(2, '0');
    const daysCount = getDaysInMonth(month, year);
    const start = `${year}-${m}-01`;
    const end = `${year}-${m}-${String(daysCount).padStart(2, '0')}`;

    const rows = db.getAllSync<{ category: string; amount: number; count: number }>(
      `SELECT LOWER(category) as category, SUM(amount) as amount, COUNT(id) as count
       FROM transactions
       WHERE type = 'expense' AND date BETWEEN ? AND ?
       GROUP BY LOWER(category)
       ORDER BY amount DESC`,
      [start, end]
    );

    const totalExpense = rows.reduce((sum, r) => sum + r.amount, 0);

    return rows.map((r) => ({
      category: r.category,
      amount: r.amount,
      count: r.count,
      percentage: totalExpense > 0 ? Math.round((r.amount / totalExpense) * 100) : 0,
    }));
  },

  getMonthlyTrend(monthsCount: number = 6): MonthlyTrendPoint[] {
    const db = getDatabase();
    const result: MonthlyTrendPoint[] = [];

    const now = new Date();
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const mStr = String(m).padStart(2, '0');
      const daysCount = getDaysInMonth(m, y);
      const start = `${y}-${mStr}-01`;
      const end = `${y}-${mStr}-${String(daysCount).padStart(2, '0')}`;

      const row = db.getFirstSync<{ income: number | null; expense: number | null }>(
        `SELECT
           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
         FROM transactions
         WHERE date BETWEEN ? AND ?`,
        [start, end]
      );

      result.push({
        month: m,
        year: y,
        label: MONTH_NAMES_SHORT[m - 1],
        income: row?.income || 0,
        expense: row?.expense || 0,
      });
    }

    return result;
  },
};

export const BudgetRepository = {
  getBudgets(month: number, year: number): BudgetWithSpending[] {
    const db = getDatabase();
    const mStr = String(month).padStart(2, '0');
    const daysCount = getDaysInMonth(month, year);
    const start = `${year}-${mStr}-01`;
    const end = `${year}-${mStr}-${String(daysCount).padStart(2, '0')}`;

    const budgets = db.getAllSync<Budget>(
      `SELECT * FROM budgets WHERE month = ? AND year = ? ORDER BY amount DESC`,
      [month, year]
    );

    const spendingRows = db.getAllSync<{ category: string; spent: number }>(
      `SELECT category, SUM(amount) as spent
       FROM transactions
       WHERE type = 'expense' AND date BETWEEN ? AND ?
       GROUP BY category`,
      [start, end]
    );

    const spendingMap = new Map<string, number>();
    spendingRows.forEach((r) => spendingMap.set(r.category.toLowerCase(), r.spent));

    return budgets.map((b) => {
      const spent = spendingMap.get(b.category.toLowerCase()) || 0;
      const remaining = b.amount - spent;
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return {
        ...b,
        spent,
        remaining,
        percentage,
      };
    });
  },

  setBudget(category: string, amount: number, month: number, year: number): Budget {
    const db = getDatabase();
    const id = `${category.toLowerCase()}_${year}_${month}`;

    db.runSync(
      `INSERT INTO budgets (id, category, amount, month, year)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(category, month, year) DO UPDATE SET amount = excluded.amount`,
      [id, category, amount, month, year]
    );

    return { id, category, amount, month, year };
  },

  deleteBudget(id: string) {
    const db = getDatabase();
    db.runSync(`DELETE FROM budgets WHERE id = ?`, [id]);
  },
};

export const SettingsRepository = {
  getSetting(key: string, defaultValue: string): string {
    const db = getDatabase();
    const row = db.getFirstSync<{ value: string }>(`SELECT value FROM settings WHERE key = ?`, [key]);
    return row?.value ?? defaultValue;
  },

  setSetting(key: string, value: string) {
    const db = getDatabase();
    db.runSync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  },
};
