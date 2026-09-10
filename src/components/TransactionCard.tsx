import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onDelete}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon as any} size={20} color={meta.color} />
      </View>

      <View style={styles.detailsContainer}>
        <Text
          style={[styles.titleText, { color: colors.text }]}
          numberOfLines={1}
        >
          {transaction.note || transaction.category}
        </Text>
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
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
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
