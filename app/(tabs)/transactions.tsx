import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SectionList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useExpenses } from '../../src/context/ExpenseContext';
import { TransactionCard } from '../../src/components/TransactionCard';
import { EmptyState } from '../../src/components/EmptyState';
import { formatFriendlyDate } from '../../src/utils/date';
import { Transaction } from '../../src/db/schema';

export default function TransactionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { transactions, deleteTransaction } = useExpenses();

  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filterOptions = ['All', 'Income', 'Expense', 'Food', 'Shopping'];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedFilter === 'Income' && t.type !== 'income') return false;
      if (selectedFilter === 'Expense' && t.type !== 'expense') return false;
      if (selectedFilter === 'Food' && !t.category.toLowerCase().includes('food')) return false;
      if (selectedFilter === 'Shopping' && !t.category.toLowerCase().includes('shop')) return false;

      if (search.trim() !== '') {
        const query = search.toLowerCase();
        const matchesCat = t.category.toLowerCase().includes(query);
        const matchesNote = (t.note || '').toLowerCase().includes(query);
        if (!matchesCat && !matchesNote) return false;
      }
      return true;
    });
  }, [transactions, selectedFilter, search]);

  const sections = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredTransactions.forEach((t) => {
      const title = formatFriendlyDate(t.date).toUpperCase();
      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(t);
    });

    return Object.keys(groups).map((title) => ({
      title,
      data: groups[title],
    }));
  }, [filteredTransactions]);

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${tx.category} transaction? It will be removed from your balance and stats.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(tx.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerCircleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Transactions</Text>
        <TouchableOpacity style={[styles.headerCircleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="filter-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filterOptions.map((opt) => {
            const isActive = selectedFilter === opt;
            return (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.8}
                onPress={() => setSelectedFilter(opt)}
                style={[
                  styles.filterPill,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isActive && styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isActive ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            title="No transactions found"
            description="Add a transaction or try changing your filters."
            buttonTitle="Add Transaction"
            onButtonPress={() => router.push('/add-transaction')}
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionHeaderTitle, { color: colors.textSecondary }]}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onPress={() => router.push({ pathname: '/add-transaction', params: { editId: item.id } })}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerCircleBtn: {
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
    fontWeight: '800',
    color: '#FFFFFF',
  },
  searchRow: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F131D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#192030',
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterScrollWrap: {
    marginVertical: 6,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#0F131D',
    borderWidth: 1,
    borderColor: '#192030',
  },
  filterPillActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  emptyWrap: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
});
