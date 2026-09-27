import { StyleSheet, Text, View } from 'react-native';

import { colorWithAlpha, fontBold, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type AdminKpiCardProps = {
  label: string;
  value: number;
  accent: 'primary' | 'secondary' | 'tertiary' | 'warning';
  hint?: string;
  compact?: boolean;
};

export function AdminKpiCard({ label, value, accent, hint, compact = false }: AdminKpiCardProps) {
  const { colors, spacing } = useTheme();
  const accentColor = colors[accent];

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    card: {
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      borderLeftWidth: 4,
      gap: spacing.xs,
    },
    label: {
      fontFamily: fontSemibold,
      color: colors.labelSecondary,
      letterSpacing: 0.2,
    },
    value: {
      fontFamily: fontBold,
      color: colors.labelPrimary,
      letterSpacing: -0.8,
    },
    hint: {
      fontFamily: fontSemibold,
      fontSize: 12,
      color: colors.labelTertiary,
      marginTop: 2,
    },
  }));

  return (
    <View
      style={[
        styles.card,
        {
          flexBasis: compact ? '47%' : 160,
          minWidth: compact ? 140 : 160,
          maxWidth: compact ? '100%' : undefined,
          paddingVertical: compact ? spacing.md : spacing.lg,
          paddingHorizontal: compact ? spacing.md : spacing.lg,
          borderLeftColor: accentColor,
          backgroundColor: colorWithAlpha(accentColor, 0.06),
        },
      ]}
      accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ''}`}>
      <Text style={[styles.label, { fontSize: compact ? 12 : 13 }]}>{label}</Text>
      <Text
        style={[
          styles.value,
          {
            fontSize: compact ? 28 : 36,
            lineHeight: compact ? 32 : 40,
          },
        ]}>
        {value.toLocaleString()}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
