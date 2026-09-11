import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeContext';
import { useExpenses } from '../../src/context/ExpenseContext';
import { EXPENSE_CATEGORIES, getCategoryMeta } from '../../src/constants/categories';
import { formatCurrency } from '../../src/utils/currency';

export default function BudgetScreen() {
  const { currency, colors } = useTheme();
  const { budgets, setBudget, deleteBudget } = useExpenses();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState(EXPENSE_CATEGORIES[0].name);
  const [budgetAmountStr, setBudgetAmountStr] = useState('');

  const existingBudget = budgets.find(
    (b) => b.category.toLowerCase() === selectedCat.toLowerCase()
  );

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remaining = Math.max(totalBudget - totalSpent, 0);
  const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const ringSize = 90;
  const strokeWidth = 10;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(Math.max(overallPercent, 0), 100);
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  const handleOpenAddModal = () => {
    setEditingBudgetId(null);
    setSelectedCat(EXPENSE_CATEGORIES[0].name);
    const existing = budgets.find(
      (b) => b.category.toLowerCase() === EXPENSE_CATEGORIES[0].name.toLowerCase()
    );
    setBudgetAmountStr(existing ? String(existing.amount) : '');
    setModalVisible(true);
  };

  const handleEditBudget = (b: (typeof budgets)[0]) => {
    setEditingBudgetId(b.id);
    setSelectedCat(b.category);
    setBudgetAmountStr(String(b.amount));
    setModalVisible(true);
  };

  const handleDeleteBudget = () => {
    const targetId = editingBudgetId || existingBudget?.id;
    if (!targetId) return;

    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the budget for ${selectedCat}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteBudget(targetId);
            setModalVisible(false);
            setEditingBudgetId(null);
            setBudgetAmountStr('');
          },
        },
      ]
    );
  };

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetAmountStr.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid monthly budget amount.');
      return;
    }

    setBudget(selectedCat, amount);
    setBudgetAmountStr('');
    setEditingBudgetId(null);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Budget</Text>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleOpenAddModal}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.overviewLeft}>
            <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>TOTAL MONTHLY BUDGET</Text>
            <Text style={[styles.overviewAmount, { color: colors.text }]}>
              {formatCurrency(totalBudget, currency.symbol)}
            </Text>

            <View style={styles.subStatsRow}>
              <View>
                <Text style={[styles.subLabel, { color: colors.textMuted }]}>SPENT</Text>
                <Text style={[styles.subValue, { color: '#FB7185' }]}>
                  {formatCurrency(totalSpent, currency.symbol)}
                </Text>
              </View>

              <View style={{ marginLeft: 32 }}>
                <Text style={[styles.subLabel, { color: colors.textMuted }]}>LEFT</Text>
                <Text style={[styles.subValue, { color: '#34D399' }]}>
                  {formatCurrency(remaining, currency.symbol)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.overviewRight}>
            <Svg width={ringSize} height={ringSize}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={colors.borderSubtle}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={colors.primary}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              />
            </Svg>
            <View style={styles.ringCenterText}>
              <Text style={[styles.percentLabel, { color: colors.text }]}>{overallPercent}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.byCategoryHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>By Category</Text>
          <TouchableOpacity onPress={handleOpenAddModal}>
            <Text style={[styles.editAllText, { color: colors.primary }]}>+ ADD BUDGET</Text>
          </TouchableOpacity>
        </View>

        {budgets.length === 0 ? (
          <View style={[styles.emptyBudgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIconBox, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="wallet-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyBudgetTitle, { color: colors.text }]}>No category budgets set</Text>
            <Text style={[styles.emptyBudgetSubtitle, { color: colors.textMuted }]}>
              Create monthly spending limits for your categories to track expenses.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenAddModal}
              style={[styles.setFirstBudgetBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.setFirstBudgetText}>Set Category Budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          budgets.map((b) => {
            const isOver = b.percentage >= 100;
            const isNear = b.percentage >= 80 && !isOver;
            const color = isOver ? '#EC4899' : isNear ? '#EAB308' : colors.primary;
            const meta = getCategoryMeta(b.category, 'expense');

            return (
              <TouchableOpacity
                key={b.id}
                activeOpacity={0.75}
                onPress={() => handleEditBudget(b)}
                onLongPress={() => {
                  Alert.alert(
                    'Delete Budget',
                    `Delete monthly budget for ${b.category}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteBudget(b.id) },
                    ]
                  );
                }}
                style={[styles.catCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.catTop}>
                  <View style={styles.catTitleLeft}>
                    <View style={[styles.catIconBox, { backgroundColor: meta.bg }]}>
                      <Ionicons
                        name={meta.icon as any}
                        size={20}
                        color={meta.color}
                      />
                    </View>
                    <View>
                      <Text style={[styles.catName, { color: colors.text }]}>{b.category}</Text>
                      <Text style={[styles.catSub, { color: colors.textMuted }]}>
                        {formatCurrency(b.spent, currency.symbol)} of {formatCurrency(b.amount, currency.symbol)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.percentBadge, { color }]}>
                      {Math.round(b.percentage)}%
                    </Text>
                    <Ionicons name="create-outline" size={16} color={colors.textMuted} />
                  </View>
                </View>

                <View style={[styles.track, { backgroundColor: colors.surfaceElevated }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.min(b.percentage, 100)}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>

                {isOver ? (
                  <View style={styles.alertRow}>
                    <Ionicons name="alert-circle-outline" size={14} color="#FB7185" style={{ marginRight: 6 }} />
                    <Text style={styles.alertText}>
                      Exceeded budget by {formatCurrency(Math.abs(b.remaining), currency.symbol)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.remainingRow}>
                    <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
                      {formatCurrency(b.remaining, currency.symbol)} REMAINING
                    </Text>
                    <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          setModalVisible(false);
          setEditingBudgetId(null);
        }}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              setModalVisible(false);
              setEditingBudgetId(null);
            }}
          />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingBudgetId || existingBudget ? 'Edit Category Budget' : 'Set Category Budget'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setModalVisible(false);
                  setEditingBudgetId(null);
                }}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {existingBudget && (
                <View style={[styles.existingBadge, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.existingBadgeText, { color: colors.primary }]}>
                    Current limit: {formatCurrency(existingBudget.amount, currency.symbol)} (Spent: {formatCurrency(existingBudget.spent, currency.symbol)})
                  </Text>
                </View>
              )}

              <Text style={[styles.modalLabel, { color: colors.textMuted, marginTop: existingBudget ? 12 : 0 }]}>Select Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPicker}>
                {EXPENSE_CATEGORIES.map((c) => {
                  const isSelected = selectedCat.toLowerCase() === c.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setSelectedCat(c.name);
                        const found = budgets.find((b) => b.category.toLowerCase() === c.name.toLowerCase());
                        if (found) {
                          setBudgetAmountStr(String(found.amount));
                        } else if (!editingBudgetId) {
                          setBudgetAmountStr('');
                        }
                      }}
                      style={[
                        styles.pickerChip,
                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                        isSelected && styles.pickerChipActive,
                      ]}
                    >
                      <Text style={[styles.pickerChipText, { color: colors.textSecondary }, isSelected && { color: '#FFFFFF' }]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.modalLabel, { color: colors.textMuted, marginTop: 18 }]}>
                Monthly Limit ({currency.symbol})
              </Text>
              <View style={[styles.modalInputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={styles.currencyPrefix}>{currency.symbol}</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text }]}
                  placeholder="e.g. 5000"
                  placeholderTextColor={colors.textMuted}
                  value={budgetAmountStr}
                  onChangeText={setBudgetAmountStr}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSaveBudget}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>
                  {editingBudgetId || existingBudget ? 'Update Budget' : 'Save Budget'}
                </Text>
              </TouchableOpacity>

              {(editingBudgetId || existingBudget) && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleDeleteBudget}
                  style={styles.modalDeleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#FB7185" style={{ marginRight: 6 }} />
                  <Text style={styles.modalDeleteText}>Delete Budget</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1E2536',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F131D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#192030',
    padding: 22,
    marginVertical: 12,
  },
  overviewLeft: {
    flex: 1,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  overviewAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  subValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  overviewRight: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  byCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#388BFF',
    letterSpacing: 0.5,
  },
  catCard: {
    backgroundColor: '#0F131D',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#192030',
    padding: 18,
    marginVertical: 6,
  },
  catTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  catTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  catSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  percentBadge: {
    fontSize: 15,
    fontWeight: '800',
  },
  track: {
    height: 6,
    backgroundColor: '#161C2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  alertText: {
    fontSize: 12,
    color: '#FB7185',
    fontWeight: '600',
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  remainingText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoryPicker: {
    gap: 8,
    paddingVertical: 4,
  },
  pickerChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1E2536',
  },
  pickerChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  pickerChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modalInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2536',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '800',
    color: '#388BFF',
    marginRight: 8,
  },
  modalInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSaveBtn: {
    height: 54,
    backgroundColor: '#0066FF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalDeleteBtn: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FB718540',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalDeleteText: {
    color: '#FB7185',
    fontSize: 15,
    fontWeight: '700',
  },
  existingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  existingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  emptyBudgetCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginVertical: 16,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyBudgetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyBudgetSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  setFirstBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  setFirstBudgetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
