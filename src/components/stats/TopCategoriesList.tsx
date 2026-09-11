import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryMeta } from '../../constants/categories';
import { formatCurrency } from '../../utils/currency';
import { useTheme } from '../../theme/ThemeContext';

interface CategoryItem {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface TopCategoriesListProps {
  categories: CategoryItem[];
}

export const TopCategoriesList: React.FC<TopCategoriesListProps> = ({ categories }) => {
  const { colors, currency } = useTheme();

  if (categories.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No spending categories in this timeframe.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {categories.map((cat, idx) => {
        const meta = getCategoryMeta(cat.category, 'expense');

        return (
          <View
            key={`cat-${idx}`}
            style={[styles.catCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.catTopRow}>
              <View style={styles.catLeft}>
                <View style={[styles.catIconBox, { backgroundColor: meta.bg }]}>
                  <Ionicons
                    name={meta.icon as any}
                    size={20}
                    color={meta.color}
                  />
                </View>
                <View>
                  <Text style={[styles.catName, { color: colors.text }]}>{cat.category}</Text>
                  <Text style={[styles.catSub, { color: colors.textMuted }]}>
                    {cat.percentage}% · {cat.count} {cat.count === 1 ? 'expense' : 'expenses'}
                  </Text>
                </View>
              </View>

              <View style={styles.catRight}>
                <Text style={[styles.catAmount, { color: colors.text }]}>
                  {formatCurrency(cat.amount, currency.symbol, true)}
                </Text>
              </View>
            </View>

            <View style={[styles.track, { backgroundColor: colors.surfaceElevated }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.min(cat.percentage, 100)}%`,
                    backgroundColor: meta.color,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  catCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  catLeft: {
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
    marginBottom: 3,
  },
  catSub: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  catRight: {
    alignItems: 'flex-end',
  },
  catAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
  },
});
