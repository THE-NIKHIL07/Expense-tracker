import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { MONTH_NAMES } from '../../utils/date';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateIso: string) => void;
  selectedDate: string;
  title?: string;
  allowFuture?: boolean;
  allowPast?: boolean;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
  title = 'Select Date',
  allowFuture = true,
  allowPast = true,
}) => {
  const { colors } = useTheme();

  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  const [pickerYear, setPickerYear] = useState(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) return parseInt(parts[0], 10);
    }
    return today.getFullYear();
  });

  const [pickerMonth, setPickerMonth] = useState(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) return parseInt(parts[1], 10);
    }
    return today.getMonth() + 1;
  });

  useEffect(() => {
    if (visible && selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        setPickerYear(parseInt(parts[0], 10));
        setPickerMonth(parseInt(parts[1], 10));
      }
    }
  }, [visible, selectedDate]);

  const daysInMonth = new Date(pickerYear, pickerMonth, 0).getDate();
  const firstDayIndex = (new Date(pickerYear, pickerMonth - 1, 1).getDay() + 6) % 7;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isCurrentMonthOrFuture =
    pickerYear > today.getFullYear() ||
    (pickerYear === today.getFullYear() && pickerMonth >= today.getMonth() + 1);

  const isCurrentMonthOrPast =
    pickerYear < today.getFullYear() ||
    (pickerYear === today.getFullYear() && pickerMonth <= today.getMonth() + 1);

  const handlePrevMonth = () => {
    if (!allowPast && isCurrentMonthOrPast) return;
    if (pickerMonth === 1) {
      setPickerMonth(12);
      setPickerYear((y) => y - 1);
    } else {
      setPickerMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!allowFuture && isCurrentMonthOrFuture) return;
    if (pickerMonth === 12) {
      setPickerMonth(1);
      setPickerYear((y) => y + 1);
    } else {
      setPickerMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(pickerMonth).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateIso = `${pickerYear}-${mStr}-${dStr}`;
    onSelectDate(dateIso);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              disabled={!allowPast && isCurrentMonthOrPast}
              style={[
                styles.navBtn,
                { backgroundColor: colors.surfaceElevated },
                !allowPast && isCurrentMonthOrPast && { opacity: 0.25 },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.monthNavTitle, { color: colors.text }]}>
              {MONTH_NAMES[pickerMonth - 1]} {pickerYear}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              disabled={!allowFuture && isCurrentMonthOrFuture}
              style={[
                styles.navBtn,
                { backgroundColor: colors.surfaceElevated },
                !allowFuture && isCurrentMonthOrFuture && { opacity: 0.25 },
              ]}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdaysRow}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((w) => (
              <View key={w} style={styles.weekdayCell}>
                <Text style={[styles.weekdayText, { color: colors.textMuted }]}>{w}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.dayCell} />
            ))}

            {daysArray.map((d) => {
              const mStr = String(pickerMonth).padStart(2, '0');
              const dStr = String(d).padStart(2, '0');
              const dateIso = `${pickerYear}-${mStr}-${dStr}`;
              const isSelected = selectedDate === dateIso;

              const isFutureDisabled = !allowFuture && dateIso > todayIso;
              const isPastDisabled = !allowPast && dateIso < todayIso;
              const isDisabled = isFutureDisabled || isPastDisabled;

              return (
                <TouchableOpacity
                  key={`day-${d}`}
                  disabled={isDisabled}
                  onPress={() => handleSelectDay(d)}
                  style={[
                    styles.dayCell,
                    { backgroundColor: isSelected ? colors.primary : colors.surfaceElevated },
                    isDisabled && { opacity: 0.25 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isSelected ? '#FFFFFF' : isDisabled ? colors.textMuted : colors.text },
                      isSelected && { fontWeight: '800' },
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayCell: {
    width: '14.28%',
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '13.28%',
    aspectRatio: 1,
    margin: '0.5%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
