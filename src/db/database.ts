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
    PRAGMA auto_vacuum = INCREMENTAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      note TEXT,
      date TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      payment_method TEXT DEFAULT 'cash'
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

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      saved_amount REAL NOT NULL DEFAULT 0,
      due_date TEXT NOT NULL,
      category TEXT,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE INDEX IF NOT EXISTS idx_goals_due_date ON goals(due_date);
    CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY NOT NULL,
      text TEXT NOT NULL,
      sender TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      isAi INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_messages(timestamp);

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
    INSERT OR IGNORE INTO settings (key, value) VALUES ('biometric_enabled', 'false');
  `);

  try {
    db.execSync(`ALTER TABLE transactions ADD COLUMN payment_method TEXT DEFAULT 'cash'`);
  } catch {}
}
