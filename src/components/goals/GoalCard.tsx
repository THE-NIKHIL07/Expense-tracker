import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../../db/schema';
import { useTheme } from '../../theme/ThemeContext';
import { formatCurrency } from '../../utils/currency';

interface GoalCardProps {
  goal: Goal;
  onDeposit: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  calculateDaysRemaining: (dueDateStr: string) => number;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onDeposit,
  onEdit,
  onDelete,
  calculateDaysRemaining,
}) => {
  const { colors, currency } = useTheme();

  const daysLeft = calculateDaysRemaining(goal.due_date);
  const percent = Math.min(Math.round((goal.saved_amount / goal.target_amount) * 100), 100);
  const isDueSoon = daysLeft <= 7 && daysLeft >= 0;
  const isOverdue = daysLeft < 0;
  const isPaymentDue = goal.category === 'Payment Due';

  return (
    <View
      style={[
        styles.goalCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.goalTopRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: isPaymentDue
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(16, 185, 129, 0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  { color: isPaymentDue ? '#EF4444' : '#10B981' },
                ]}
              >
                {isPaymentDue ? 'PAYMENT DUE' : 'SAVING GOAL'}
              </Text>
            </View>
          </View>

          <Text style={[styles.goalTitle, { color: colors.text }]} numberOfLines={1}>
            {goal.title}
          </Text>
          <Text style={[styles.goalDueDate, { color: colors.textMuted }]}>
            Deadline: {goal.due_date}
          </Text>
        </View>

        <View
          style={[
            styles.daysBadge,
            {
              backgroundColor: isOverdue
                ? 'rgba(239, 68, 68, 0.15)'
                : isDueSoon
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(56, 189, 248, 0.15)',
            },
          ]}
        >
          <Text
            style={[
              styles.daysBadgeText,
              {
                color: isOverdue ? '#EF4444' : daysLeft === 0 ? '#F59E0B' : isDueSoon ? '#F59E0B' : '#38BDF8',
              },
            ]}
          >
            {isOverdue ? 'Overdue' : daysLeft === 0 ? 'Due Today' : `${daysLeft}d left`}
          </Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <Text style={[styles.savedAmount, { color: colors.text }]}>
          {formatCurrency(goal.saved_amount, currency.symbol)}
          <Text style={[styles.targetAmount, { color: colors.textSecondary }]}>
            {' '}/ {formatCurrency(goal.target_amount, currency.symbol)}
          </Text>
        </Text>
        <Text style={[styles.percentText, { color: isPaymentDue ? '#EF4444' : colors.primary }]}>
          {percent}%
        </Text>
      </View>

      <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceElevated }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${percent}%`,
              backgroundColor: isPaymentDue ? '#EF4444' : colors.primary,
            },
          ]}
        />
      </View>

      <View style={styles.goalActions}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onDeposit(goal)}
          style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <Ionicons
            name={isPaymentDue ? 'card-outline' : 'wallet-outline'}
            size={15}
            color={colors.primary}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {isPaymentDue ? 'Pay Amount' : 'Add Deposit'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onEdit(goal)}
          style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <Ionicons name="pencil-outline" size={15} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onDelete(goal.id)}
          style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <Ionicons name="trash-outline" size={15} color="#EF4444" style={{ marginRight: 4 }} />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  goalCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 5,
  },
  goalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  goalDueDate: {
    fontSize: 12,
  },
  daysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  targetAmount: {
    fontSize: 13,
    fontWeight: '500',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
