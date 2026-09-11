import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../../db/schema';
import { useTheme } from '../../theme/ThemeContext';
import { formatDateISO } from '../../utils/date';
import { DatePickerModal } from '../common/DatePickerModal';

interface AddEditGoalModalProps {
  visible: boolean;
  editingGoal: Goal | null;
  initialType?: 'saving' | 'due';
  onClose: () => void;
  onSave: (data: {
    id?: string;
    title: string;
    target_amount: number;
    saved_amount: number;
    due_date: string;
    category: string;
    status: 'active' | 'completed';
  }) => void;
}

export const AddEditGoalModal: React.FC<AddEditGoalModalProps> = ({
  visible,
  editingGoal,
  initialType = 'saving',
  onClose,
  onSave,
}) => {
  const { colors, currency } = useTheme();

  const [targetType, setTargetType] = useState<'saving' | 'due'>(initialType);
  const [title, setTitle] = useState('');
  const [targetStr, setTargetStr] = useState('');
  const [editSavedStr, setEditSavedStr] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingGoal) {
        setTitle(editingGoal.title);
        setTargetStr(String(editingGoal.target_amount));
        setEditSavedStr(String(editingGoal.saved_amount));
        setDueDate(editingGoal.due_date);
        setTargetType(editingGoal.category === 'Payment Due' ? 'due' : 'saving');
      } else {
        setTitle('');
        setTargetStr('');
        setEditSavedStr('');
        setTargetType(initialType);
        const def = new Date();
        def.setDate(def.getDate() + 14);
        setDueDate(formatDateISO(def));
      }
    }
  }, [visible, editingGoal, initialType]);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Missing Title', 'Please provide a name for your target.');
      return;
    }

    const amount = parseFloat(targetStr);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target amount greater than 0.');
      return;
    }

    const todayStr = formatDateISO(new Date());
    if (dueDate < todayStr) {
      Alert.alert('Invalid Deadline', 'Deadline cannot be in the past.');
      return;
    }

    const parsedSaved = parseFloat(editSavedStr);
    const newSaved = isNaN(parsedSaved) || parsedSaved < 0 ? 0 : parsedSaved;
    const isCompleted = amount > 0 && newSaved >= amount;

    onSave({
      id: editingGoal ? editingGoal.id : undefined,
      title: trimmedTitle,
      target_amount: amount,
      saved_amount: newSaved,
      due_date: dueDate,
      category: targetType === 'due' ? 'Payment Due' : 'Savings',
      status: isCompleted ? 'completed' : 'active',
    });

    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingGoal ? 'Edit Target' : targetType === 'due' ? 'New Payment Due' : 'New Saving Goal'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Target Type</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setTargetType('saving')}
                  style={[
                    styles.typeOptionBtn,
                    {
                      backgroundColor: targetType === 'saving' ? colors.primary : colors.surfaceElevated,
                      borderColor: targetType === 'saving' ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={16}
                    color={targetType === 'saving' ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.typeOptionText, { color: targetType === 'saving' ? '#FFFFFF' : colors.textSecondary }]}>
                    Saving Goal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setTargetType('due')}
                  style={[
                    styles.typeOptionBtn,
                    {
                      backgroundColor: targetType === 'due' ? '#EF4444' : colors.surfaceElevated,
                      borderColor: targetType === 'due' ? '#EF4444' : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={16}
                    color={targetType === 'due' ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.typeOptionText, { color: targetType === 'due' ? '#FFFFFF' : colors.textSecondary }]}>
                    Payment Due
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 14 }]}>
                {targetType === 'due' ? 'Payment Due Name' : 'Goal Name'}
              </Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={targetType === 'due' ? 'e.g. Credit Card Bill, Rent, Loan EMI' : 'e.g. Emergency Fund, Laptop, Vacation'}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 14 }]}>
                Target Amount ({currency.symbol})
              </Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={targetStr}
                  onChangeText={setTargetStr}
                  placeholder="e.g. 5000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              {editingGoal && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 14 }]}>
                    {targetType === 'due' ? `Amount Already Paid (${currency.symbol})` : `Amount Already Saved (${currency.symbol})`}
                  </Text>
                  <View style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      value={editSavedStr}
                      onChangeText={setEditSavedStr}
                      placeholder="e.g. 1000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}

              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 14 }]}>
                Deadline Due Date
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCalendarVisible(true)}
                style={[
                  styles.calendarTriggerBtn,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.calendarTriggerText, { color: colors.text }]}>
                  {dueDate || 'Select Date'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} onPress={handleSave} style={styles.createBtn}>
                <Text style={styles.createBtnText}>
                  {editingGoal ? 'Update Target' : targetType === 'due' ? 'Save Payment Due' : 'Save Saving Goal'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DatePickerModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onSelectDate={(selected) => setDueDate(selected)}
        selectedDate={dueDate}
        title="Select Deadline"
        allowPast={false}
        allowFuture={true}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '88%',
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
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  typeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  calendarTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  calendarTriggerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createBtn: {
    backgroundColor: '#0066FF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
