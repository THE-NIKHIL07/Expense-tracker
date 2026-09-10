import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MonthlyTrendPoint } from '../../db/schema';
import { useTheme } from '../../theme/ThemeContext';
import { formatCompactCurrency } from '../../utils/currency';

interface MonthlyTrendBarChartProps {
  data: MonthlyTrendPoint[];
  height?: number;
  width?: number;
}

export const MonthlyTrendBarChart: React.FC<MonthlyTrendBarChartProps> = ({
  data,
  height = 180,
  width: propWidth,
}) => {
  const { colors, currency } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = propWidth || screenWidth - 48;

  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 28;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.expense, d.income)),
    0
  );
  const displayMax = maxVal > 0 ? maxVal * 1.2 : 1000;

  const groupWidth = innerWidth / (data.length || 1);
  const barWidth = Math.min(groupWidth * 0.32, 14);

  const yTicks = [0, displayMax / 2, displayMax];

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.expense} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.expense} stopOpacity="0.5" />
          </LinearGradient>
          <LinearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.income} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.income} stopOpacity="0.5" />
          </LinearGradient>
          <LinearGradient id="activeMonthGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {yTicks.map((tick, i) => {
          const y = paddingTop + innerHeight - (tick / displayMax) * innerHeight;
          return (
            <React.Fragment key={`trend-grid-${i}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke={colors.borderSubtle}
                strokeDasharray={i === 0 ? undefined : '3 3'}
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 6}
                y={y + 3}
                fill={colors.textMuted}
                fontSize={10}
                textAnchor="end"
              >
                {formatCompactCurrency(tick, currency.symbol)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {data.map((point, index) => {
          const groupCenter = paddingLeft + (index + 0.5) * groupWidth;
          const isLatest = index === data.length - 1;

          const incomeHeight = (point.income / displayMax) * innerHeight;
          const incomeY = paddingTop + innerHeight - incomeHeight;
          const incomeX = groupCenter - barWidth - 2;

          const expenseHeight = (point.expense / displayMax) * innerHeight;
          const expenseY = paddingTop + innerHeight - expenseHeight;
          const expenseX = groupCenter + 2;

          return (
            <React.Fragment key={`trend-group-${index}`}>
              {point.income > 0 && (
                <Rect
                  x={incomeX}
                  y={incomeY}
                  width={barWidth}
                  height={incomeHeight}
                  fill="url(#incomeBarGrad)"
                  rx={3}
                  ry={3}
                />
              )}

              {point.expense > 0 && (
                <Rect
                  x={expenseX}
                  y={expenseY}
                  width={barWidth}
                  height={expenseHeight}
                  fill={isLatest ? 'url(#activeMonthGrad)' : 'url(#expenseBarGrad)'}
                  rx={3}
                  ry={3}
                />
              )}

              <SvgText
                x={groupCenter}
                y={height - 8}
                fill={isLatest ? colors.primaryLight : colors.textMuted}
                fontSize={11}
                fontWeight={isLatest ? '700' : '500'}
                textAnchor="middle"
              >
                {point.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Expense</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendLabel, { color: colors.primaryLight }]}>Current</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 4,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
