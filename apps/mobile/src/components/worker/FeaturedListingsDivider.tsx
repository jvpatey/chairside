import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type FeaturedListingsSectionHeaderProps = {
  /** Quiet section label, e.g. "Featured" or "More roles". */
  label: string;
  /**
   * `featured` — diamond mark, no top rule (section starts the list).
   * `rest` — hairline rule above the label (after featured cards).
   */
  variant?: 'featured' | 'rest';
  accent?: GradientAccent;
};

/** Quiet section label for featured vs standard listing groups. */
export function FeaturedListingsSectionHeader({
  label,
  variant = 'rest',
  accent = 'primary',
}: FeaturedListingsSectionHeaderProps) {
  const { colors } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const isFeatured = variant === 'featured';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      width: '100%',
      alignSelf: 'stretch' as const,
      paddingTop: isFeatured ? spacing.xs : spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.xs,
    },
    line: {
      height: StyleSheet.hairlineWidth,
      width: '100%',
      backgroundColor: colors.separator,
    },
    labelRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    label: {
      ...typography.subtitle,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
      textTransform: 'uppercase' as const,
      color: isFeatured ? brandColor : colors.labelTertiary,
    },
  }));

  return (
    <View
      style={styles.wrap}
      accessibilityRole="header"
      accessibilityLabel={label}>
      {!isFeatured ? <View style={styles.line} /> : null}
      <View style={styles.labelRow}>
        {isFeatured ? (
          <Ionicons name="diamond-outline" size={12} color={brandColor} />
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

/** @deprecated Prefer FeaturedListingsSectionHeader. */
export function FeaturedListingsDivider({
  label = 'More listings',
}: {
  label?: string;
}) {
  return <FeaturedListingsSectionHeader label={label} variant="rest" />;
}
