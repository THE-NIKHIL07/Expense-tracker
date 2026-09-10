import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
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
import { categoryColors } from '../../src/theme/colors';
import { getCategoryMeta } from '../../src/constants/categories';
import { formatCurrency } from '../../src/utils/currency';
import { formatDateISO, formatFriendlyDate, getDaysInMonth, MONTH_NAMES, MONTH_NAMES_SHORT } from '../../src/utils/date';
import { WeeklyDaySpending } from '../../src/db/repository';
import { DailyExpense, MonthlyTrendPoint, Transaction } from '../../src/db/schema';

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
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);

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

  const daysInCalMonth = getDaysInMonth(calendarMonth, calendarYear);
  const calendarDays = Array.from({ length: daysInCalMonth }, (_, i) => i + 1);

  const calMonthPrefix = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}`;
  const expenseDateSet = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.type === 'expense' && t.date.startsWith(calMonthPrefix)) {
        set.add(t.date);
      }
    });
    return set;
  }, [transactions, calMonthPrefix]);

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
          <View
            style={[
              styles.dateInspectionCard,
              { backgroundColor: colors.surface, borderColor: colors.primary },
            ]}
          >
            <View style={styles.dateInspectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateInspectionLabel}>DATE SPENDING</Text>
                <Text style={[styles.dateInspectionTitle, { color: colors.text }]}>
                  {formatFriendlyDate(customSelectedDate)} ({customSelectedDate})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCustomSelectedDate(null)}
                style={styles.closeDateBtn}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInspectionTotalRow}>
              <Text style={[styles.dateInspectionTotalText, { color: colors.text }]}>
                {formatCurrency(customDateTotal, currency.symbol)}
              </Text>
              <Text style={styles.dateInspectionTxCount}>
                {customDateTransactions.length} {customDateTransactions.length === 1 ? 'expense' : 'expenses'}
              </Text>
            </View>

            {customDateTransactions.length === 0 ? (
              <Text style={styles.noTxText}>No expenses recorded on this date.</Text>
            ) : (
              customDateTransactions.map((tx) => {
                const catColor = categoryColors[tx.category]?.color || '#0066FF';
                return (
                  <TouchableOpacity
                    key={tx.id}
                    activeOpacity={0.75}
                    onPress={() =>
                      router.push({ pathname: '/add-transaction', params: { editId: tx.id } })
                    }
                    style={styles.inspectionTxRow}
                  >
                    <View style={[styles.inspectionTxIconBox, { backgroundColor: `${catColor}20` }]}>
                      <Ionicons
                        name={
                          tx.category.toLowerCase().includes('food')
                            ? 'fast-food'
                            : tx.category.toLowerCase().includes('transit') ||
                              tx.category.toLowerCase().includes('transport')
                            ? 'car'
                            : tx.category.toLowerCase().includes('shop')
                            ? 'bag-handle'
                            : tx.category.toLowerCase().includes('bill')
                            ? 'receipt'
                            : tx.category.toLowerCase().includes('health')
                            ? 'medkit'
                            : tx.category.toLowerCase().includes('home')
                            ? 'home'
                            : tx.category.toLowerCase().includes('edu')
                            ? 'school'
                            : 'cash'
                        }
                        size={18}
                        color={catColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inspectionTxCategory}>{tx.category}</Text>
                      {!!tx.note && <Text style={styles.inspectionTxNote}>{tx.note}</Text>}
                    </View>
                    <Text style={styles.inspectionTxAmount}>
                      -{formatCurrency(tx.amount, currency.symbol)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
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

        {periodStats.categories.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No expenses recorded for this period</Text>
          </View>
        ) : (
          periodStats.categories.map((cat, idx) => {
            const meta = getCategoryMeta(cat.category, 'expense');

            return (
              <View key={`cat-${idx}`} style={[styles.catCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.catTopRow}>
                  <View style={styles.catLeft}>
                    <View style={[styles.catIconBox, { backgroundColor: meta.bg }]}>
                      <Ionicons
                        name={meta.icon as any}
                        size={20}
                        color={meta.color}
                      />
                    </View>
                    <View>
                      <Text style={[styles.catName, { color: colors.text }]}>{cat.category}</Text>
                      <Text style={[styles.catSub, { color: colors.textMuted }]}>
                        {cat.percentage}% · {cat.count} {cat.count === 1 ? 'expense' : 'expenses'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.catRight}>
                    <Text style={[styles.catAmount, { color: colors.text }]}>
                      {formatCurrency(cat.amount, currency.symbol, true)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.track, { backgroundColor: colors.surfaceElevated }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.min(cat.percentage, 100)}%`,
                        backgroundColor: meta.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Inspect Date Spending</Text>
              <TouchableOpacity onPress={() => setCalendarModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickDateRow}>
              <TouchableOpacity
                onPress={() => {
                  const today = formatDateISO(new Date());
                  setCustomSelectedDate(today);
                  setCalendarModalVisible(false);
                }}
                style={[
                  styles.quickDateBtn,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  customSelectedDate === formatDateISO(new Date()) && styles.quickDateBtnActive,
                ]}
              >
                <Text style={[styles.quickDateText, { color: colors.text }]}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setCustomSelectedDate(formatDateISO(d));
                  setCalendarModalVisible(false);
                }}
                style={[styles.quickDateBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              >
                <Text style={[styles.quickDateText, { color: colors.text }]}>Yesterday</Text>
              </TouchableOpacity>

              {customSelectedDate && (
                <TouchableOpacity
                  onPress={() => {
                    setCustomSelectedDate(null);
                    setCalendarModalVisible(false);
                  }}
                  style={[styles.quickDateBtn, { backgroundColor: colors.surfaceElevated, borderColor: '#EF4444' }]}
                >
                  <Text style={[styles.quickDateText, { color: '#EF4444' }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.monthNavRow}>
              <TouchableOpacity
                onPress={() => {
                  if (calendarMonth === 1) {
                    setCalendarMonth(12);
                    setCalendarYear((y) => y - 1);
                  } else {
                    setCalendarMonth((m) => m - 1);
                  }
                }}
                style={[styles.navBtn, { backgroundColor: colors.surfaceElevated }]}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.monthNavTitle, { color: colors.text }]}>
                {MONTH_NAMES[calendarMonth - 1]} {calendarYear}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (calendarMonth === 12) {
                    setCalendarMonth(1);
                    setCalendarYear((y) => y + 1);
                  } else {
                    setCalendarMonth((m) => m + 1);
                  }
                }}
                style={[styles.navBtn, { backgroundColor: colors.surfaceElevated }]}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((d) => {
                const mStr = String(calendarMonth).padStart(2, '0');
                const dStr = String(d).padStart(2, '0');
                const fullIso = `${calendarYear}-${mStr}-${dStr}`;
                const isSelected = customSelectedDate === fullIso;
                const hasExpenses = expenseDateSet.has(fullIso);

                return (
                  <TouchableOpacity
                    key={`cal-day-${d}`}
                    onPress={() => {
                      setCustomSelectedDate(fullIso);
                      setCalendarModalVisible(false);
                    }}
                    style={[
                      styles.dayCell,
                      { backgroundColor: colors.surfaceElevated },
                      isSelected && styles.dayCellActive,
                      hasExpenses && !isSelected && styles.dayCellWithExpenses,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        { color: colors.textSecondary },
                        isSelected && { color: '#FFFFFF', fontWeight: '800' },
                        hasExpenses && !isSelected && { color: '#388BFF', fontWeight: '700' },
                      ]}
                    >
                      {d}
                    </Text>
                    {hasExpenses && !isSelected && (
                      <View style={styles.calendarExpenseDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
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
  catCard: {
    backgroundColor: '#0F131D',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#192030',
    padding: 16,
    marginVertical: 6,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  catSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  catRight: {
    alignItems: 'flex-end',
  },
  catAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  track: {
    height: 6,
    backgroundColor: '#161C2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyCard: {
    backgroundColor: '#0F131D',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#192030',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  dateInspectionCard: {
    backgroundColor: '#0F131D',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#388BFF',
    padding: 18,
    marginTop: 10,
    marginBottom: 10,
  },
  dateInspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateInspectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#388BFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  dateInspectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeDateBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161C2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInspectionTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161C2A',
  },
  dateInspectionTotalText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dateInspectionTxCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  noTxText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
    fontStyle: 'italic',
  },
  inspectionTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#121622',
  },
  inspectionTxIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inspectionTxCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inspectionTxNote: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  inspectionTxAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FB7185',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F131D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#1E2536',
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickDateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1E2536',
  },
  quickDateBtnActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  quickDateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121622',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#121622',
    position: 'relative',
  },
  dayCellActive: {
    backgroundColor: '#0066FF',
  },
  dayCellWithExpenses: {
    borderColor: '#388BFF',
    borderWidth: 1,
  },
  dayCellText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  calendarExpenseDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#388BFF',
  },
});
