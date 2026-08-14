import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

type BillingMetricTileProps = {
  label: string;
  value: string;
  hint?: string | null;
  atLimit?: boolean;
  accent?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Quieter tile for nested hero footers. */
  variant?: 'card' | 'inset';
};

const IS_WEB = Platform.OS === 'web';

export function BillingMetricTile({
  label,
  value,
  hint,
  atLimit = false,
  accent,
  icon,
  variant = 'card',
}: BillingMetricTileProps) {
  const { colors, isDark } = useTheme();
  const tone = atLimit ? colors.warning : (accent ?? colors.primary);
  const inset = variant === 'inset';

  const styles = useThemedStyles(({ colors, spacing, typography, radii, isDark }) => ({
    tile: IS_WEB
      ? {
          flex: 1,
          minWidth: inset ? 108 : 120,
          backgroundColor: inset
            ? colors.backgroundGrouped
            : isDark
              ? colors.surfaceElevated
              : colors.surface,
          borderRadius: 14,
          borderWidth: inset ? StyleSheet.hairlineWidth : 1,
          paddingVertical: inset ? spacing.sm + 2 : spacing.md,
          paddingHorizontal: inset ? spacing.sm + 4 : spacing.md,
          gap: inset ? 2 : spacing.xs,
          overflow: 'hidden' as const,
          position: 'relative' as const,
          ...(inset
            ? {}
            : {
                // @ts-expect-error web shadow
                boxShadow: getWebShadow(isDark, 'subtle'),
              }),
        }
      : {
          flex: 1,
          minWidth: 96,
          backgroundColor: colors.fillSubtle,
          borderRadius: radii.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.separator,
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.sm,
          gap: 4,
          overflow: 'hidden' as const,
        },
    topRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: IS_WEB ? spacing.sm : spacing.xs,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: radii.sm + 2,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    label: {
      ...typography.subtitle,
      flex: 1,
      fontSize: 11,
      fontWeight: IS_WEB ? ('700' as const) : ('600' as const),
      textTransform: 'uppercase' as const,
      letterSpacing: IS_WEB ? 0.5 : 0.4,
      color: colors.labelTertiary,
    },
    value: {
      ...typography.body,
      fontSize: IS_WEB ? 26 : 18,
      lineHeight: IS_WEB ? 30 : undefined,
      fontWeight: '700' as const,
      letterSpacing: IS_WEB ? -0.4 : undefined,
      marginTop: IS_WEB ? 2 : 0,
    },
    hintPill: {
      alignSelf: 'flex-start' as const,
      marginTop: 2,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
    },
    hintText: {
      ...typography.subtitle,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: IS_WEB ? ('600' as const) : ('400' as const),
    },
  }));

  return (
    <View
      style={[
        styles.tile,
        {
          borderColor: colorWithAlpha(tone, isDark ? 0.32 : IS_WEB ? 0.18 : 0.16),
        },
      ]}
    >
      <View style={styles.topRow}>
        {icon && IS_WEB ? (
          <View
            style={[styles.iconWrap, { backgroundColor: colorWithAlpha(tone, isDark ? 0.2 : 0.1) }]}
          >
            <Ionicons name={icon} size={15} color={tone} />
          </View>
        ) : icon ? (
          <Ionicons name={icon} size={14} color={tone} />
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.value, { color: atLimit ? colors.warning : colors.labelPrimary }]}>
        {value}
      </Text>
      {hint ? (
        IS_WEB ? (
          <View
            style={[
              styles.hintPill,
              {
                backgroundColor: colorWithAlpha(tone, isDark ? 0.18 : 0.1),
                borderColor: colorWithAlpha(tone, isDark ? 0.28 : 0.2),
              },
            ]}
          >
            <Text style={[styles.hintText, { color: atLimit ? colors.warning : tone }]}>
              {hint}
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.hintText, { color: atLimit ? colors.warning : colors.labelSecondary }]}
          >
            {hint}
          </Text>
        )
      ) : null}
    </View>
  );
}
