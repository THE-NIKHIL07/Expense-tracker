import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useExpenses } from '../../src/context/ExpenseContext';
import { BalanceCard } from '../../src/components/BalanceCard';
import { MonthlySpendingDonut } from '../../src/components/charts/MonthlySpendingDonut';
import { TransactionCard } from '../../src/components/TransactionCard';
import { EmptyState } from '../../src/components/EmptyState';
import { TimeframeSelector, Timeframe } from '../../src/components/TimeframeSelector';
import { MONTH_NAMES, formatDateISO } from '../../src/utils/date';
import { Transaction } from '../../src/db/schema';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const {
    transactions,
    summary,
    recentTransactions,
    categorySpending,
    deleteTransaction,
    selectedMonth,
    selectedYear,
  } = useExpenses();
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<Timeframe>('week');

  const monthName = MONTH_NAMES[selectedMonth - 1] || 'December';

  const periodData = useMemo(() => {
    const now = new Date();
    let filtered = transactions;

    if (timeframe === 'week') {
      const dayOfWeek = (now.getDay() + 6) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startIso = formatDateISO(start);
      const endIso = formatDateISO(end);
      filtered = transactions.filter((t) => t.date >= startIso && t.date <= endIso);
    } else if (timeframe === 'month') {
      const mStr = String(selectedMonth).padStart(2, '0');
      const prefix = `${selectedYear}-${mStr}`;
      filtered = transactions.filter((t) => t.date.startsWith(prefix));
    } else if (timeframe === 'year') {
      const prefix = `${selectedYear}`;
      filtered = transactions.filter((t) => t.date.startsWith(prefix));
    }

    const income = filtered
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filtered
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const catMap = new Map<string, number>();
    filtered
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
      });

    const cats = Array.from(catMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      count: filtered.filter((t) => t.category === category).length,
      percentage: expense > 0 ? Math.round((amount / expense) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    return {
      income: timeframe === 'week' || timeframe === 'month' ? income : summary.totalIncome,
      expense: timeframe === 'week' || timeframe === 'month' ? expense : summary.totalExpenses,
      balance: summary.totalBalance,
      categories: cats.length > 0 ? cats : categorySpending,
    };
  }, [transactions, timeframe, summary, selectedMonth, selectedYear, categorySpending]);

  const handleTransactionPress = (tx: Transaction) => {
    router.push({ pathname: '/add-transaction', params: { editId: tx.id } });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.dashboardTitle, { color: colors.text }]}>Dashboard</Text>
          <Text style={[styles.dateSubtitle, { color: colors.textSecondary }]}>
            {monthName} {selectedYear}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <BalanceCard
          totalBalance={periodData.balance}
          totalIncome={periodData.income}
          totalExpenses={periodData.expense}
        />

        <TimeframeSelector selected={timeframe} onChange={setTimeframe} />

        <View
          style={[
            styles.spendingCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {timeframe === 'week'
                ? 'Weekly Spending'
                : timeframe === 'month'
                ? 'Monthly Spending'
                : 'Yearly Spending'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/stats')}>
              <Text style={styles.detailsLink}>Details &gt;</Text>
            </TouchableOpacity>
          </View>

          <MonthlySpendingDonut data={periodData.categories} />
        </View>

        <View style={styles.transactionsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Transactions
          </Text>
          {recentTransactions.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/transactions-list')}>
              <Text style={styles.detailsLink}>View All &gt;</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentTransactions.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Start tracking your spending to understand where your money goes."
            buttonTitle="Add your first expense"
            onButtonPress={() => router.push('/add-transaction')}
          />
        ) : (
          recentTransactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              onPress={() => handleTransactionPress(tx)}
              onDelete={() => deleteTransaction(tx.id)}
            />
          ))
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/add-transaction')}
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dashboardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  dateSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  spendingCard: {
    backgroundColor: '#0F131D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#192030',
    padding: 20,
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  detailsLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#388BFF',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
});
