import * as SQLite from 'expo-sqlite';
import { formatDateISO } from '../utils/date';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!databaseInstance) {
    databaseInstance = SQLite.openDatabaseSync('expense_tracker.db');
    initDatabase(databaseInstance);
  }
  return databaseInstance;
}

export function initDatabase(db: SQLite.SQLiteDatabase) {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      note TEXT,
      date TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      UNIQUE(category, month, year)
    );

    CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', 'USD');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('currency_symbol', '$');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'dark');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('user_name', 'Jake Wilson');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('user_handle', 'jake_wilson');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('onboarding_completed', 'true');
  `);

  const countRow = db.getFirstSync<{ count: number }>(`SELECT COUNT(*) as count FROM transactions`);
  if (!countRow || countRow.count === 0) {
    const today = formatDateISO(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = formatDateISO(yesterdayDate);

    const prevDate = new Date();
    prevDate.setDate(prevDate.getDate() - 3);
    const prevDay = formatDateISO(prevDate);

    const now = Date.now();

    db.runSync(
      `INSERT INTO transactions (id, amount, type, category, note, date, created_at) VALUES
       ('t1', 8500.00, 'income', 'Salary', 'Monthly Salary Deposit', ?, ?),
       ('t2', 200.00, 'income', 'Salary', 'Cash Deposit', ?, ?),
       ('t3', 24.50, 'expense', 'Food & Dining', 'Burger King', ?, ?),
       ('t4', 120.00, 'expense', 'Shopping', 'Nike Store', ?, ?),
       ('t5', 50.00, 'expense', 'Transport', 'Metro Card', ?, ?),
       ('t6', 6.50, 'expense', 'Food & Dining', 'Starbucks', ?, ?),
       ('t7', 1080.00, 'expense', 'Shopping', 'Apparel & Electronics', ?, ?),
       ('t8', 689.00, 'expense', 'Food & Dining', 'Groceries & Dining', ?, ?),
       ('t9', 104.20, 'expense', 'Transport', 'Uber Rides', ?, ?),
       ('t10', 1171.30, 'expense', 'Bills', 'Utilities & Subscriptions', ?, ?)`,
      [
        today, now,
        today, now + 1,
        today, now + 2,
        today, now + 3,
        yesterday, now + 4,
        yesterday, now + 5,
        prevDay, now + 6,
        prevDay, now + 7,
        prevDay, now + 8,
        prevDay, now + 9,
      ]
    );

    const curMonth = new Date().getMonth() + 1;
    const curYear = new Date().getFullYear();

    db.runSync(
      `INSERT OR IGNORE INTO budgets (id, category, amount, month, year) VALUES
       ('b1', 'Shopping', 1000.00, ?, ?),
       ('b2', 'Food & Dining', 800.00, ?, ?),
       ('b3', 'Transport', 500.00, ?, ?)`,
      [curMonth, curYear, curMonth, curYear, curMonth, curYear]
    );
  }
}
