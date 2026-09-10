import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { CategorySpending } from '../../db/schema';
import { useTheme } from '../../theme/ThemeContext';
import { categoryColors } from '../../theme/colors';
import { formatCompactCurrency } from '../../utils/currency';

interface MonthlySpendingDonutProps {
  data: CategorySpending[];
  size?: number;
  strokeWidth?: number;
}

export const MonthlySpendingDonut: React.FC<MonthlySpendingDonutProps> = ({
  data,
  size = 180,
  strokeWidth = 20,
}) => {
  const { colors, currency } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  const totalSpent = data.reduce((sum, item) => sum + item.amount, 0);

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (
    x: number,
    y: number,
    r: number,
    startAngle: number,
    endAngle: number
  ) => {
    if (endAngle - startAngle >= 359.9) {
      endAngle = 359.99;
    }
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    ].join(' ');
  };

  let currentAngle = 0;
  const gapAngle = data.length > 1 ? 3 : 0;

  const segments = data.map((item) => {
    const itemColor = categoryColors[item.category]?.color || colors.primary;
    const sweep = (item.percentage / 100) * 360;
    const startAngle = currentAngle + gapAngle / 2;
    const endAngle = currentAngle + sweep - gapAngle / 2;
    currentAngle += sweep;

    const path = describeArc(center, center, radius, startAngle, Math.max(startAngle + 0.1, endAngle));

    return {
      category: item.category,
      color: itemColor,
      path,
    };
  });

  const legendList = data.length > 0 ? data.slice(0, 4) : [
    { category: 'Food', color: '#10B981' },
    { category: 'Transport', color: '#F97316' },
    { category: 'Shopping', color: '#EC4899' },
    { category: 'Bills', color: '#0066FF' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.borderSubtle}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {totalSpent > 0 &&
            segments.map((seg, idx) => (
              <Path
                key={`donut-seg-${idx}`}
                d={seg.path}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            ))}
        </Svg>

        <View style={styles.centerOverlay}>
          <Text style={[styles.centerAmount, { color: colors.text }]}>
            {formatCompactCurrency(totalSpent, currency.symbol)}
          </Text>
          <Text style={[styles.centerSub, { color: colors.textMuted }]}>SPENT</Text>
        </View>
      </View>

      <View style={styles.legendGrid}>
        {legendList.map((item, idx) => {
          const color = (item as any).color || categoryColors[item.category]?.color || colors.primary;
          return (
            <View key={`leg-${idx}`} style={styles.legendCol}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={[styles.legendName, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.category}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  centerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 2,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 20,
    rowGap: 10,
  },
  legendCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '46%',
    gap: 8,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
