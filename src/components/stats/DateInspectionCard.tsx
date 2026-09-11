import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../../db/schema';
import { formatCurrency } from '../../utils/currency';
import { formatFriendlyDate } from '../../utils/date';
import { categoryColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

interface DateInspectionCardProps {
  date: string;
  transactions: Transaction[];
  total: number;
  onClose: () => void;
  onSelectTransaction: (id: string) => void;
}

export const DateInspectionCard: React.FC<DateInspectionCardProps> = ({
  date,
  transactions,
  total,
  onClose,
  onSelectTransaction,
}) => {
  const { colors, currency } = useTheme();

  return (
    <View
      style={[
        styles.dateInspectionCard,
        { backgroundColor: colors.surface, borderColor: colors.primary },
      ]}
    >
      <View style={styles.dateInspectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dateInspectionLabel}>DATE SPENDING</Text>
          <Text style={[styles.dateInspectionTitle, { color: colors.text }]}>
            {formatFriendlyDate(date)} ({date})
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeDateBtn}>
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.dateInspectionTotalRow}>
        <Text style={[styles.dateInspectionTotalText, { color: colors.text }]}>
          {formatCurrency(total, currency.symbol)}
        </Text>
        <Text style={styles.dateInspectionTxCount}>
          {transactions.length} {transactions.length === 1 ? 'expense' : 'expenses'}
        </Text>
      </View>

      {transactions.length === 0 ? (
        <Text style={styles.noTxText}>No expenses recorded on this date.</Text>
      ) : (
        transactions.map((tx) => {
          const catColor = categoryColors[tx.category]?.color || '#0066FF';
          return (
            <TouchableOpacity
              key={tx.id}
              activeOpacity={0.75}
              onPress={() => onSelectTransaction(tx.id)}
              style={styles.inspectionTxRow}
            >
              <View style={[styles.inspectionTxIconBox, { backgroundColor: `${catColor}20` }]}>
                <Ionicons
                  name={
                    tx.category.toLowerCase().includes('food')
                      ? 'fast-food'
                      : tx.category.toLowerCase().includes('transit') ||
                        tx.category.toLowerCase().includes('transport')
                      ? 'car'
                      : tx.category.toLowerCase().includes('shop')
                      ? 'bag-handle'
                      : tx.category.toLowerCase().includes('bill')
                      ? 'receipt'
                      : tx.category.toLowerCase().includes('health')
                      ? 'medkit'
                      : tx.category.toLowerCase().includes('home')
                      ? 'home'
                      : tx.category.toLowerCase().includes('edu')
                      ? 'school'
                      : 'cash'
                  }
                  size={18}
                  color={catColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inspectionTxCategory}>{tx.category}</Text>
                {!!tx.note && <Text style={styles.inspectionTxNote}>{tx.note}</Text>}
              </View>
              <Text style={styles.inspectionTxAmount}>
                -{formatCurrency(tx.amount, currency.symbol)}
              </Text>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dateInspectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginTop: 10,
    marginBottom: 10,
  },
  dateInspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateInspectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#388BFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  dateInspectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeDateBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInspectionTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  dateInspectionTotalText: {
    fontSize: 24,
    fontWeight: '800',
  },
  dateInspectionTxCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  noTxText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
    fontStyle: 'italic',
  },
  inspectionTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  inspectionTxIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inspectionTxCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inspectionTxNote: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  inspectionTxAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FB7185',
  },
});
