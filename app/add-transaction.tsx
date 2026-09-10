import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext';
import { useExpenses } from '../src/context/ExpenseContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../src/constants/categories';
import { CategoryGrid } from '../src/components/CategoryGrid';
import { formatDateISO, formatFriendlyDate, getDaysInMonth, MONTH_NAMES } from '../src/utils/date';
import { TransactionType } from '../src/db/schema';

export default function AddTransactionScreen() {
  const { currency, colors } = useTheme();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useExpenses();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory] = useState<string>('Food & Dining');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(formatDateISO(new Date()));
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth() + 1);

  const isEditing = !!editId;

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    if (editId) {
      const existing = transactions.find((t) => t.id === editId);
      if (existing) {
        setType(existing.type);
        setAmountStr(String(existing.amount));
        setNote(existing.note || '');
        setDate(existing.date);
        const parts = existing.date.split('-');
        if (parts.length === 3) {
          setPickerYear(parseInt(parts[0], 10));
          setPickerMonth(parseInt(parts[1], 10));
        }

        const list = existing.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
        const matched = list.find(
          (c) => c.name.toLowerCase() === existing.category.toLowerCase() && c.id !== 'other'
        );

        if (matched) {
          setIsCustomCategory(false);
          setCategory(matched.name);
          setCustomCategoryName('');
        } else {
          setIsCustomCategory(true);
          setCategory(existing.category);
          setCustomCategoryName(existing.category);
        }
      }
    }
  }, [editId, transactions]);

  const handleSelectCategory = (catName: string) => {
    if (catName.toLowerCase() === 'other') {
      setIsCustomCategory(true);
      setCategory(customCategoryName.trim());
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 360, animated: true });
      }, 100);
    } else {
      setIsCustomCategory(false);
      setCategory(catName);
    }
  };

  const handleSave = () => {
    const finalCategory = isCustomCategory ? customCategoryName.trim().toLowerCase() : category.trim();

    if (!finalCategory) {
      Alert.alert(
        'Category Name Required',
        'Please enter a name for your custom category before saving.'
      );
      return;
    }

    const numAmount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (isEditing && editId) {
      updateTransaction(editId, {
        amount: numAmount,
        type,
        category: finalCategory,
        note: note.trim() || undefined,
        date,
      });
    } else {
      addTransaction({
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        amount: numAmount,
        type,
        category: finalCategory,
        note: note.trim() || undefined,
        date,
      });
    }

    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? It will be removed from your balance and statistics.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (editId) {
              deleteTransaction(editId);
              router.back();
            }
          },
        },
      ]
    );
  };

  const daysInCurMonth = getDaysInMonth(pickerMonth, pickerYear);
  const daysArray = Array.from({ length: daysInCurMonth }, (_, i) => i + 1);

  const handleSelectDay = (day: number) => {
    const mStr = String(pickerMonth).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    setDate(`${pickerYear}-${mStr}-${dStr}`);
    setDatePickerVisible(false);
  };

  const setQuickDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    setDate(formatDateISO(d));
    setPickerYear(d.getFullYear());
    setPickerMonth(d.getMonth() + 1);
    setDatePickerVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? 'Edit Transaction' : 'Add Transaction'}
        </Text>
        {isEditing ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerDeleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 320 }]}
        >
          <View style={[styles.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setType('expense');
                setIsCustomCategory(false);
                setCategory('Food & Dining');
              }}
              style={[
                styles.toggleBtn,
                type === 'expense' && styles.activeToggle,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: type === 'expense' ? '#FFFFFF' : '#64748B' },
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setType('income');
                setIsCustomCategory(false);
                setCategory('Salary');
              }}
              style={[
                styles.toggleBtn,
                type === 'income' && styles.activeToggle,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: type === 'income' ? '#FFFFFF' : '#64748B' },
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.amountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
              {type === 'expense' ? 'AMOUNT SPENT' : 'AMOUNT RECEIVED'}
            </Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>{currency.symbol}</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={amountStr}
                onChangeText={setAmountStr}
                keyboardType="decimal-pad"
                autoFocus={!isEditing && !isCustomCategory}
              />
            </View>
          </View>

          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>SELECT CATEGORY</Text>
          <CategoryGrid
            categories={categories}
            selectedCategory={category}
            onSelectCategory={handleSelectCategory}
            isCustomCategory={isCustomCategory}
            customCategoryName={customCategoryName}
          />

          {isCustomCategory && (
            <View style={[styles.customCategoryCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <View style={styles.customCategoryHeaderRow}>
                <Ionicons name="pricetag" size={16} color={colors.primary} />
                <Text style={[styles.customCategoryLabel, { color: colors.primary }]}>
                  ENTER CATEGORY NAME
                </Text>
              </View>
              <TextInput
                style={[styles.customCategoryInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Type category name (e.g. Gym, Books, Coffee)..."
                placeholderTextColor={colors.textMuted}
                value={customCategoryName}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 360, animated: true });
                  }, 120);
                }}
                onChangeText={(text) => {
                  const lower = text.toLowerCase();
                  setCustomCategoryName(lower);
                  setCategory(lower);
                }}
                autoCapitalize="none"
                autoFocus
              />
            </View>
          )}

          <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="pencil-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a description..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDatePickerVisible(true)}
            style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="calendar-outline" size={18} color="#388BFF" style={styles.inputIcon} />
            <Text style={[styles.dateDisplayText, { color: colors.text }]}>
              {formatFriendlyDate(date)} ({date})
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>
              {isEditing ? 'Save Changes' : 'Save Transaction'}
            </Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleDelete}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.deleteBtnText}>Delete Transaction</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={datePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickDateRow}>
              <TouchableOpacity
                onPress={() => setQuickDate(0)}
                style={[
                  styles.quickDateBtn,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  date === formatDateISO(new Date()) && styles.quickDateBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.quickDateText,
                    { color: date === formatDateISO(new Date()) ? '#FFFFFF' : colors.text },
                  ]}
                >
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setQuickDate(1)}
                style={[
                  styles.quickDateBtn,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.quickDateText, { color: colors.text }]}>Yesterday</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setQuickDate(2)}
                style={[
                  styles.quickDateBtn,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.quickDateText, { color: colors.text }]}>2 Days Ago</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.monthNavRow}>
              <TouchableOpacity
                onPress={() => {
                  if (pickerMonth === 1) {
                    setPickerMonth(12);
                    setPickerYear((y) => y - 1);
                  } else {
                    setPickerMonth((m) => m - 1);
                  }
                }}
                style={[styles.navBtn, { backgroundColor: colors.surfaceElevated }]}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.monthNavTitle, { color: colors.text }]}>
                {MONTH_NAMES[pickerMonth - 1]} {pickerYear}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (pickerMonth === 12) {
                    setPickerMonth(1);
                    setPickerYear((y) => y + 1);
                  } else {
                    setPickerMonth((m) => m + 1);
                  }
                }}
                style={[styles.navBtn, { backgroundColor: colors.surfaceElevated }]}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.daysGrid}>
              {daysArray.map((d) => {
                const mStr = String(pickerMonth).padStart(2, '0');
                const dStr = String(d).padStart(2, '0');
                const fullIso = `${pickerYear}-${mStr}-${dStr}`;
                const isSelected = date === fullIso;

                return (
                  <TouchableOpacity
                    key={`day-${d}`}
                    onPress={() => handleSelectDay(d)}
                    style={[
                      styles.dayCell,
                      { backgroundColor: colors.surfaceElevated },
                      isSelected && styles.dayCellActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1E2536',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F131D',
    borderRadius: 20,
    padding: 4,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#192030',
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  activeToggle: {
    backgroundColor: '#0066FF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  amountCard: {
    backgroundColor: '#0F131D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#192030',
    padding: 24,
    alignItems: 'center',
    marginVertical: 10,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '800',
    color: '#388BFF',
    marginRight: 6,
  },
  amountInput: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 80,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F131D',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#192030',
    paddingHorizontal: 16,
    height: 54,
    marginTop: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dateDisplayText: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#0066FF',
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F131D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#1E2536',
    padding: 24,
    paddingBottom: 36,
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
    color: '#FFFFFF',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickDateBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1E2536',
  },
  quickDateBtnActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  quickDateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121622',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#121622',
  },
  dayCellActive: {
    backgroundColor: '#0066FF',
  },
  dayCellText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  headerDeleteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 18,
    height: 52,
    marginTop: 12,
    marginBottom: 20,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  customCategoryCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginVertical: 12,
  },
  customCategoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  customCategoryLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  customCategoryInput: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
  },
});
