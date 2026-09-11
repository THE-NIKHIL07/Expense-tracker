import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useExpenses } from '../../src/context/ExpenseContext';
import { SpendingFlowBarChart } from '../../src/components/charts/SpendingFlowBarChart';
import { DailySpendingChart } from '../../src/components/charts/DailySpendingChart';
import { MonthlyTrendBarChart } from '../../src/components/charts/MonthlyTrendBarChart';
import { TimeframeSelector, Timeframe } from '../../src/components/TimeframeSelector';
import { formatCurrency } from '../../src/utils/currency';
import { formatDateISO, formatFriendlyDate, getDaysInMonth, MONTH_NAMES, MONTH_NAMES_SHORT } from '../../src/utils/date';
import { getCategoryMeta } from '../../src/constants/categories';
import { WeeklyDaySpending } from '../../src/db/repository';
import { DailyExpense, MonthlyTrendPoint, Transaction } from '../../src/db/schema';
import { DatePickerModal } from '../../src/components/common/DatePickerModal';
import { TopCategoriesList } from '../../src/components/stats/TopCategoriesList';
import { DateInspectionCard } from '../../src/components/stats/DateInspectionCard';

export default function StatisticsScreen() {
  const { currency, colors } = useTheme();
  const router = useRouter();
  const { transactions, selectedMonth, selectedYear } = useExpenses();
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const day = (new Date().getDay() + 6) % 7;
    return day;
  });

  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [customSelectedDate, setCustomSelectedDate] = useState<string | null>(null);

  const periodStats = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = (now.getDay() + 6) % 7;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const prevWeekStart = new Date(startOfWeek);
    prevWeekStart.setDate(startOfWeek.getDate() - 7);
    const prevWeekEnd = new Date(startOfWeek);
    prevWeekEnd.setDate(startOfWeek.getDate() - 1);

    const startWeekIso = formatDateISO(startOfWeek);
    const endWeekIso = formatDateISO(endOfWeek);
    const prevWeekStartIso = formatDateISO(prevWeekStart);
    const prevWeekEndIso = formatDateISO(prevWeekEnd);

    const mStr = String(selectedMonth).padStart(2, '0');
    const monthPrefix = `${selectedYear}-${mStr}`;
    const yearPrefix = `${selectedYear}`;

    let activeExpenses: Transaction[] = [];

    if (timeframe === 'week') {
      activeExpenses = transactions.filter(
        (t) => t.type === 'expense' && t.date >= startWeekIso && t.date <= endWeekIso
      );
    } else if (timeframe === 'month') {
      activeExpenses = transactions.filter(
        (t) => t.type === 'expense' && t.date.startsWith(monthPrefix)
      );
    } else {
      activeExpenses = transactions.filter(
        (t) => t.type === 'expense' && t.date.startsWith(yearPrefix)
      );
    }

    const totalExpense = activeExpenses.reduce((sum, t) => sum + t.amount, 0);

    const daysName = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const weekDays: WeeklyDaySpending[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const iso = formatDateISO(d);
      const dayAmount = transactions
        .filter((t) => t.type === 'expense' && t.date === iso)
        .reduce((sum, t) => sum + t.amount, 0);

      weekDays.push({
        day: daysName[i],
        date: iso,
        amount: dayAmount,
      });
    }

    const prevWeekExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date >= prevWeekStartIso && t.date <= prevWeekEndIso
    );
    const prevWeekTotal = prevWeekExpenses.reduce((sum, t) => sum + t.amount, 0);

    let weekPercentChange: number | null = null;
    if (prevWeekTotal > 0) {
      weekPercentChange = Math.round(((totalExpense - prevWeekTotal) / prevWeekTotal) * 100);
    }

    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const monthDaily: DailyExpense[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayIso = `${selectedYear}-${mStr}-${String(d).padStart(2, '0')}`;
      const dayTotal = activeExpenses
        .filter((t) => t.date === dayIso)
        .reduce((sum, t) => sum + t.amount, 0);

      monthDaily.push({
        day: d,
        date: dayIso,
        amount: dayTotal,
      });
    }

    const yearMonthly: MonthlyTrendPoint[] = [];
    for (let m = 1; m <= 12; m++) {
      const p = `${selectedYear}-${String(m).padStart(2, '0')}`;
      const expSum = transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(p))
        .reduce((sum, t) => sum + t.amount, 0);
      const incSum = transactions
        .filter((t) => t.type === 'income' && t.date.startsWith(p))
        .reduce((sum, t) => sum + t.amount, 0);

      yearMonthly.push({
        month: m,
        year: selectedYear,
        label: MONTH_NAMES_SHORT[m - 1],
        income: incSum,
        expense: expSum,
      });
    }

    const catMap = new Map<string, { displayName: string; amount: number; count: number }>();
    activeExpenses.forEach((t) => {
      const key = t.category.trim().toLowerCase();
      const existing = catMap.get(key) || { displayName: t.category.trim(), amount: 0, count: 0 };
      catMap.set(key, {
        displayName: existing.displayName,
        amount: existing.amount + t.amount,
        count: existing.count + 1,
      });
    });

    const categories = Array.from(catMap.values())
      .map((info) => ({
        category: info.displayName,
        amount: info.amount,
        count: info.count,
        percentage: totalExpense > 0 ? Math.round((info.amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalExpense,
      activeExpenses,
      weekDays,
      weekPercentChange,
      monthDaily,
      yearMonthly,
      categories,
    };
  }, [transactions, timeframe, selectedMonth, selectedYear]);

  const selectedDayItem = periodStats.weekDays[selectedDayIndex] || periodStats.weekDays[0];
  const selectedDayTransactions = periodStats.activeExpenses.filter(
    (t) => t.date === selectedDayItem?.date
  );

  const customDateTransactions = useMemo(() => {
    if (!customSelectedDate) return [];
    return transactions.filter(
      (t) => t.type === 'expense' && t.date === customSelectedDate
    );
  }, [transactions, customSelectedDate]);

  const customDateTotal = useMemo(() => {
    return customDateTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [customDateTransactions]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Statistics</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setCalendarModalVisible(true)}
          style={[
            styles.calendarBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            customSelectedDate !== null && styles.calendarBtnActive,
          ]}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={customSelectedDate !== null ? '#FFFFFF' : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TimeframeSelector selected={timeframe} onChange={setTimeframe} uppercase />

        {customSelectedDate && (
          <DateInspectionCard
            date={customSelectedDate}
            transactions={customDateTransactions}
            total={customDateTotal}
            onClose={() => setCustomSelectedDate(null)}
            onSelectTransaction={(id) =>
              router.push({ pathname: '/add-transaction', params: { editId: id } })
            }
          />
        )}

        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            {timeframe === 'week'
              ? 'THIS WEEK'
              : timeframe === 'month'
              ? `${MONTH_NAMES[selectedMonth - 1]?.toUpperCase()} ${selectedYear}`
              : `YEAR ${selectedYear}`}
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryAmount, { color: colors.text }]}>
              {formatCurrency(periodStats.totalExpense, currency.symbol)}
            </Text>
            {timeframe === 'week' && periodStats.weekPercentChange !== null && (
              <View
                style={[
                  styles.trendBadge,
                  {
                    backgroundColor:
                      periodStats.weekPercentChange > 0
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(52, 211, 153, 0.15)',
                  },
                ]}
              >
                <Ionicons
                  name={periodStats.weekPercentChange > 0 ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={periodStats.weekPercentChange > 0 ? '#EF4444' : '#34D399'}
                  style={{ marginRight: 2 }}
                />
                <Text
                  style={[
                    styles.trendText,
                    {
                      color: periodStats.weekPercentChange > 0 ? '#EF4444' : '#34D399',
                    },
                  ]}
                >
                  {Math.abs(periodStats.weekPercentChange)}% vs last week
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {timeframe === 'week'
                ? 'Spending Flow'
                : timeframe === 'month'
                ? 'Daily Expense Flow'
                : '12-Month Expense Trend'}
            </Text>
            {timeframe === 'week' && selectedDayItem && (
              <Text style={[styles.cardSubtitle, { color: colors.primary }]}>
                {selectedDayItem.day}: {formatCurrency(selectedDayItem.amount, currency.symbol)}
              </Text>
            )}
          </View>

          {timeframe === 'week' ? (
            <SpendingFlowBarChart
              data={periodStats.weekDays}
              selectedDayIndex={selectedDayIndex}
              onSelectDay={(_, idx) => setSelectedDayIndex(idx)}
            />
          ) : timeframe === 'month' ? (
            <DailySpendingChart data={periodStats.monthDaily} height={190} />
          ) : (
            <MonthlyTrendBarChart data={periodStats.yearMonthly} height={190} />
          )}
        </View>

        {timeframe === 'week' && selectedDayTransactions.length > 0 && (
          <View style={[styles.dayDetailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.dayDetailsHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.dayDetailsTitle, { color: colors.text }]}>
                {formatFriendlyDate(selectedDayItem.date)} ({selectedDayItem.day})
              </Text>
              <Text style={[styles.dayDetailsTotal, { color: colors.primary }]}>
                {formatCurrency(selectedDayItem.amount, currency.symbol)}
              </Text>
            </View>
            {selectedDayTransactions.map((tx) => {
              const meta = getCategoryMeta(tx.category, 'expense');
              return (
                <TouchableOpacity
                  key={tx.id}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({ pathname: '/add-transaction', params: { editId: tx.id } })
                  }
                  style={styles.dayTxRow}
                >
                  <View style={[styles.dayTxDot, { backgroundColor: meta.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dayTxCategory, { color: colors.text }]}>{tx.category}</Text>
                    {!!tx.note && <Text style={[styles.dayTxNote, { color: colors.textMuted }]}>{tx.note}</Text>}
                  </View>
                  <Text style={styles.dayTxAmount}>
                    -{formatCurrency(tx.amount, currency.symbol)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Categories</Text>
        <TopCategoriesList categories={periodStats.categories} />

        <View style={{ height: 40 }} />
      </ScrollView>

      <DatePickerModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={(d) => setCustomSelectedDate(d)}
        selectedDate={customSelectedDate || ''}
        title="Inspect Date Spending"
        allowFuture={false}
        allowPast={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F131D',
    borderWidth: 1,
    borderColor: '#192030',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBtnActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  summaryCard: {
    backgroundColor: '#0F131D',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#192030',
    padding: 18,
    marginTop: 8,
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#0F131D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#192030',
    padding: 20,
    marginVertical: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#388BFF',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayDetailsCard: {
    backgroundColor: '#0F131D',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#192030',
    padding: 16,
    marginBottom: 12,
  },
  dayDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#161C2A',
    marginBottom: 10,
  },
  dayDetailsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dayDetailsTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#388BFF',
  },
  dayTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayTxDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  dayTxCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  dayTxNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  dayTxAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FB7185',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 18,
    marginBottom: 12,
  },
});
