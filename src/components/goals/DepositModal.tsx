import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../../db/schema';
import { useTheme } from '../../theme/ThemeContext';
import { formatCurrency } from '../../utils/currency';

interface DepositModalProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onConfirm: (goal: Goal, amount: number) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  visible,
  goal,
  onClose,
  onConfirm,
}) => {
  const { colors, currency } = useTheme();
  const [amountStr, setAmountStr] = useState('');

  useEffect(() => {
    if (visible) {
      setAmountStr('');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!goal) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid deposit amount greater than 0.');
      return;
    }
    onConfirm(goal, amount);
    onClose();
  };

  const isPaymentDue = goal?.category === 'Payment Due';

  return (
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
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isPaymentDue ? 'Pay towards Due' : 'Add Deposit'}
              </Text>
              {goal && (
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                  {goal.title} • Target: {formatCurrency(goal.target_amount, currency.symbol)}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 8 }]}>
            Amount to Add ({currency.symbol})
          </Text>
          <View style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="Enter deposit amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              autoFocus
            />
          </View>

          {goal && (
            <View style={styles.quickDepositChips}>
              {[500, 1000, 2000, 5000].map((quickVal) => (
                <TouchableOpacity
                  key={quickVal}
                  activeOpacity={0.8}
                  onPress={() => setAmountStr(String(quickVal))}
                  style={[styles.quickDepositChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                >
                  <Text style={[styles.quickDepositText, { color: colors.textSecondary }]}>
                    +{currency.symbol}{quickVal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit} style={styles.createBtn}>
            <Text style={styles.createBtnText}>Confirm Amount</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  quickDepositChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickDepositChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDepositText: {
    fontSize: 12,
    fontWeight: '700',
  },
  createBtn: {
    backgroundColor: '#0066FF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
