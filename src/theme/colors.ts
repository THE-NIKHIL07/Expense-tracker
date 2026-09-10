export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryGlow: string;
  primaryLight: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  income: string;
  incomeBg: string;
  incomeBorder: string;
  expense: string;
  expenseBg: string;
  expenseBorder: string;
  warning: string;
  warningBg: string;
  cardGlow: string;
  tabBar: string;
  tabBarBorder: string;
}

export const darkColors: ThemeColors = {
  background: '#07090E',
  surface: '#11141C',
  surfaceElevated: '#171C26',
  surfaceSubtle: '#0F1219',
  border: '#1E2536',
  borderSubtle: '#161B26',
  primary: '#0066FF',
  primaryGlow: 'rgba(0, 102, 255, 0.28)',
  primaryLight: '#3B82F6',
  accent: '#00D2FF',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#07090E',
  income: '#10B981',
  incomeBg: 'rgba(16, 185, 129, 0.12)',
  incomeBorder: 'rgba(16, 185, 129, 0.25)',
  expense: '#F43F5E',
  expenseBg: 'rgba(244, 63, 94, 0.12)',
  expenseBorder: 'rgba(244, 63, 94, 0.25)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.12)',
  cardGlow: 'rgba(0, 102, 255, 0.15)',
  tabBar: '#0C0F17',
  tabBarBorder: '#1A202E',
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceSubtle: '#F8FAFC',
  border: '#E2E8F0',
  borderSubtle: '#EDF2F7',
  primary: '#0066FF',
  primaryGlow: 'rgba(0, 102, 255, 0.15)',
  primaryLight: '#2563EB',
  accent: '#0284C7',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  income: '#059669',
  incomeBg: 'rgba(5, 150, 105, 0.1)',
  incomeBorder: 'rgba(5, 150, 105, 0.2)',
  expense: '#E11D48',
  expenseBg: 'rgba(225, 29, 72, 0.1)',
  expenseBorder: 'rgba(225, 29, 72, 0.2)',
  warning: '#D97706',
  warningBg: 'rgba(217, 119, 6, 0.1)',
  cardGlow: 'rgba(0, 102, 255, 0.08)',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
};

export const categoryColors: Record<string, { color: string; bg: string }> = {
  Food: { color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' },
  Transport: { color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.15)' },
  Shopping: { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' },
  Bills: { color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)' },
  Entertainment: { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' },
  Health: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  Education: { color: '#6366F1', bg: 'rgba(99, 102, 241, 0.15)' },
  Travel: { color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.15)' },
  Salary: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  Investment: { color: '#0066FF', bg: 'rgba(0, 102, 255, 0.15)' },
  Freelance: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  Other: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)' },
};
