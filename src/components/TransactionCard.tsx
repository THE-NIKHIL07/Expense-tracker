import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../db/schema';
import { useTheme } from '../theme/ThemeContext';
import { getCategoryMeta } from '../constants/categories';
import { formatCurrency } from '../utils/currency';

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
  onDelete?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onPress,
  onDelete,
}) => {
  const { currency, colors } = useTheme();
  const meta = getCategoryMeta(transaction.category, transaction.type);
  const isIncome = transaction.type === 'income';
  const method = transaction.payment_method || 'cash';

  const handleLongPress = () => {
    if (!onDelete) return;
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${formatCurrency(transaction.amount, currency.symbol)} transaction?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={handleLongPress}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon as any} size={20} color={meta.color} />
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.titleText, { color: colors.text }]}
            numberOfLines={1}
          >
            {transaction.note || transaction.category}
          </Text>
          {method === 'upi' && (
            <View style={[styles.methodBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Text style={[styles.methodText, { color: '#A855F7' }]}>UPI</Text>
            </View>
          )}
          {method === 'card' && (
            <View style={[styles.methodBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Text style={[styles.methodText, { color: '#38BDF8' }]}>CARD</Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.subtitleText, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {transaction.date} · {transaction.category}
        </Text>
      </View>

      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amountText,
            { color: isIncome ? colors.income : colors.expense },
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount, currency.symbol, true)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#0E121B',
    borderWidth: 1,
    borderColor: '#192030',
    marginVertical: 5,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  methodText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  subtitleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
