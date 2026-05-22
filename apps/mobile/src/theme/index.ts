export const colors = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0D9488',
  primaryLight: '#CCFBF1',
  border: '#E2E8F0',
  tabInactive: '#94A3B8',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.text,
    lineHeight: 24,
  },
} as const;
