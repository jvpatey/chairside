import { Text, View } from 'react-native';

import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

type BillingMetricTileProps = {
  label: string;
  value: string;
  hint?: string | null;
  atLimit?: boolean;
};

export function BillingMetricTile({ label, value, hint, atLimit = false }: BillingMetricTileProps) {
  const { colors, isDark } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    tile: {
      flex: 1,
      minWidth: 96,
      backgroundColor: colorWithAlpha(colors.surface, isDark ? 0.55 : 0.72),
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colorWithAlpha(colors.separator, isDark ? 0.9 : 1),
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
      gap: 2,
    },
    label: {
      ...typography.subtitle,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: colors.labelTertiary,
    },
    value: {
      ...typography.body,
      fontSize: 18,
      fontWeight: '700',
      color: atLimit ? colors.warning : colors.labelPrimary,
    },
    hint: {
      ...typography.subtitle,
      fontSize: 12,
      lineHeight: 16,
      color: atLimit ? colors.warning : colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
