import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { formatCurrency } from '../../utils/currency';

interface BudgetProgressRingProps {
  totalBudget: number;
  totalSpent: number;
  size?: number;
  strokeWidth?: number;
}

export const BudgetProgressRing: React.FC<BudgetProgressRingProps> = ({
  totalBudget,
  totalSpent,
  size = 170,
  strokeWidth = 16,
}) => {
  const { colors, currency } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  let progressColor = colors.income;
  let statusText = 'On Track';
  if (percentage >= 100) {
    progressColor = colors.expense;
    statusText = 'Over Budget';
  } else if (percentage >= 80) {
    progressColor = colors.warning;
    statusText = 'Approaching Limit';
  }

  const remaining = Math.max(totalBudget - totalSpent, 0);

  return (
    <View style={styles.container}>
      <View style={styles.ringWrapper}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.borderSubtle}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {totalBudget > 0 && (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={progressColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${center} ${center})`}
            />
          )}
        </Svg>

        <View style={styles.centerTextContainer}>
          <Text style={[styles.percentNumber, { color: colors.text }]}>
            {Math.round(percentage)}%
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${progressColor}20` }]}>
            <Text style={[styles.statusBadgeText, { color: progressColor }]}>
              {statusText}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.statsRow, { borderColor: colors.borderSubtle }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Budget</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatCurrency(totalBudget, currency.symbol)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Spent</Text>
          <Text style={[styles.statValue, { color: colors.expense }]}>
            {formatCurrency(totalSpent, currency.symbol)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Left</Text>
          <Text style={[styles.statValue, { color: colors.income }]}>
            {formatCurrency(remaining, currency.symbol)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 24,
  },
});
