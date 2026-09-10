import { categoryColors } from '../theme/colors';

export interface CategoryItem {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  type: 'expense' | 'income' | 'both';
}

export const EXPENSE_CATEGORIES: CategoryItem[] = [
  {
    id: 'food',
    name: 'Food & Dining',
    label: 'FOOD',
    icon: 'fast-food',
    color: '#F97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    type: 'expense',
  },
  {
    id: 'transit',
    name: 'Transport',
    label: 'TRANSIT',
    icon: 'car',
    color: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.15)',
    type: 'expense',
  },
  {
    id: 'shop',
    name: 'Shopping',
    label: 'SHOP',
    icon: 'bag-handle',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    type: 'expense',
  },
  {
    id: 'bills',
    name: 'Bills',
    label: 'BILLS',
    icon: 'receipt',
    color: '#EAB308',
    bg: 'rgba(234, 179, 8, 0.15)',
    type: 'expense',
  },
  {
    id: 'entertain',
    name: 'Entertainment',
    label: 'ENTERTAIN',
    icon: 'film',
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.15)',
    type: 'expense',
  },
  {
    id: 'health',
    name: 'Health',
    label: 'HEALTH',
    icon: 'medkit',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
    type: 'expense',
  },
  {
    id: 'home',
    name: 'Home',
    label: 'HOME',
    icon: 'home',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.15)',
    type: 'expense',
  },
  {
    id: 'edu',
    name: 'Education',
    label: 'EDU',
    icon: 'school',
    color: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.15)',
    type: 'expense',
  },
  {
    id: 'other',
    name: 'Other',
    label: 'OTHER',
    icon: 'ellipsis-horizontal-circle',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.15)',
    type: 'both',
  },
];

export const INCOME_CATEGORIES: CategoryItem[] = [
  {
    id: 'salary',
    name: 'Salary',
    label: 'SALARY',
    icon: 'wallet',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
    type: 'income',
  },
  {
    id: 'freelance',
    name: 'Freelance',
    label: 'FREELANCE',
    icon: 'laptop',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.15)',
    type: 'income',
  },
  {
    id: 'investment',
    name: 'Investment',
    label: 'INVEST',
    icon: 'trending-up',
    color: '#0066FF',
    bg: 'rgba(0, 102, 255, 0.15)',
    type: 'income',
  },
  {
    id: 'other',
    name: 'Other',
    label: 'OTHER',
    icon: 'ellipsis-horizontal-circle',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.15)',
    type: 'both',
  },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES.filter(c => c.id !== 'other')];

const PALETTE = [
  '#8B5CF6',
  '#06B6D4',
  '#F59E0B',
  '#EC4899',
  '#10B981',
  '#3B82F6',
  '#F97316',
  '#14B8A6',
];

export function getCategoryMeta(categoryName: string, type: 'income' | 'expense' = 'expense'): CategoryItem {
  const found = ALL_CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase() || c.label.toLowerCase() === categoryName.toLowerCase()
  );
  if (found) return found;

  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = PALETTE[Math.abs(hash) % PALETTE.length];

  return {
    id: 'custom',
    name: categoryName || 'Other',
    label: (categoryName || 'OTHER').toUpperCase(),
    icon: type === 'income' ? 'wallet' : 'pricetag',
    color,
    bg: `${color}25`,
    type,
  };
}
