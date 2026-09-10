# Expense Tracker

[![React Native](https://img.shields.io/badge/React%20Native-0.76+-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2052-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(Local)-003B57.svg)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A clean, modern, and **100% offline-first** personal expense tracker mobile application built with **React Native**, **Expo**, **TypeScript**, and **local SQLite**.

Designed with a sleek midnight dark aesthetic, fluid gesture interactions, dynamic charts, and zero external tracking or cloud servers — your financial data never leaves your device.

---

## Table of Contents

- [Key Highlights](#key-highlights)
- [Detailed Features](#detailed-features)
  - [1. Dashboard & Net Balance](#1-dashboard--net-balance)
  - [2. Fast Transaction Logging](#2-fast-transaction-logging)
  - [3. Category-Wise Monthly Budgets](#3-category-wise-monthly-budgets)
  - [4. Analytics & Visual Breakdown](#4-analytics--visual-breakdown)
  - [5. Profile & Multi-Currency Settings](#5-profile--multi-currency-settings)
- [Architecture & Data Storage](#architecture--data-storage)
  - [Database Schema](#database-schema)
  - [Offline-First Reliability](#offline-first-reliability)
  - [Keyboard-Aware UI](#keyboard-aware-ui)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [Building the APK](#building-the-apk)
  - [Local Gradle Build](#local-gradle-build)
  - [EAS Cloud Build](#eas-cloud-build)
- [Privacy & Security](#privacy--security)
- [Contributing](#contributing)
- [License](#license)

---

## Key Highlights

- **100% Offline-First**: Stored locally on-device in SQLite (`expo-sqlite`) with WAL (Write-Ahead Logging) mode enabled.
- **Zero Data Collection**: No remote servers, no analytics beacons, no tracking, and no internet connection required.
- **Responsive Midnight Design**: Dark palette crafted with high-contrast text, glowing accent states, and light theme option.
- **Native Android & iOS Performance**: Fluid 60fps animations powered by React Native Reanimated and hardware acceleration.
- **Keyboard-Adaptive Inputs**: Bottom sheet modals and text fields dynamically avoid soft keyboards, keeping active inputs clearly visible while typing.

---

## Detailed Features

### 1. Dashboard & Net Balance
- Real-time calculation of **Total Balance**, **Monthly Income**, and **Monthly Expenses**.
- Clean financial summary card with cash flow indicators.
- Quick navigation to add income or expense transactions with one tap.
- Recent transactions feed with category badges, amounts, and dates.

### 2. Fast Transaction Logging
- Distinguish between **Expenses** and **Income** with an instant toggle.
- Pre-configured categories (Food & Dining, Shopping, Transport, Entertainment, Bills & Utilities, Healthcare, Salary, Investments, etc.) with custom color coding and vector icons.
- Add optional personal notes and custom transaction dates via an integrated calendar date picker.
- Add custom category names on the fly.
- Edit or delete transactions with instant balance recalculation.

### 3. Category-Wise Monthly Budgets
- Set monthly budget limits per category (e.g., Food, Groceries, Fuel).
- Visual progress bars showing percentage utilized and remaining allowance.
- Intelligent color-coded warning system:
  - **Green**: Healthy budget usage (< 75%).
  - **Yellow / Orange**: Approaching limit (75% - 99%).
  - **Red**: Budget exceeded with overdue deficit indicators.

### 4. Analytics & Visual Breakdown
- Interactive category expense distribution donut/pie chart.
- Day-by-day weekly spending bar charts to spot peak expenditure days.
- Month-over-month trend analysis to monitor savings and expense habits over time.
- Filter transactions by category, type, and custom date intervals.

### 5. Profile & Multi-Currency Settings
- **Custom Profile**: Update display name and username handle; pick a profile avatar photo directly from device gallery.
- **Multi-Currency Engine**: Default currency set to Indian Rupee (`₹` INR) with instant switching to USD (`$`), EUR (`€`), GBP (`£`), JPY (`¥`), CAD (`$`), AUD (`$`), and more.
- **Data Management Utilities**:
  - Clear historical months' data while retaining current month.
  - One-tap full factory reset for complete database wipe.

---

## Architecture & Data Storage

### Database Schema

All data is managed locally through `expo-sqlite` using parameterized SQL queries to prevent injection and corruption:

```sql
-- Transactions Table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  category TEXT NOT NULL,
  note TEXT,
  date TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Budgets Table
CREATE TABLE budgets (
  id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  UNIQUE(category, month, year)
);

-- App Settings Table
CREATE TABLE settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
```

### Offline-First Reliability
- **WAL Mode (`PRAGMA journal_mode = WAL;`)**: Ensures fast concurrent reads and writes without database locking.
- **Indexed Queries**: Composite indexes on `date`, `type`, `category`, and `month_year` ensure fast load times even with thousands of transactions.
- **Fresh Install Experience**: Starts with clean zero-balance state (no mock seed data) ready for immediate personal use.

### Keyboard-Aware UI
- All input cards and modals utilize `KeyboardAvoidingView` combined with scrollable containers and Android `statusBarTranslucent` dialog handling.
- Input fields automatically shift into the visible viewport above the keyboard when focused.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React Native 0.76+](https://reactnative.dev/) / [Expo SDK 52](https://expo.dev/) |
| **Navigation** | [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing) |
| **Language** | [TypeScript 5.3+](https://www.typescriptlang.org/) |
| **Local Storage** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (SQLite Engine) |
| **UI & Icons** | [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context), [@expo/vector-icons](https://icons.expo.fyi/) |
| **Graphics** | [react-native-svg](https://github.com/software-mansion/react-native-svg) |
| **Media** | [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/image-picker/) |

---

## Project Directory Structure

```text
├── app/                          # Expo Router navigation and screens
│   ├── (tabs)/                   # Bottom tab navigator
│   │   ├── index.tsx             # Dashboard & financial summary
│   │   ├── stats.tsx             # Analytics, charts, and distribution
│   │   ├── budget.tsx            # Monthly budget planner & limits
│   │   └── settings.tsx          # Profile, theme, currency, data tools
│   ├── add-transaction.tsx       # Expense & income entry modal
│   ├── transactions-list.tsx     # Full transaction history & search
│   ├── onboarding.tsx            # First-time launch welcome screen
│   └── _layout.tsx               # Root layout & providers
├── assets/                       # Adaptive app icons & splash screens
│   ├── icon.png                  # Master 1024x1024 app icon
│   ├── android-icon-foreground.png # Android adaptive icon foreground
│   ├── android-icon-background.png # Android adaptive icon background
│   └── splash-icon.png           # Splash screen branding
├── src/
│   ├── components/               # Custom UI components, charts & cards
│   ├── constants/                # Categories, theme palettes, icons
│   ├── context/                  # Global reactive state (ExpenseContext)
│   ├── db/                       # SQLite schema, queries, and repositories
│   ├── theme/                    # Light & dark theme palettes
│   └── utils/                    # Currency formatters & date helpers
├── app.json                      # Expo application configuration
├── package.json                  # Dependencies and build scripts
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## Getting Started

### Prerequisites

Make sure your development machine has:
- **Node.js** (v18 or v20 LTS recommended)
- **npm** or **yarn**
- **Expo Go** installed on your Android/iOS physical device, or an Android Studio / iOS simulator

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/THE-NIKHIL07/Expense-tracker.git
   cd Expense-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the Expo local development server:

```bash
npx expo start
```

- Press `a` in the terminal to open on a connected Android device / emulator.
- Press `i` to open on an iOS simulator.
- Scan the printed QR code with the **Expo Go** mobile app to run directly on your physical smartphone.

---

## Building the APK

### Local Gradle Build

If you have Android SDK and JDK configured locally:

1. Generate the native Android folder:
   ```bash
   npx expo prebuild --platform android
   ```

2. Build the release APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

The standalone release APK will be located at:
```text
android/app/build/outputs/apk/release/app-release.apk
```

> **Note for Windows builds**: If you encounter Windows MAX_PATH limitations during C++ Ninja compilation, create a junction (e.g. `mklink /J C:\et <project_path>`) and run Gradle from the shortened directory path.

### EAS Cloud Build

You can also build the APK in the cloud using Expo Application Services:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

---

## Privacy & Security

- **No Remote Network Requests**: The app operates entirely locally. No telemetry, third-party analytics, or background tracking services are included.
- **Local Storage Only**: Database entries remain strictly in your device's application sandbox storage.
- **Offline Reliability**: Works seamlessly in airplane mode or areas without cellular coverage.

---

## Contributing

Contributions, issues, and feature suggestions are welcome!

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/NewFeature`).
3. Commit your changes (`git commit -m "add new feature"`).
4. Push to the branch (`git push origin feature/NewFeature`).
5. Open a Pull Request.

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
