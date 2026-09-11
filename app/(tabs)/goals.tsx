import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useExpenses } from '../../src/context/ExpenseContext';
import { GoalsSection } from '../../src/components/GoalsSection';
import { formatCurrency } from '../../src/utils/currency';

export default function GoalsScreen() {
  const { colors, currency } = useTheme();
  const { goals, addGoal, updateGoal, deleteGoal } = useExpenses();

  const savingsGoals = goals.filter((g) => g.category !== 'Payment Due' && g.status !== 'completed');
  const duesGoals = goals.filter((g) => g.category === 'Payment Due' && g.status !== 'completed');

  const totalSavingsTarget = savingsGoals.reduce((acc, g) => acc + g.target_amount, 0);
  const totalSavingsSaved = savingsGoals.reduce((acc, g) => acc + g.saved_amount, 0);
  const savingsProgress = totalSavingsTarget > 0 ? Math.round((totalSavingsSaved / totalSavingsTarget) * 100) : 0;

  const totalDuesTarget = duesGoals.reduce((acc, g) => acc + g.target_amount, 0);
  const totalDuesPaid = duesGoals.reduce((acc, g) => acc + g.saved_amount, 0);
  const totalDuesPending = Math.max(0, totalDuesTarget - totalDuesPaid);
  const duesProgress = totalDuesTarget > 0 ? Math.round((totalDuesPaid / totalDuesTarget) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Goals & Deadlines</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          Track savings targets and upcoming payment due dates
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.overviewCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.overviewTop}>
            <View>
              <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>
                TOTAL SAVINGS ACCUMULATED
              </Text>
              <Text style={[styles.overviewAmount, { color: '#10B981' }]}>
                {formatCurrency(totalSavingsSaved, currency.symbol)}
              </Text>
            </View>
            <View style={[styles.progressCircleBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
              <Text style={[styles.progressCircleText, { color: '#10B981' }]}>{savingsProgress}%</Text>
            </View>
          </View>

          <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceElevated }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(savingsProgress, 100)}%`, backgroundColor: '#10B981' },
              ]}
            />
          </View>

          <View style={styles.overviewBottom}>
            <Text style={[styles.targetInfo, { color: colors.textSecondary }]}>
              Target: {formatCurrency(totalSavingsTarget, currency.symbol)}
            </Text>
            <Text style={[styles.activeCount, { color: '#10B981' }]}>
              {savingsGoals.length} Active Goal{savingsGoals.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.overviewCard,
            { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 4 },
          ]}
        >
          <View style={styles.overviewTop}>
            <View>
              <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>
                TOTAL DUES PENDING
              </Text>
              <Text style={[styles.overviewAmount, { color: '#EF4444' }]}>
                {formatCurrency(totalDuesPending, currency.symbol)}
              </Text>
            </View>
            <View style={[styles.progressCircleBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Text style={[styles.progressCircleText, { color: '#EF4444' }]}>{duesProgress}%</Text>
            </View>
          </View>

          <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceElevated }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(duesProgress, 100)}%`, backgroundColor: '#EF4444' },
              ]}
            />
          </View>

          <View style={styles.overviewBottom}>
            <Text style={[styles.targetInfo, { color: colors.textSecondary }]}>
              Total Bill: {formatCurrency(totalDuesTarget, currency.symbol)}
            </Text>
            <Text style={[styles.activeCount, { color: '#EF4444' }]}>
              {duesGoals.length} Pending Due{duesGoals.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <GoalsSection
          goals={goals}
          onAddGoal={addGoal}
          onUpdateGoal={updateGoal}
          onDeleteGoal={deleteGoal}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  overviewCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginVertical: 12,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  overviewAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  progressCircleBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  overviewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetInfo: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeCount: {
    fontSize: 12,
    fontWeight: '700',
  },
});
