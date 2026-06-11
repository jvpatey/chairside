import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type DashboardSectionHeaderProps = {
  title: string;
  /** When true, uses tighter spacing for nested subsections inside overview panels. */
  compact?: boolean;
};

export function DashboardSectionHeader({ title, compact = false }: DashboardSectionHeaderProps) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    header: {
      marginBottom: compact ? spacing.xs : spacing.sm,
    },
    title: {
      ...typography.body,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: typography.subtitle.color,
    },
  }));

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}
