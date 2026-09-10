import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';
import { DailyExpense } from '../../db/schema';
import { useTheme } from '../../theme/ThemeContext';
import { formatCompactCurrency, formatCurrency } from '../../utils/currency';

interface DailySpendingChartProps {
  data: DailyExpense[];
  height?: number;
  width?: number;
}

export const DailySpendingChart: React.FC<DailySpendingChartProps> = ({
  data,
  height = 180,
  width: propWidth,
}) => {
  const { colors, currency } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = propWidth || screenWidth - 48; 
  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 28;
  const paddingBottom = 28;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height, backgroundColor: colors.surfaceSubtle }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No spending data available
        </Text>
      </View>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount), 0);
  const displayMax = maxAmount > 0 ? maxAmount * 1.15 : 1000;

  let peakIndex = -1;
  let peakAmount = 0;
  data.forEach((d, idx) => {
    if (d.amount > peakAmount) {
      peakAmount = d.amount;
      peakIndex = idx;
    }
  });

  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1 || 1)) * innerWidth;
    const y = paddingTop + innerHeight - (d.amount / displayMax) * innerHeight;
    return { x, y, amount: d.amount, day: d.day };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`;

  const yTicks = [0, displayMax / 2, displayMax];

  const xTickIndices = [0, 4, 9, 14, 19, 24, data.length - 1].filter(
    (idx) => idx < data.length
  );

  return (
    <View style={styles.container}>
      {peakIndex !== -1 && peakAmount > 0 && (
        <View style={[styles.peakBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={[styles.peakDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.peakText, { color: colors.textSecondary }]}>
            Peak: <Text style={{ color: colors.accent, fontWeight: '700' }}>{formatCurrency(peakAmount, currency.symbol)}</Text> (Day {data[peakIndex].day})
          </Text>
        </View>
      )}

      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.45" />
            <Stop offset="80%" stopColor={colors.primary} stopOpacity="0.05" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {yTicks.map((tick, i) => {
          const y = paddingTop + innerHeight - (tick / displayMax) * innerHeight;
          return (
            <React.Fragment key={`grid-${i}`}>
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

        {maxAmount > 0 && <Path d={areaD} fill="url(#spendingGradient)" />}

        <Path
          d={pathD}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {peakIndex !== -1 && peakAmount > 0 && (
          <>
            <Circle
              cx={points[peakIndex].x}
              cy={points[peakIndex].y}
              r={7}
              fill={colors.primaryGlow}
            />
            <Circle
              cx={points[peakIndex].x}
              cy={points[peakIndex].y}
              r={4}
              fill={colors.accent}
              stroke={colors.surface}
              strokeWidth={2}
            />
          </>
        )}

        {}
        {xTickIndices.map((idx) => {
          const p = points[idx];
          return (
            <SvgText
              key={`xlabel-${idx}`}
              x={p.x}
              y={height - 8}
              fill={colors.textMuted}
              fontSize={10}
              textAnchor="middle"
            >
              {p.day}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 6,
  },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  peakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  peakText: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 13,
  },
});
