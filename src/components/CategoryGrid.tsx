import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryItem } from '../constants/categories';
import { useTheme } from '../theme/ThemeContext';

interface CategoryGridProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  isCustomCategory?: boolean;
  customCategoryName?: string;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  isCustomCategory = false,
  customCategoryName = '',
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.grid}>
      {categories.map((cat) => {
        const isOther = cat.id === 'other' || cat.name.toLowerCase() === 'other';
        const isSelected = isOther
          ? isCustomCategory || selectedCategory.toLowerCase() === 'other'
          : !isCustomCategory &&
            (selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
             selectedCategory.toLowerCase() === cat.label.toLowerCase());

        const displayLabel = isOther && isCustomCategory && customCategoryName.trim()
          ? customCategoryName.trim().toUpperCase()
          : cat.label;

        return (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.7}
            onPress={() => onSelectCategory(cat.name)}
            style={styles.col}
          >
            <View
              style={[
                styles.iconCircle,
                isSelected
                  ? [styles.iconCircleActive, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]
                  : [styles.iconCircleInactive, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }],
              ]}
            >
              <Ionicons
                name={cat.icon as any}
                size={22}
                color={isSelected ? colors.primary : colors.textMuted}
              />
            </View>

            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.primary : colors.textSecondary, fontWeight: isSelected ? '800' : '600' },
              ]}
              numberOfLines={1}
            >
              {displayLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 16,
    columnGap: 12,
    marginVertical: 12,
  },
  col: {
    width: '22%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleInactive: {
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1C2333',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(0, 102, 255, 0.18)',
    borderWidth: 2,
    borderColor: '#0066FF',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
