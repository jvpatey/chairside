import { Text, View } from 'react-native';

import { fontSemibold, useThemedStyles } from '@/theme';

type DashboardSectionHeaderProps = {
  title: string;
  /** When true, uses tighter spacing for nested subsections inside overview panels. */
  compact?: boolean;
  /** Subtle brand marker for the active dashboard content section. */
  accent?: boolean;
};

export function DashboardSectionHeader({
  title,
  compact = false,
  accent = false,
}: DashboardSectionHeaderProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    header: {
      marginBottom: compact ? spacing.xs : spacing.sm,
      gap: spacing.xs,
    },
    title: {
      ...typography.label,
      fontFamily: fontSemibold,
      fontSize: compact ? 13 : 15,
      color: typography.subtitle.color,
    },
    accent: {
      width: 24,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.primary,
      opacity: 0.8,
    },
  }));

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {accent ? <View style={styles.accent} /> : null}
    </View>
  );
}
