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

    INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', 'INR');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('currency_symbol', '₹');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'dark');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('user_name', 'User');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('user_handle', 'user');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('onboarding_completed', 'true');
  `);
}
