# Expense Tracker

A modern, fast, and 100% offline-first personal expense tracker mobile application built with React Native, Expo, TypeScript, and local SQLite.

Designed with a sleek midnight aesthetic, real-time analytics, and zero external tracking or cloud dependencies — your financial data stays completely on your device.

---

## Features

- **100% Offline & Private**: All transactions, budgets, and settings are stored locally on your device in SQLite (`expo-sqlite`). No sign-ups, no remote servers, no data collection.
- **Interactive Financial Dashboard**:
  - Net balance, total income, and total expenses overview.
  - Interactive category spending breakdown and visual charts.
  - Recent transactions list with quick-action management.
- **Expense & Income Logging**:
  - Log expenses and income with custom categories, dates, and notes.
  - Categorized tagging with icons and colors.
  - Edit or delete past entries at any time.
- **Monthly Budget Planning**:
  - Set category-specific monthly spending caps.
  - Visual progress indicators showing remaining budget and percentage utilized.
  - Warning badges when spending exceeds set limits.
- **Multi-Currency Support**:
  - Configurable default currencies including Indian Rupee (`₹` INR by default), US Dollar (`$`), Euro (`€`), British Pound (`£`), Japanese Yen (`¥`), and more.
- **Personalized Profile**:
  - Customizable display name, handle, and avatar photo stored locally.
- **Keyboard-Friendly UI**:
  - Soft-keyboard-aware modal overlays ensuring input fields remain visible and aligned while typing.

---

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Local Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Vector Icons**: [@expo/vector-icons](https://icons.expo.fyi/) (Ionicons)
- **Vector Graphics**: [react-native-svg](https://github.com/software-mansion/react-native-svg)

---

## Project Structure

```text
├── app/                      # Expo Router screens and layouts
│   ├── (tabs)/               # Bottom tab navigation
│   │   ├── index.tsx         # Dashboard / Home
│   │   ├── stats.tsx         # Analytics and spending charts
│   │   ├── budget.tsx        # Budget planning and tracking
│   │   └── settings.tsx      # Preferences, profile, and currencies
│   ├── add-transaction.tsx   # Transaction creation/edit screen
│   ├── transactions-list.tsx # Filterable transaction history
│   └── _layout.tsx           # Root navigation layout
├── assets/                   # App icons, splash screens, and adaptive icons
├── src/
│   ├── components/           # Reusable UI components and charts
│   ├── constants/            # Category mappings, theme colors, and icons
│   ├── context/              # Global state (ExpenseContext)
│   ├── db/                   # SQLite schema, queries, and repositories
│   ├── theme/                # Light/Dark mode and currency definitions
│   └── utils/                # Date formatting and currency calculations
└── package.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app on your mobile device (or an Android/iOS emulator)

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

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Scan the QR code using Expo Go on Android or the Camera app on iOS to run the app.

---

## Building Standalone APK

To generate a standalone Android release APK locally:

```bash
# Prebuild Android native folder (if not already present)
npx expo run:android --variant release
```

Or via Gradle directly:

```bash
cd android
./gradlew assembleRelease
```

The output `.apk` file will be generated in:
`android/app/build/outputs/apk/release/app-release.apk`

---

## License

This project is licensed under the MIT License.
