# 💸 Expense Tracker

<div align="center">

[![React Native](https://img.shields.io/badge/React%20Native-0.76+-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2052-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Local%20DB-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

### Fast, elegant, and 100% offline personal finance tracking for Android and iOS.

[✨ Features](#-features) • [🚀 Quick Start](#-quick-start) • [🛠️ Tech Stack](#-tech-stack) • [📦 Build APK](#-building-the-apk) • [🔒 Privacy](#-offline-guarantee--privacy)

</div>

---

> 🔒 **Offline Guarantee**: Your financial data never leaves your device. No cloud sync, no tracking, no account required. Everything is stored locally on a lightning-fast SQLite engine with WAL mode.

---

## 🌟 At a Glance

- [x] **100% Offline & Private** — Zero external API calls or data harvesting.
- [x] **Interactive Dashboard** — Dynamic balance, income, expense calculation and cash flow cards.
- [x] **Savings Goals & Payment Dues** — Track target milestones, partial deposits, and recurring upcoming dues with date validation.
- [x] **AI Expense Assistant** — On-device smart financial chatbot with recent contextual memory (10 message history).
- [x] **Biometric Security** — Secure fingerprint and Face ID app protection backed by Expo SecureStore.
- [x] **Category Budgets** — Visual spending caps with green / amber / red alerts.
- [x] **Analytics & Charts** — Donut breakdowns and weekly spending distribution bars.
- [x] **Multi-Currency** — Indian Rupee (`₹` INR by default), USD (`$`), EUR (`€`), GBP (`£`), and more.
- [x] **Keyboard-Aware UI** — Modal cards dynamically glide above the keyboard for effortless typing.

---

## ✨ Features

<details open>
<summary><b>📊 1. Financial Dashboard & Real-Time Balance</b></summary>
<br>

- **Real-Time Summary**: Instant overview of your total balance, monthly income, and monthly expenses.
- **Cash Flow Overview**: Color-coded incoming vs. outgoing comparisons.
- **Recent Transactions Feed**: High-priority view of latest transactions with category icons and timestamps.
- **Quick Actions**: Instant access to log income or expense in one tap.

</details>

<details>
<summary><b>💳 2. Transaction Logging & Management</b></summary>
<br>

- **Expense vs. Income**: One-tap toggle between expense deductions and income credits.
- **Rich Categories**: Pre-loaded with essential categories (Food, Shopping, Transport, Utilities, Entertainment, Healthcare, Salary, Investments).
- **Custom Categories**: Add custom categories on the fly with distinct branding.
- **Integrated Calendar Picker**: Select any past or future transaction date.
- **Notes & Annotations**: Attach personal notes to keep full context of your spending.
- **Edit & Delete**: Full CRUD support with instant reactive recalculation of balances.

</details>

<details>
<summary><b>🎯 3. Smart Monthly Budgets</b></summary>
<br>

- **Category-Specific Caps**: Allocate individual monthly spending limits for each category.
- **Visual Progress Bars**: Animated indicators display remaining allowance and percentage spent.
- **Threshold Alerts**:
  - 🟢 **Safe**: < 75% budget spent.
  - 🟡 **Warning**: 75% - 99% budget utilized.
  - 🔴 **Over Budget**: 100%+ limit exceeded with deficit callouts.

</details>

<details>
<summary><b>📈 4. Visual Analytics & Charts</b></summary>
<br>

- **Category Distribution**: Interactive donut charts highlighting where most money goes.
- **Weekly Spend Trends**: Bar graph highlighting peak expenditure days throughout the week.
- **Month-Over-Month Comparison**: Track your savings rate and spending habits over time.
- **Search & Filters**: Filter records by date ranges, category, or transaction type.

</details>

<details>
<summary><b>⚙️ 5. Personalization & Data Controls</b></summary>
<br>

- **Profile Customization**: Choose your display name, username handle, and avatar photo from gallery.
- **Multi-Currency Switcher**: Toggle effortlessly between INR (`₹`), USD (`$`), EUR (`€`), GBP (`£`), JPY (`¥`), and CAD (`$`).
- **Theme Engine**: Midnight dark aesthetic with glassmorphic cards and light mode toggle.
- **Data Maintenance**:
  - *Clear Previous Months*: Clean historical records while keeping current month intact.
  - *Full Factory Reset*: Clean slate wipe in a single tap.

</details>

<details>
<summary><b>🎯 6. Savings Goals & Payment Dues</b></summary>
<br>

- **Target Milestones**: Create financial goals with target amounts, due dates, and custom categories.
- **Deposit Tracking**: Add contributions directly toward individual goals with instant visual progress bars.
- **Payment Dues**: Track upcoming bills and dues with strict past-date prevention safeguards.
- **In-App Reminder Center**: Direct notifications for approaching deadlines and dues.

</details>

<details>
<summary><b>🤖 7. On-Device AI Financial Assistant & Security</b></summary>
<br>

- **Smart Offline Assistant**: Ask questions about your spending patterns, highest expense categories, and budget health.
- **Contextual Memory**: Remembers your recent 10 messages stored locally in SQLite with zero cloud transmission.
- **Biometric App Lock**: Protect sensitive spending records using fingerprint or Face ID authentication with secure fallback.

</details>

---

## 🛠️ Tech Stack

<div align="center">

| Component | Technology | Description |
|:---|:---|:---|
| **Core Framework** | React Native 0.76+ / Expo SDK 52 | High performance cross-platform runtime |
| **Routing** | Expo Router | Native file-based navigation |
| **Language** | TypeScript 5.3+ | Strict static typing and code reliability |
| **Storage Engine** | Expo SQLite (`expo-sqlite`) | Local relational SQLite database with WAL mode |
| **Vector Graphics** | `react-native-svg` | Smooth resolution-independent charts |
| **Icons** | `@expo/vector-icons` | Ionicons vector icon set |
| **Media** | `expo-image-picker` | Native gallery image selection |

</div>

---

## 🗄️ Architecture & Database

<details>
<summary><b>Click to expand SQLite Schema & Query Design</b></summary>
<br>

All data is structured across three local tables with composite indexes for sub-millisecond lookups:

```sql
-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  category TEXT NOT NULL,
  note TEXT,
  date TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Composite Indexes for rapid filtering
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  UNIQUE(category, month, year)
);

-- App Settings & Preferences
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
```

</details>

---

## 🚀 Quick Start

<details open>
<summary><b>Installation & Running Locally</b></summary>
<br>

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or 20 LTS)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app installed on your smartphone (or an Android/iOS emulator)

### 1. Clone & Install
```bash
git clone https://github.com/THE-NIKHIL07/Expense-tracker.git
cd Expense-tracker
npm install
```

### 2. Start Development Server
```bash
npx expo start
```

### 3. Launch on Device
- Scan the printed QR code using the **Expo Go** app on Android or the Camera app on iOS.
- Press <kbd>a</kbd> in your terminal to launch directly on a connected Android device or emulator.
- Press <kbd>i</kbd> to launch on an iOS simulator.

</details>

---

## 📦 Building the APK

<details>
<summary><b>Option A: Local Android Gradle Build</b></summary>
<br>

Requires Android Studio & SDK installed on your machine:

```bash
# 1. Prebuild native android project
npx expo prebuild --platform android

# 2. Compile standalone release APK
cd android
./gradlew assembleRelease
```

Your compiled standalone `.apk` will be output to:
```text
android/app/build/outputs/apk/release/app-release.apk
```

> **Windows Tip**: If you encounter Windows MAX_PATH (260 character) limits during C++ Ninja compilation, create a junction (e.g., `mklink /J C:\et <project_path>`) and run Gradle from `C:\et\android`.

</details>

<details>
<summary><b>Option B: Cloud Build via EAS</b></summary>
<br>

Build directly in the cloud without needing Android Studio or Java SDK locally:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

</details>

---

## 🔒 Offline Guarantee & Privacy

```
┌──────────────────────────────────────────────────────────┐
│                   YOUR MOBILE DEVICE                     │
│                                                          │
│   ┌──────────────────┐          ┌────────────────────┐   │
│   │   React Native   │ ◄──────► │    Local SQLite    │   │
│   │     Expo App     │          │    Database file   │   │
│   └──────────────────┘          └────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                             X
                     No Remote Server
                     No Cloud Backup
                     No Tracking / Telemetry
```

- **Zero Cloud Leakage**: No network calls, analytics trackers, or user profiling.
- **Sandboxed Security**: Data resides strictly within your device's isolated application storage.
- **Airplane-Mode Ready**: Fully functional offline anytime, anywhere.

---

## 🤝 Contributing

Contributions and ideas are always welcome!

1. Fork this repository.
2. Create a feature branch: `git checkout -b feature/awesome-feature`
3. Commit your updates: `git commit -m "add awesome feature"`
4. Push to branch: `git push origin feature/awesome-feature`
5. Submit a Pull Request.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
