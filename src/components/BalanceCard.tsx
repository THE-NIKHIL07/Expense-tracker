import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { formatCurrency } from '../utils/currency';

interface BalanceCardProps {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalance,
  totalIncome,
  totalExpenses,
}) => {
  const { currency } = useTheme();

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.headerLabel}>Total Balance</Text>
      <Text style={styles.balanceValue}>
        {formatCurrency(totalBalance, currency.symbol, true)}
      </Text>

      <View style={styles.splitsRow}>
        <View style={styles.splitCol}>
          <View style={styles.splitLabelRow}>
            <Ionicons name="arrow-down-outline" size={13} color="rgba(255, 255, 255, 0.8)" style={{ marginRight: 4 }} />
            <Text style={styles.splitLabel}>INCOME</Text>
          </View>
          <Text style={styles.splitAmount}>
            {formatCurrency(totalIncome, currency.symbol, true)}
          </Text>
        </View>

        <View style={styles.splitCol}>
          <View style={styles.splitLabelRow}>
            <Ionicons name="arrow-up-outline" size={13} color="rgba(255, 255, 255, 0.8)" style={{ marginRight: 4 }} />
            <Text style={styles.splitLabel}>EXPENSES</Text>
          </View>
          <Text style={styles.splitAmount}>
            {formatCurrency(totalExpenses, currency.symbol, true)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    padding: 24,
    marginVertical: 12,
    backgroundColor: '#0066FF',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  headerLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  splitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitCol: {
    flex: 1,
  },
  splitLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  splitLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  splitAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
