import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WeeklyDaySpending } from '../../db/repository';
import { useTheme } from '../../theme/ThemeContext';

interface SpendingFlowBarChartProps {
  data: WeeklyDaySpending[];
  selectedDayIndex?: number;
  onSelectDay?: (item: WeeklyDaySpending, index: number) => void;
}

export const SpendingFlowBarChart: React.FC<SpendingFlowBarChartProps> = ({
  data,
  selectedDayIndex,
  onSelectDay,
}) => {
  const { colors } = useTheme();

  const maxVal = Math.max(...data.map((d) => d.amount), 0);
  const displayMax = maxVal > 0 ? maxVal * 1.15 : 100;

  let peakIdx = -1;
  let peakVal = 0;
  data.forEach((d, i) => {
    if (d.amount > peakVal) {
      peakVal = d.amount;
      peakIdx = i;
    }
  });

  if (peakIdx === -1 && data.length > 4) {
    peakIdx = 4;
  }

  const activeIndex = selectedDayIndex !== undefined ? selectedDayIndex : peakIdx;

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {data.map((item, index) => {
          const isSelected = index === activeIndex;
          const fillRatio = displayMax > 0 ? Math.min(item.amount / displayMax, 1) : 0;
          const fillHeight = Math.max(fillRatio * 100, item.amount > 0 ? 15 : 0);

          return (
            <TouchableOpacity
              key={`flow-bar-${index}`}
              activeOpacity={0.7}
              onPress={() => onSelectDay?.(item, index)}
              style={styles.column}
            >
              <View
                style={[
                  styles.pillTrack,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                {!isSelected && fillHeight > 0 && (
                  <View
                    style={[
                      styles.pillFill,
                      {
                        height: `${fillHeight}%`,
                        backgroundColor: colors.primaryLight,
                      },
                    ]}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: isSelected ? colors.primary : colors.textMuted,
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}
              >
                {item.day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 145,
    paddingHorizontal: 4,
  },
  column: {
    alignItems: 'center',
    flex: 1,
  },
  pillTrack: {
    width: 34,
    height: 110,
    borderRadius: 17,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  pillFill: {
    width: '100%',
    borderRadius: 17,
  },
  dayLabel: {
    fontSize: 11,
    marginTop: 10,
    letterSpacing: 0.5,
  },
});
