import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type Timeframe = 'week' | 'month' | 'year';

interface TimeframeSelectorProps {
  selected: Timeframe;
  onChange: (timeframe: Timeframe) => void;
  uppercase?: boolean;
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  selected,
  onChange,
  uppercase = false,
}) => {
  const { colors } = useTheme();
  const options: { id: Timeframe; label: string }[] = [
    { id: 'week', label: uppercase ? 'WEEK' : 'Week' },
    { id: 'month', label: uppercase ? 'MONTH' : 'Month' },
    { id: 'year', label: uppercase ? 'YEAR' : 'Year' },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {options.map((opt) => {
        const isActive = selected === opt.id;

        return (
          <TouchableOpacity
            key={opt.id}
            activeOpacity={0.8}
            onPress={() => onChange(opt.id)}
            style={[
              styles.tab,
              isActive && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive ? '#FFFFFF' : colors.textMuted,
                  fontWeight: isActive ? '700' : '600',
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 22,
    padding: 4,
    marginVertical: 12,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  tabText: {
    fontSize: 13,
  },
});
